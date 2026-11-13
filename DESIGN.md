---
name: نجوى الليل
description: One writer's Arabic night journal of poems, essays and a novel in chapters, set like a modernist poetry review in midnight ink on warm vintage paper.
colors:
  vintage-paper: "#f1e7d1"
  paper-deep: "#e6dac0"
  ink: "#1b1c30"
  ink-secondary: "#4b4a62"
  midnight: "#1a2160"
  midnight-field: "#121844"
  on-midnight: "#f3ead5"
  on-midnight-secondary: "#cdd1ea"
  night-paper: "#090b20"
  night-deep: "#10142f"
  night-ink: "#eee4cd"
  night-ink-secondary: "#b7b3c3"
  night-accent: "#c3c9f2"
  night-field: "#161d52"
typography:
  cover-title:
    fontFamily: "Aref Ruqaa, Amiri, serif"
    fontSize: "clamp(2.9rem, 8.5vw, 6.25rem)"
    fontWeight: 700
    lineHeight: 1.4
  page-title:
    fontFamily: "Aref Ruqaa, Amiri, serif"
    fontSize: "clamp(2.3rem, 6vw, 3.6rem)"
    fontWeight: 700
    lineHeight: 1.5
  contents-title:
    fontFamily: "Aref Ruqaa, Amiri, serif"
    fontSize: "clamp(1.45rem, 2.8vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.65
  poem:
    fontFamily: "Amiri, Noto Naskh Arabic, serif"
    fontSize: "clamp(1.4rem, 2.6vw, 1.6rem)"
    fontWeight: 400
    lineHeight: 2.1
  body:
    fontFamily: "Amiri, Noto Naskh Arabic, serif"
    fontSize: "clamp(1.25rem, 2.2vw, 1.375rem)"
    fontWeight: 400
    lineHeight: 2
  chapter:
    fontFamily: "Amiri, Noto Naskh Arabic, serif"
    fontSize: "clamp(1.3rem, 2.4vw, 1.45rem)"
    fontWeight: 400
    lineHeight: 2.15
  label:
    fontFamily: "Noto Naskh Arabic, Amiri, serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  hairline: "2px"
  pill: "999px"
spacing:
  gutter: "clamp(1.25rem, 4vw, 3rem)"
  column: "42rem"
  chapter-column: "38rem"
  wide: "76rem"
components:
  cover:
    backgroundColor: "{colors.midnight-field}"
    textColor: "{colors.on-midnight}"
    typography: "{typography.cover-title}"
  book-cover:
    backgroundColor: "{colors.midnight-field}"
    textColor: "{colors.on-midnight}"
    width: "clamp(13rem, 30vw, 19rem)"
  button-primary:
    backgroundColor: "{colors.midnight-field}"
    textColor: "{colors.on-midnight}"
    rounded: "{rounded.hairline}"
    padding: "0.65rem 1.6rem"
  segmented-active:
    backgroundColor: "{colors.midnight-field}"
    textColor: "{colors.on-midnight}"
    rounded: "{rounded.pill}"
    padding: "0.35rem 1.1rem"
  placeholder-note:
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.hairline}"
    padding: "0.6rem 1rem"
---

# Design System: نجوى الليل

## Overview

The site is one writer's night journal: a personal literary journal you might find on a quiet winter night, set in the manner of the modernist Arabic poetry reviews of 1950s and 60s Beirut. Curated collections are its issues: seasonal collections are numbered issues (العدد) and thematic collections are dossiers (ملفّ). The home page is the current issue's cover, its contents set large in ivory calligraphy on a field of midnight ink. The novel is a bound book inside the journal, published chapter by chapter.

The journal owns the frame (masthead, covers, running heads, section openers, colophon). The reading column stays calm: a Bulaq-style naskh at a generous size on warm, grained paper. The sky is the only ornament, and it stays faint: each cover carries its own constellation, a single four-point star closes a poem or opens a chapter, and a crescent marks the colophon.

Everything is right-to-left with Arabic-Indic digits. At night the paper turns midnight and the ink turns ivory.

## Colors

### Primary
- **Midnight** `#1a2160` for titles, links and accents on paper; **midnight field** `#121844` for whole regions: issue covers, the book cover, buttons, the colophon. Night: `#c3c9f2` for accents and `#161d52` for fields.

### Neutral
- **Vintage paper** `#f1e7d1` under a seamless paper-grain texture (`src/site/theme/textures/paper.jpg`, multiplied in), with **paper deep** `#e6dac0` for hover grounds. Night: `#090b20` / `#10142f`, with the same grain.
- **Ink** `#1b1c30` for reading text; **ink secondary** `#4b4a62` for meta. Night: `#eee4cd` / `#b7b3c3`.
- **On midnight** `#f3ead5`; **on midnight secondary** `#cdd1ea`, a periwinkle tint, for secondary text on fields.
- Stars on fields are ivory warmed toward candle gold (`--star`).

### Named Rules
- **One ink.** No second accent colour. Emphasis comes from midnight, weight and size.
- **Fields, not sprinkles.** Midnight appears as whole regions or as type.
- **Paper everywhere.** Every paper ground and every midnight field carries the paper grain (multiply), so ink reads as printed, not painted.
- **Tinted, never grey.** Secondary text on a field is a blue-tinted ivory.

## Typography

Three faces, all self-hosted through Fontsource and bundled with the site:

- **Aref Ruqaa** (400, 700): the calligraphic voice for the site name, cover, page, piece and chapter titles, contents, section titles, and book covers.
- **Amiri** (400, 700): the reading voice for poems, articles, synopses and chapters.
- **Noto Naskh Arabic** (400, 700): small labels, navigation, meta lines, buttons and running heads.

### Hierarchy
- Issue numeral: Ruq'a 700, up to 17rem, tonal midnight (decorative, `aria-hidden`).
- Cover title: Ruq'a 700, up to 6.25rem, line height 1.4.
- Page, piece and chapter titles: Ruq'a 700, 2.3 to 4.5rem, midnight.
- Contents, list and chapter-index titles: Ruq'a 700, 1.3 to 2rem.
- Poem: Amiri 1.4 to 1.6rem, line height 2.1. Article: Amiri 1.25 to 1.375rem, line height 2. Chapter: Amiri 1.3 to 1.45rem times the reader's chosen scale, line height 2.15, justified on wide screens, paragraphs indented rather than spaced.
- Labels: Noto Naskh 0.95rem.

### Named Rules
- **Calligraphy titles, naskh reads.** Ruq'a never sets running text.
- **Never letter-space Arabic.** There is no `letter-spacing` anywhere.
- **Arabic separators.** List separators are the Arabic comma «،».
- **Poems are verbatim.** Each line is its own block with `white-space: pre-wrap`; wrapped lines hang by 1.75em.
- **No label above a heading.** Issue lines, chapter numbers and dates sit below the title.

## Layout

- Reading column 42rem; chapter column 38rem; wide regions 76rem; gutter `clamp(1.25rem, 4vw, 3rem)`.
- Cover grid: title block at the start (right), the constellation and tonal numeral at the end (left), contents spanning below (two columns from five items on wide screens).
- Novel page: book cover at the start beside the title, status, synopsis and the start/continue button; chapter index and bookmarks below. On phones the cover stacks above.
- Chapter reader: a sticky bar (book link, chapter position, text size, bookmark, night switch) with a 2px progress line along its foot.
- Every page is bookended: paper masthead above, midnight colophon below.

## Elevation & Depth

Flat print, with two exceptions that behave like objects on a table: back-issue covers and the book cover cast a soft offset shadow and lift 4px on hover.

## Shapes

Square-cut. Covers and fields have no radius; the book cover carries a stamped double rule 0.65rem inside its edge. Pills appear only on filter controls; 2px corners only on buttons, focus rings and the placeholder note.

## Components

### The cover (signature)
A full-bleed midnight field: title in ivory Ruq'a, the issue line beneath, an intro, the issue's sky (one star per piece joined by a dotted line in reading order, over faint pinpoints, seeded by the collection so it never changes) behind a tonal numeral, and the numbered contents list. On load the contents rules draw in from right to left; the stars breathe slowly. Both are skipped under reduced motion.

### Book cover
A typeset cover in midnight cloth: double-rule frame, the book's own sky, title in Ruq'a, tagline and author in naskh. An image named in `novel.md` replaces it.

### Chapter reader
Sticky reader bar; text-size buttons (five steps, remembered); bookmark button that records the reading position; night switch shared with the site theme; arrow keys turn chapters (left is forward); a toast confirms each action. Position, bookmarks and read chapters live in the reader's own browser.

### Navigation, running head, finder, dossier rows, back-issue covers
As built: underlined current section; running head «site, issue: title» with «٢ من ٤» at the end; underlined search with segmented type filter and pill selects; ruled dossier rows; small midnight covers with tonal numerals.

### Placeholder note
A dashed hairline box on every sample piece, chapter and the sample novel.

## Do's and Don'ts

### Do:
- Do keep the paper grain under every ground and field.
- Do let midnight own whole fields.
- Do keep every poem's line breaks exactly as written.
- Do use Arabic-Indic digits and the Arabic comma.
- Do draw icons and ornaments as authored SVG.

### Don't:
- Don't add arabesque borders, tile patterns, lanterns, gold-on-green, or calligraphic flourishes as decoration; calligraphy is for titles.
- Don't pair the crescent with a star, or let the sky become more than a faint detail.
- Don't add a second accent colour, gradients, glass, or glow.
- Don't put a label or kicker above a heading.
- Don't letter-space Arabic.
