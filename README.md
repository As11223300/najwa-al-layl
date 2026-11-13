# نجوى الليل

A personal Arabic literary journal for poems, articles and a novel published chapter by chapter. It is built from plain Markdown files and published as a static site on GitHub Pages.

Every piece in `content/` right now is a **sample** marked `placeholder: true`. Replace the samples with your own writing.

---

## 1. Edit your writing on github.com (no tools needed)

You can do everything from the browser:

1. Open your repository on github.com and go into the `content/` folder.
2. To **edit** a piece, open its file, click the pencil icon, change the text, then click **Commit changes**.
3. To **add** a piece, open the right folder (for example `content/poems`), click **Add file → Create new file**, give it a name such as `my-new-poem.md`, write it (format below), then click **Commit changes**.
4. Wait about two minutes. GitHub rebuilds and republishes the site on its own; you can watch progress in the repository's **Actions** tab.

File names become web addresses, so use simple Latin letters, numbers and dashes (`laylat-al-matar.md`, not spaces or Arabic).

## 2. What goes where

```
content/
  poems/              one file per poem
  articles/           one file per article
  collections/        seasonal issues and thematic dossiers
  novels/
    <novel-name>/
      novel.md        title, synopsis, status, optional cover image
      chapters/       one file per chapter: 01-..., 02-..., in reading order
  about.md            the «عن الكاتب» page
site.config.mjs       site name, tagline, your name, date format
```

### A poem: `content/poems/laylat-al-matar.md`

```markdown
---
title: ليلة المطر
date: 2025-03-02
collections: [spring-2025]
---
أوّل سطر في القصيدة
    سطرٌ ثانٍ بمسافة في أوّله

مقطع جديد بعد سطر فارغ
```

Line breaks and leading spaces are kept exactly as you type them. A blank line starts a new stanza.

### An article: `content/articles/an-al-sahar.md`

```markdown
---
title: عن السهر
date: 2025-03-10
summary: سطر أو سطران يظهران تحت العنوان.
collections: [spring-2025]
---
نصّ المقالة بصيغة Markdown.

## عنوان فرعي

فقرة فيها هامش.[^1]

***

[^1]: نصّ الهامش.
```

`***` on its own line draws the three-star section break.

### A collection: `content/collections/spring-2025.md`

```markdown
---
title: عنوان العدد
kind: season          # season = a numbered issue, theme = a dossier
label: ربيع ٢٠٢٥       # shown beside the issue number
date: 2025-03-20
contents:             # optional: the order of pieces in the issue
  - laylat-al-matar
  - an-al-sahar
---
The first paragraph appears on the cover. Later paragraphs appear on the issue's own page.
```

The newest `season` collection becomes the home-page cover. Add `featured: true` to put a different one there. Issues are numbered automatically, oldest first.

### The novel: `content/novels/bayt-fi-akhir-al-shita/`

`novel.md`:

```markdown
---
title: اسم الرواية
tagline: رواية
status: ongoing       # ongoing or complete
date: 2025-01-10
cover: cover.jpg      # optional: an image in the same folder
---
The synopsis, in as many paragraphs as you like.
```

**To add a chapter**, create the next numbered file in `chapters/`, for example `chapters/04-al-matar.md`:

```markdown
---
title: المطر
date: 2025-02-21
---
نصّ الفصل…
```

The number at the start of the file name sets the order. It does not appear on the site: chapter names («الفصل الرابع») are written out automatically. Previous/next links, the chapter index, reading time, bookmarks and "continue reading" all update by themselves.

To start a second novel, copy the whole novel folder under a new name. The section then becomes «الروايات», a shelf of books.

### Common to every file

- `placeholder: true` shows the "sample text" note; delete the line when the text is yours.
- `draft: true` hides a piece, chapter or novel without deleting it.
- Dates are written `YYYY-MM-DD`; they appear in Arabic with Arabic-Indic digits.

## 3. Publish on GitHub Pages (one-time setup)

1. Create a GitHub account at github.com if you don't have one.
2. Create a new **empty** repository: click **+ → New repository**, name it (for example `najwa-al-layl`), choose **Public**, and don't add a README.
3. Upload this project to it, using one of these:
   - **From a computer with Git:** unzip the project, open a terminal in its folder, and run the commands in section 5.
   - **From the browser only:** on the empty repository's page, click **uploading an existing file**, then drag in everything from the unzipped folder, including the hidden `.github` folder, and click **Commit changes**. Some systems hide folders whose names start with a dot; turn on "show hidden files" first. The `.github/workflows/deploy.yml` file is what publishes the site.
4. In the repository, open **Settings → Pages**, and under **Build and deployment → Source** choose **GitHub Actions**.
5. Open the **Actions** tab. The "Deploy to GitHub Pages" run starts on every change to `main`; start it by hand with **Run workflow** the first time if needed.
6. When it finishes, your site is live at:
   `https://<your-username>.github.io/<repository-name>/`

If the repository is named `<your-username>.github.io`, the site lives at `https://<your-username>.github.io/` instead. The build works out the right address for you.

## 4. Change the look or the settings

- `site.config.mjs` holds the site name, tagline, author name, and the date style (`ar-u-nu-arab` gives «يناير»; `ar-SY-u-nu-arab` gives «كانون الثاني»).
- `DESIGN.md` describes the design system: colours, type, components and rules.
- The templates live in `src/site/templates.mjs`, the styles in `src/site/theme/style.css`, and the browser behaviour (search, night mode, bookmarks) in `src/site/theme/site.js`.
- The paper texture is generated by `scripts/make-paper-texture.py`.

## 5. Work on your own computer (optional)

You need [Node.js](https://nodejs.org) 22 or newer and Git.

```bash
git clone https://github.com/<your-username>/<repository-name>.git
cd <repository-name>
npm install
npm run dev
```

Open http://localhost:5173. Pages update as soon as you save a file in `content/`.

To publish what you changed:

```bash
git add -A
git commit -m "Add a new chapter"
git push
```

`npm run build` writes the finished site to `dist/`, and `npm run preview` serves that build locally.

The first time you upload from a computer, run this from the project folder instead:

```bash
git remote add origin https://github.com/<your-username>/<repository-name>.git
git branch -M main
git push -u origin main
```

## 6. Good to know

- Search covers poem and article titles and full text, and ignores differences in hamza, taa marbuta, alef maqsura and diacritics.
- Bookmarks, reading position and the night/day choice are stored in each reader's own browser. Nothing is sent anywhere, and there is no account.
- Fonts (Aref Ruqaa, Amiri, Noto Naskh Arabic) are bundled with the site, not loaded from Google.
