// Builds every page of the journal from content/ into an output folder
// that Vite then serves (dev) or bundles (build).

import fs from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';
import markedFootnote from 'marked-footnote';
import { loadContent, linkContent } from './content.mjs';
import { createTemplates, escapeHtml, endMark } from './templates.mjs';
import { arabicDigits, normalizeArabic } from './arabic.mjs';

const ARROW_UP =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M7 10l5-5 5 5"/></svg>';

function createMarkdown() {
  const md = new Marked({ gfm: true });
  md.use(markedFootnote({ description: 'الهوامش', backRefLabel: 'العودة إلى موضع الهامش {0}' }));
  return (source) =>
    md
      .parse(source)
      // Footnote numbers in Arabic-Indic digits, and an authored icon for the
      // back link instead of a text glyph.
      .replace(/(data-footnote-ref[^>]*>)(\d+)(<\/a>)/g, (_, a, n, b) => a + arabicDigits(n) + b)
      .replace(/(data-footnote-backref[^>]*>)[^<]*(<\/a>)/g, (_, a, b) => a + ARROW_UP + b)
      .replace(/aria-label="([^"]*?)(\d+)"/g, (_, a, n) => `aria-label="${a}${arabicDigits(n)}"`);
}

// A poem keeps every line break and every leading space exactly as written.
// Blank lines separate stanzas.
export function renderPoem(body) {
  const stanzas = body
    .replace(/\r\n/g, '\n')
    .replace(/^\n+|\s+$/g, '')
    .split(/\n[ \t]*\n/);
  return `<div class="poem">${stanzas
    .map(
      (stanza) =>
        `<p class="stanza">${stanza
          .split('\n')
          .map((line) => `<span class="line">${escapeHtml(line) || '&nbsp;'}</span>`)
          .join('')}</p>`,
    )
    .join('')}</div>${endMark}`;
}

function plainText(markdownSource) {
  return markdownSource
    .replace(/\[\^[^\]]+\]:?/g, ' ')
    .replace(/[#>*_`~\[\]()!|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(text, max = 140) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

// Output is updated in place: a file is rewritten only when its bytes change,
// and files no longer produced are removed afterwards. Deleting and
// recreating the whole folder would blind the dev server's file watcher.
let written = new Set();

function write(file, contents) {
  written.add(path.resolve(file));
  const bytes = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  if (fs.existsSync(file) && fs.readFileSync(file).equals(bytes)) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, bytes);
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else write(dest, fs.readFileSync(src));
  }
}

function prune(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      prune(full);
      if (!fs.readdirSync(full).length) fs.rmdirSync(full);
    } else if (!written.has(full)) fs.rmSync(full);
  }
}

export async function generate({ root, outDir, publicOut, base = '/' }) {
  const configModule = await import(`${path.join(root, 'site.config.mjs')}?t=${Date.now()}`);
  const config = configModule.default;
  const markdown = createMarkdown();

  const loaded = loadContent(root);
  const site = { ...loaded, ...linkContent(loaded) };

  for (const c of [...site.issues, ...site.themes]) {
    const parts = c.body.trim().split(/\n\s*\n/);
    const first = parts.shift() || '';
    c.html = first ? markdown(first) : '';
    c.restHtml = parts.length ? markdown(parts.join('\n\n')) : '';
    c.excerpt = excerpt(plainText(first));
  }

  for (const n of site.novels) {
    n.html = markdown(n.body.trim() || 'لم يُكتب الملخّص بعد.');
    n.excerpt = excerpt(plainText(n.body.trim().split(/\n\s*\n/)[0] || ''), 180);
    n.coverUrl = n.cover ? `${base}novels/${n.slug}/cover${path.extname(n.cover)}` : null;
  }

  const t = createTemplates({ config, base, site });

  written = new Set();

  const page = (rel, html) => write(path.join(outDir, rel, 'index.html'), html);

  page('', t.home());
  page('issues', t.issuesPage());
  page('poems', t.sectionPage('poem'));
  page('articles', t.sectionPage('article'));
  page('archive', t.archivePage());
  for (const c of [...site.issues, ...site.themes]) page(`issues/${c.slug}`, t.collectionPage(c));

  const index = [];
  for (const p of site.pieces) {
    const html = p.type === 'poem' ? renderPoem(p.body) : `<div class="prose">${markdown(p.body)}</div>`;
    page(`${p.type === 'poem' ? 'poems' : 'articles'}/${p.slug}`, t.piecePage(p, html));
    index.push({
      s: p.slug,
      t: normalizeArabic(p.title),
      x: normalizeArabic(p.type === 'poem' ? p.body : plainText(p.body)),
    });
  }

  page('novels', t.novelsPage());
  for (const n of site.novels) {
    page(`novels/${n.slug}`, t.novelPage(n));
    for (const c of n.chapters) page(`novels/${n.slug}/${c.slug}`, t.chapterPage(n, c, markdown(c.body)));
  }

  const aboutBody = site.about ? site.about.body.trim() : '';
  page('about', t.aboutPage(aboutBody ? markdown(aboutBody) : ''));
  write(path.join(outDir, '404.html'), t.notFound());

  // Theme files sit beside the pages so Vite resolves and bundles them.
  copyDir(path.join(root, 'src/site/theme'), path.join(outDir, 'assets'));

  // Files served as they are: the search index, the favicon, .nojekyll.
  copyDir(path.join(root, 'public'), publicOut);
  write(path.join(publicOut, 'search.json'), JSON.stringify(index));
  for (const n of site.novels) {
    if (n.cover) {
      write(path.join(publicOut, 'novels', n.slug, `cover${path.extname(n.cover)}`), fs.readFileSync(n.cover));
    }
  }

  prune(outDir);
  prune(publicOut);

  return { pages: site.pieces.length, issues: site.issues.length, themes: site.themes.length };
}
