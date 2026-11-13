# نجوى الليل

A personal Arabic literary journal: poems, articles, curated issues and a novel published chapter by chapter. It is a static site generated from Markdown and published on GitHub Pages, with an Arabic admin dashboard at `/admin/`.

**دليل بالعربيّة:** [GUIDE-ar.md](GUIDE-ar.md) is the full Arabic guide: setup, sign-in, writing, publishing and security.

- Site: https://as11223300.github.io/najwa-al-layl/
- Dashboard: https://as11223300.github.io/najwa-al-layl/admin/

## How it is put together

| Repository | Visibility | Holds |
|---|---|---|
| `As11223300/najwa-al-layl-studio` | private | this source, all writing (drafts included), uploaded images |
| `As11223300/najwa-al-layl` | public | only the built site, on the `gh-pages` branch that GitHub Pages serves |

1. The dashboard ([Sveltia CMS](https://sveltiacms.app), served from the site itself) commits to the private studio repository.
2. `.github/workflows/publish.yml` runs there on every push. It builds the site and force-pushes `dist/` to the public repository's `gh-pages` branch, using the `PUBLISH_TOKEN` Actions secret: a fine-grained token with Contents read/write on the public repository only.
3. What never reaches the public repository: entries with the «منشور» switch off (`published: false`) or `draft: true`, and uploaded images that no published entry uses.

Sign-in uses a fine-grained GitHub token (Contents read/write on the studio repository only). The author pastes it into the dashboard, and it is kept in that browser only. Nothing secret is in this repository or on the site.

## Content

| Folder | What | Written by |
|---|---|---|
| `content/poems/*.md` | poems; the body keeps every line and leading space | dashboard or hand |
| `content/articles/*.md` | articles in Markdown, with footnotes and images | dashboard or hand |
| `content/collections/*.md` | `kind: season` (numbered issues) or `kind: theme` (dossiers) | dashboard or hand |
| `content/novels/<novel>.md` | a novel: title, tagline, status, cover, synopsis | dashboard |
| `content/chapters/*.md` | chapters: `novel: <novel slug>`, `order: <n>` | dashboard |
| `content/novels/<novel>/novel.md` + `chapters/NN-*.md` | the older hand-written novel layout, still supported | hand |
| `content/settings.json` | site name, tagline, author, description (overrides `site.config.mjs`) | dashboard |
| `content/about.md` | the about page | dashboard or hand |
| `public/uploads/` | uploaded images | dashboard |
| `content/_templates/` | copy-ready templates for hand editing; never published | |

Front matter is YAML. An entry the build can't use (no title, bad date, unknown novel) is skipped with a warning in the build log, rather than failing the whole build.

## Local development

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173. Pages regenerate on save. `npm run build` writes `dist/`; set `BASE_PATH=/najwa-al-layl/` to build for the published address.

## Code map

- `src/site/content.mjs` reads content.
- `src/site/generate.mjs` builds the pages.
- `src/site/templates.mjs` holds the HTML.
- `src/site/theme/` holds the styles, search, night mode and the novel reader.
- `src/site/admin.mjs` builds the dashboard config, preview templates and self-hosted Sveltia files.
- `DESIGN.md` documents the design system.
- `scripts/make-paper-texture.py` regenerates the paper grain.
