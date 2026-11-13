// Builds every page of the journal from content/ into an output folder
// that Vite then serves (dev) or bundles (build).

import fs from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';
import markedFootnote from 'marked-footnote';
import { loadContent, linkContent, warnings } from './content.mjs';
import { writeAdmin } from './admin.mjs';
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
  const loaded = loadContent(root);
  const site = { ...loaded, ...linkContent(loaded) };

  // Site information edited in the dashboard (content/settings.json) wins
  // over the defaults in site.config.mjs.
  const config = { ...configModule.default };
  for (const key of ['name', 'tagline', 'author', 'description']) {
    if (typeof site.settings[key] === 'string') config[key] = site.settings[key].trim();
  }
  if (!config.name) config.name = configModule.default.name;

  // Uploaded images are stored with the published site's address
  // (/najwa-al-layl/uploads/...); rewrite them for whatever base this build
  // uses, so they also show in local previews.
  const uploads = (value) => value.replace(/^(?:\/[^/"'\s]+)?\/uploads\//, `${base}uploads/`);
  const baseMarkdown = createMarkdown();
  const markdown = (source) =>
    baseMarkdown(source).replace(/(src|href)="((?:\/[^/"\s]+)?\/uploads\/[^"]*)"/g, (_, attr, value) => `${attr}="${uploads(value)}"`);

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
    if (n.coverFile) n.coverUrl = `${base}novels/${encodeURIComponent(n.slug)}/cover${path.extname(n.coverFile)}`;
    else if (/^https?:\/\//.test(n.cover)) n.coverUrl = n.cover;
    else if (n.cover) n.coverUrl = uploads(n.cover.startsWith('/') ? n.cover : `/uploads/${n.cover}`);
    else n.coverUrl = null;
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
  // Uploaded images are copied only when published content uses them, so
  // an image uploaded for a private draft never reaches the public site.
  const publicDir = path.join(root, 'public');
  for (const entry of fs.readdirSync(publicDir, { withFileTypes: true })) {
    if (entry.name === 'uploads') continue;
    const from = path.join(publicDir, entry.name);
    if (entry.isDirectory()) copyDir(from, path.join(publicOut, entry.name));
    else write(path.join(publicOut, entry.name), fs.readFileSync(from));
  }
  const used = new Set();
  const collectUploads = (html) => {
    for (const m of String(html).matchAll(/\/uploads\/([^"'\s)?#]+)/g)) used.add(decodeURIComponent(m[1]));
  };
  for (const file of [...written]) if (file.endsWith('.html')) collectUploads(fs.readFileSync(file, 'utf8'));
  for (const n of site.novels) if (n.coverUrl) collectUploads(n.coverUrl);
  for (const name of used) {
    const from = path.join(publicDir, 'uploads', name);
    if (from.startsWith(path.join(publicDir, 'uploads') + path.sep) && fs.existsSync(from) && fs.statSync(from).isFile()) {
      write(path.join(publicOut, 'uploads', name), fs.readFileSync(from));
    }
  }
  write(path.join(publicOut, 'search.json'), JSON.stringify(index));
  for (const n of site.novels) {
    if (n.coverFile) write(path.join(publicOut, 'novels', n.slug, `cover${path.extname(n.coverFile)}`), fs.readFileSync(n.coverFile));
  }

  // The admin dashboard at /admin/.
  writeAdmin({ root, publicOut, base, write, cms: configModule.default.cms });

  prune(outDir);
  prune(publicOut);

  if (warnings.length) {
    console.warn(`\n[najwa] ${warnings.length} content warning(s):\n  - ${warnings.join('\n  - ')}\n`);
  }
  return { pages: site.pieces.length, issues: site.issues.length, themes: site.themes.length, warnings: [...warnings] };
}
