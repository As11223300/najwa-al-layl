// Reads the Markdown content folder into plain objects.

import fs from 'node:fs';
import path from 'node:path';

// A small front-matter reader: `key: value`, `key: [a, b]`, and
// `key:` followed by `  - item` lines. Quotes around values are optional.
export function parseFrontMatter(source, file) {
  const text = source.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return { data: {}, body: text };
  const end = text.indexOf('\n---', 4);
  if (end === -1) throw new Error(`${file}: front matter has no closing ---`);
  const head = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^[^\n]*\n/, '');
  const data = {};
  let listKey = null;
  for (const raw of head.split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const item = raw.match(/^\s+-\s*(.*)$/);
    if (item && listKey) {
      data[listKey].push(unquote(item[1]));
      continue;
    }
    const pair = raw.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!pair) throw new Error(`${file}: cannot read front matter line «${raw}»`);
    const [, key, value] = pair;
    listKey = null;
    if (value === '') {
      data[key] = [];
      listKey = key;
    } else if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value.slice(1, -1).split(',').map((v) => unquote(v)).filter(Boolean);
    } else {
      data[key] = scalar(unquote(value));
    }
  }
  return { data, body };
}

function unquote(value) {
  const v = value.trim().replace(/\s+#.*$/, '');
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function scalar(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

function readFolder(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => {
      const file = path.join(dir, f);
      const { data, body } = parseFrontMatter(fs.readFileSync(file, 'utf8'), file);
      return { slug: f.replace(/\.md$/, ''), file, data, body };
    });
}

function toDate(value, file) {
  const date = new Date(`${value}T00:00:00Z`);
  if (!value || Number.isNaN(date.getTime())) {
    throw new Error(`${file}: date must look like 2025-01-31 (got «${value ?? ''}»)`);
  }
  return date;
}

function asList(value) {
  if (value === undefined || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

export function loadContent(root) {
  const contentDir = path.join(root, 'content');
  const pieces = [];

  for (const [folder, type] of [['poems', 'poem'], ['articles', 'article']]) {
    for (const entry of readFolder(path.join(contentDir, folder))) {
      const { data } = entry;
      if (data.draft === true) continue;
      if (!data.title) throw new Error(`${entry.file}: missing title`);
      pieces.push({
        type,
        slug: entry.slug,
        file: entry.file,
        title: String(data.title),
        date: toDate(data.date, entry.file),
        summary: data.summary ? String(data.summary) : '',
        collections: asList(data.collections),
        placeholder: data.placeholder === true,
        body: entry.body,
      });
    }
  }

  const collections = readFolder(path.join(contentDir, 'collections')).map((entry) => {
    const { data } = entry;
    if (!data.title) throw new Error(`${entry.file}: missing title`);
    if (data.kind !== 'season' && data.kind !== 'theme') {
      throw new Error(`${entry.file}: kind must be "season" or "theme"`);
    }
    return {
      slug: entry.slug,
      file: entry.file,
      kind: data.kind,
      title: String(data.title),
      label: data.label ? String(data.label) : '',
      date: toDate(data.date, entry.file),
      featured: data.featured === true,
      order: asList(data.contents),
      body: entry.body,
    };
  });

  const about = readFolder(contentDir).find((e) => e.slug === 'about');

  return { pieces, collections, about, novels: loadNovels(path.join(contentDir, 'novels')) };
}

// Links pieces and collections both ways and fixes each collection's order:
// slugs listed under `contents:` first, in that order, then any other piece
// that names the collection, oldest first.
export function linkContent({ pieces, collections }) {
  const bySlug = new Map();
  for (const p of pieces) {
    if (bySlug.has(p.slug)) {
      throw new Error(`Two pieces share the file name «${p.slug}»: ${bySlug.get(p.slug).file} and ${p.file}`);
    }
    bySlug.set(p.slug, p);
  }
  const collBySlug = new Map(collections.map((c) => [c.slug, c]));

  for (const p of pieces) {
    for (const c of p.collections) {
      if (!collBySlug.has(c)) throw new Error(`${p.file}: unknown collection «${c}»`);
    }
  }

  for (const c of collections) {
    const listed = [];
    for (const slug of c.order) {
      const piece = bySlug.get(slug);
      if (!piece) throw new Error(`${c.file}: contents lists «${slug}», which is not a poem or article file`);
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

// Novels: content/novels/<novel>/novel.md holds the book (title, synopsis,
// cover); content/novels/<novel>/chapters/*.md holds one file per chapter,
// in file-name order (start names with 01-, 02-, ... to fix the order).
export function loadNovels(dir) {
  if (!fs.existsSync(dir)) return [];
  const novels = [];
  for (const slug of fs.readdirSync(dir).sort()) {
    const folder = path.join(dir, slug);
    const file = path.join(folder, 'novel.md');
    if (!fs.statSync(folder).isDirectory() || !fs.existsSync(file)) continue;
    const { data, body } = parseFrontMatter(fs.readFileSync(file, 'utf8'), file);
    if (data.draft === true) continue;
    if (!data.title) throw new Error(`${file}: missing title`);
    const chapters = readFolder(path.join(folder, 'chapters'))
      .sort((a, b) => a.slug.localeCompare(b.slug, 'en', { numeric: true }))
      .filter((c) => c.data.draft !== true)
      .map((c) => {
        if (!c.data.title) throw new Error(`${c.file}: missing title`);
        return {
          slug: c.slug.replace(/^\d+[-_]?/, '') || c.slug,
          file: c.file,
          title: String(c.data.title),
          date: c.data.date ? toDate(c.data.date, c.file) : null,
          placeholder: c.data.placeholder === true,
          body: c.body,
        };
      });
    const seen = new Set();
    for (const c of chapters) {
      if (seen.has(c.slug)) throw new Error(`${c.file}: two chapters of «${slug}» share the name «${c.slug}»`);
      seen.add(c.slug);
    }
    chapters.forEach((c, i) => (c.number = i + 1));
    let cover = null;
    if (data.cover) {
      cover = path.join(folder, String(data.cover));
      if (!fs.existsSync(cover)) throw new Error(`${file}: cover image «${data.cover}» not found next to novel.md`);
    }
    novels.push({
      slug,
      file,
      title: String(data.title),
      tagline: data.tagline ? String(data.tagline) : '',
      author: data.author ? String(data.author) : '',
      status: data.status === 'complete' ? 'complete' : 'ongoing',
      date: data.date ? toDate(data.date, file) : null,
      placeholder: data.placeholder === true,
      cover,
      body,
      chapters,
    });
  }
  return novels;
}
