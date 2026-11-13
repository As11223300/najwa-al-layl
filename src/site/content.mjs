// Reads the content folder into plain objects.
//
// Content is written either by hand or by the admin dashboard (Sveltia CMS),
// so this reader is forgiving: an entry it cannot use is skipped with a
// warning in the build log instead of stopping the whole site from updating.

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export const warnings = [];
function warn(file, message) {
  warnings.push(`${path.relative(process.cwd(), file)}: ${message}`);
}

export function parseFrontMatter(source, file) {
  const text = source.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n?---[ \t]*(?:\n|$)/);
  if (!match) return { data: {}, body: text };
  let data = {};
  try {
    data = YAML.parse(match[1]) || {};
  } catch (err) {
    warn(file, `front matter could not be read (${err.message.split('\n')[0]})`);
    data = { __invalid: true };
  }
  return { data, body: text.slice(match[0].length) };
}

function readFolder(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && !f.startsWith('.'))
    .sort()
    .map((f) => {
      const file = path.join(dir, f);
      const { data, body } = parseFrontMatter(fs.readFileSync(file, 'utf8'), file);
      return { slug: f.replace(/\.md$/, '').normalize('NFC'), file, data, body };
    });
}

// Accepts 2025-01-31, a full ISO date-time, or a YAML date.
function toDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (!value) return null;
  const s = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : new Date(s);
  return Number.isNaN(date.getTime()) ? null : date;
}

function asList(value) {
  if (value === undefined || value === null || value === '') return [];
  return (Array.isArray(value) ? value : [value]).map((v) => String(v).normalize('NFC'));
}

// Hidden from the public site: `draft: true`, or `published: false` (the
// dashboard's «منشور» switch turned off).
function isHidden(data) {
  return data.__invalid === true || data.draft === true || data.published === false;
}

export function loadContent(root) {
  warnings.length = 0;
  const contentDir = path.join(root, 'content');
  const pieces = [];

  for (const [folder, type] of [['poems', 'poem'], ['articles', 'article']]) {
    for (const entry of readFolder(path.join(contentDir, folder))) {
      const { data } = entry;
      if (isHidden(data)) continue;
      if (!data.title) {
        warn(entry.file, 'skipped: it has no title');
        continue;
      }
      const date = toDate(data.date);
      if (!date) {
        warn(entry.file, `skipped: date must look like 2025-01-31 (got «${data.date ?? ''}»)`);
        continue;
      }
      pieces.push({
        type,
        slug: entry.slug,
        file: entry.file,
        title: String(data.title),
        date,
        summary: data.summary ? String(data.summary).trim() : '',
        collections: asList(data.collections),
        placeholder: data.placeholder === true,
        body: entry.body,
      });
    }
  }

  const collections = [];
  for (const entry of readFolder(path.join(contentDir, 'collections'))) {
    const { data } = entry;
    if (isHidden(data)) continue;
    if (!data.title) {
      warn(entry.file, 'skipped: it has no title');
      continue;
    }
    const kind = data.kind === 'theme' ? 'theme' : 'season';
    collections.push({
      slug: entry.slug,
      file: entry.file,
      kind,
      title: String(data.title),
      label: data.label ? String(data.label) : '',
      date: toDate(data.date) || new Date(0),
      featured: data.featured === true,
      order: asList(data.contents),
      body: entry.body,
    });
  }

  const rootEntries = readFolder(contentDir);
  const about = rootEntries.find((e) => e.slug === 'about');

  let settings = {};
  const settingsFile = path.join(contentDir, 'settings.json');
  if (fs.existsSync(settingsFile)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    } catch (err) {
      warn(settingsFile, `could not be read (${err.message})`);
    }
  }

  return { pieces, collections, about, settings, novels: loadNovels(contentDir) };
}

// Links pieces and collections both ways and fixes each collection's order:
// slugs listed under `contents:` first, in that order, then any other piece
// that names the collection, oldest first.
export function linkContent({ pieces, collections }) {
  const bySlug = new Map();
  for (const p of [...pieces]) {
    if (bySlug.has(p.slug)) {
      warn(p.file, `skipped: another piece already uses the name «${p.slug}»`);
      pieces.splice(pieces.indexOf(p), 1);
      continue;
    }
    bySlug.set(p.slug, p);
  }
  const collBySlug = new Map(collections.map((c) => [c.slug, c]));

  for (const p of pieces) {
    const known = p.collections.filter((c) => collBySlug.has(c));
    for (const c of p.collections) if (!collBySlug.has(c)) warn(p.file, `unknown or unpublished collection «${c}» ignored`);
    p.collections = known;
  }

  for (const c of collections) {
    const listed = [];
    for (const slug of c.order) {
      const piece = bySlug.get(slug);
      if (!piece) {
        warn(c.file, `contents lists «${slug}», which is not a published poem or article; ignored`);
        continue;
      }
      if (!listed.includes(piece)) listed.push(piece);
    }
    const extra = pieces
      .filter((p) => p.collections.includes(c.slug) && !listed.includes(p))
      .sort((a, b) => a.date - b.date);
    c.pieces = [...listed, ...extra];
  }

  // Seasonal collections are the numbered issues, oldest = issue 1.
  const issues = collections.filter((c) => c.kind === 'season').sort((a, b) => a.date - b.date);
  issues.forEach((c, i) => (c.number = i + 1));
  const themes = collections.filter((c) => c.kind === 'theme').sort((a, b) => b.date - a.date);

  for (const p of pieces) {
    p.memberOf = collections.filter((c) => c.pieces.includes(p));
    // The piece's home issue drives its running head and previous/next:
    // its seasonal issue when it has one, otherwise its first theme.
    p.home = p.memberOf.find((c) => c.kind === 'season') || p.memberOf[0] || null;
  }

  const current = issues.find((c) => c.featured) || issues[issues.length - 1] || themes[0] || null;

  return { pieces, issues, themes, current };
}

function novelFrom(slug, file, data, body) {
  return {
    slug,
    file,
    title: String(data.title),
    tagline: data.tagline ? String(data.tagline) : '',
    author: data.author ? String(data.author) : '',
    status: data.status === 'complete' ? 'complete' : 'ongoing',
    date: toDate(data.date),
    placeholder: data.placeholder === true,
    cover: data.cover ? String(data.cover) : '',
    body,
    chapters: [],
  };
}

function chapterFrom(slug, file, data, body, fallbackOrder) {
  return {
    slug,
    file,
    title: String(data.title),
    order: Number.isFinite(Number(data.order)) && data.order !== null && data.order !== '' ? Number(data.order) : fallbackOrder,
    date: toDate(data.date),
    placeholder: data.placeholder === true,
    body,
  };
}

// Novels come in two shapes:
//  - from the dashboard: content/novels/<novel>.md for the book, and
//    content/chapters/<chapter>.md with `novel: <novel>` and an `order` number;
//  - by hand: content/novels/<novel>/novel.md, with the chapters in
//    content/novels/<novel>/chapters/, ordered by file name (01-, 02-, ...).
export function loadNovels(contentDir) {
  const dir = path.join(contentDir, 'novels');
  const novels = new Map();

  for (const entry of readFolder(dir)) {
    if (isHidden(entry.data)) continue;
    if (!entry.data.title) {
      warn(entry.file, 'skipped: the novel has no title');
      continue;
    }
    novels.set(entry.slug, novelFrom(entry.slug, entry.file, entry.data, entry.body));
  }

  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir).sort()) {
      const folder = path.join(dir, name);
      const file = path.join(folder, 'novel.md');
      if (name.startsWith('_') || name.startsWith('.') || !fs.statSync(folder).isDirectory() || !fs.existsSync(file)) continue;
      const slug = name.normalize('NFC');
      const { data, body } = parseFrontMatter(fs.readFileSync(file, 'utf8'), file);
      if (isHidden(data)) continue;
      if (!data.title) {
        warn(file, 'skipped: the novel has no title');
        continue;
      }
      if (novels.has(slug)) {
        warn(file, `skipped: another novel already uses the name «${slug}»`);
        continue;
      }
      const novel = novelFrom(slug, file, data, body);
      if (novel.cover && !novel.cover.startsWith('/') && !/^https?:/.test(novel.cover)) {
        novel.coverFile = path.join(folder, novel.cover);
        if (!fs.existsSync(novel.coverFile)) {
          warn(file, `cover image «${novel.cover}» not found next to novel.md`);
          novel.coverFile = null;
        }
      }
      readFolder(path.join(folder, 'chapters')).forEach((c, i) => {
        if (isHidden(c.data)) return;
        if (!c.data.title) return warn(c.file, 'skipped: the chapter has no title');
        novel.chapters.push(chapterFrom(c.slug.replace(/^\d+[-_]?/, '') || c.slug, c.file, c.data, c.body, i + 1));
      });
      novels.set(slug, novel);
    }
  }

  for (const c of readFolder(path.join(contentDir, 'chapters'))) {
    if (isHidden(c.data)) continue;
    if (!c.data.title) {
      warn(c.file, 'skipped: the chapter has no title');
      continue;
    }
    const novel = novels.get(String(c.data.novel ?? '').normalize('NFC'));
    if (!novel) {
      warn(c.file, `skipped: it belongs to no published novel («${c.data.novel ?? ''}»)`);
      continue;
    }
    novel.chapters.push(chapterFrom(c.slug, c.file, c.data, c.body, 1e6));
  }

  for (const novel of novels.values()) {
    novel.chapters.sort((a, b) => a.order - b.order || (a.date || 0) - (b.date || 0) || a.slug.localeCompare(b.slug));
    const seen = new Set();
    novel.chapters = novel.chapters.filter((c) => {
      if (seen.has(c.slug)) {
        warn(c.file, `skipped: two chapters of «${novel.title}» share the name «${c.slug}»`);
        return false;
      }
      seen.add(c.slug);
      return true;
    });
    novel.chapters.forEach((c, i) => (c.number = i + 1));
  }

  return [...novels.values()].sort((a, b) => (a.date || 0) - (b.date || 0));
}
