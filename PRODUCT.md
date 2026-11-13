# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite with plain HTML, CSS and JavaScript (no framework). Confirmed by the owner at init.

## Users

- The author (the owner) publishes and maintains their own writing.
- Public readers: anyone who arrives at a piece by link or search. Their job is to read it, then wander to another piece.

## Product Purpose

A personal website for the author's writing: poetry and articles. Success is a reader finishing one piece and going on to read another.

Open: the site's name (the author's name or pen name). Use a clearly marked placeholder until it is given.

## Capabilities and Constraints

- Static content pages served by Vite (`npm run dev`, `npm run build`).
- Entry point is `index.html`, with styles in `src/style.css` and script in `src/main.js`.
- Two kinds of writing: poems (line breaks and spacing are part of the text and must be preserved exactly) and articles (long-form prose).
- The archive holds hundreds of pieces, so pages and indexes must scale to that.
- Readers find their way by type (poems vs articles), by date or year, by theme or collection, and by search.
- Written in Arabic. Every page is right-to-left (`lang="ar" dir="rtl"`), including navigation, indexes, dates and numerals; layout mirrors accordingly.
- Dates and numbering use Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩).
- The poetry is mostly free verse (taf'ila) and prose poems: line breaks are as written; no classical two-hemistich layout is needed.
- Open: where the writing lives today (mixed or unknown sources). Plan for Markdown files with front matter as the target format; import from other sources is a separate task.
- Open: deploy target.

## Brand Commitments

Confirmed by the author:
- Arabic language with right-to-left layout throughout.
- Elegant Arabic typography: the Arabic script is the primary design material, never an afterthought set in a Latin-first face.
- A poetic, artistic atmosphere, with the reading itself kept calm.

## Evidence on Hand

The author has hundreds of real pieces, but none are in the repository yet. Until they are imported, any sample text must be clearly labeled as a placeholder. Never present invented poems, articles, dates, publication credits or reader testimonials as the author's.

## Product Principles

1. Reading comes first: every page is built so a piece can be read without distraction.
2. The text is sacred: a poem's line breaks, indentation and spacing reach the reader exactly as written.
3. Stay lightweight: prefer plain HTML and CSS over adding dependencies.
4. Record decisions as they are made; leave open questions open rather than guessing.
