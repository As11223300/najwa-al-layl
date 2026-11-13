// HTML templates for every page of the journal.

import { arabicDigits, chapterName, countChapters, countPieces, formatDate, formatYear, readingTime, wordCount } from './arabic.mjs';

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
const e = escapeHtml;

const TYPE_LABEL = { poem: 'قصيدة', article: 'مقالة' };
const SECTION = { poem: 'poems', article: 'articles' };

// Icons: one stroke family, 1.5px on a 24px grid.
const icon = {
  search:
    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/></svg>',
  moon:
    '<svg class="icon icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/></svg>',
  sun:
    '<svg class="icon icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>',
  // In right-to-left reading, "back" points right and "forward" points left.
  back: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>',
  forward: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M10 7l-5 5 5 5"/></svg>',
  bookmark:
    '<svg class="icon icon-bookmark" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10a.5.5 0 0 1 .5.5v16.2l-5.5-3.9-5.5 3.9V4a.5.5 0 0 1 .5-.5Z"/></svg>',
  list: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};

// ---------- celestial details ----------

function seededRandom(seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// A four-pointed star, the journal's only ornament.
const sparkle = (x, y, r) =>
  `<path d="M${x} ${y - r}Q${x + r * 0.16} ${y - r * 0.16} ${x + r} ${y}Q${x + r * 0.16} ${y + r * 0.16} ${x} ${y + r}Q${x - r * 0.16} ${y + r * 0.16} ${x - r} ${y}Q${x - r * 0.16} ${y - r * 0.16} ${x} ${y - r}Z"/>`;

// Each issue's sky: one star per piece in its contents, joined in reading
// order, over a scatter of faint pinpoints. Seeded by the collection, so a
// cover keeps its constellation between builds.
function constellation(slug, count) {
  const rand = seededRandom(slug);
  const W = 320;
  const H = 220;
  const n = Math.max(3, Math.min(count, 12));
  const stars = [];
  let x = 40 + rand() * 40;
  for (let i = 0; i < n; i++) {
    stars.push({ x, y: 40 + rand() * (H - 80) });
    x += (W - 100) / Math.max(1, n - 1) * (0.7 + rand() * 0.6);
    x = Math.min(x, W - 30);
  }
  const dust = Array.from({ length: 26 }, () => ({ x: rand() * W, y: rand() * H, r: 0.5 + rand() * 0.7 }));
  const brightest = Math.floor(rand() * n);
  return `<svg class="cover-sky" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">
    <g class="sky-dust">${dust.map((d) => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(2)}"/>`).join('')}</g>
    <polyline class="sky-line" points="${stars.map((s) => `${s.x.toFixed(1)},${s.y.toFixed(1)}`).join(' ')}"/>
    <g class="sky-stars">${stars
      .map((s, i) => (i === brightest ? sparkle(+s.x.toFixed(1), +s.y.toFixed(1), 7) : `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${(1.6 + rand() * 1.1).toFixed(2)}"/>`))
      .join('')}</g>
  </svg>`;
}

const crescent =
  '<svg class="crescent" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15.5 3.2A9 9 0 1 0 20.8 16 7.4 7.4 0 0 1 15.5 3.2Z"/></svg>';

export const endMark = `<div class="end-mark" aria-hidden="true"><svg viewBox="-10 -10 20 20" focusable="false">${sparkle(0, 0, 9)}</svg></div>`;

export function createTemplates({ config, base, site }) {
  const url = (p = '') => base + p.replace(/^\//, '');
  const pieceUrl = (p) => url(`${SECTION[p.type]}/${p.slug}/`);
  const collUrl = (c) => url(`issues/${c.slug}/`);
  const date = (d) => `<time datetime="${d.toISOString().slice(0, 10)}">${formatDate(d, config.locale)}</time>`;

  // «العدد ٣، شتاء ٢٠٢٥» for issues, «ملفّ» plus label for themes.
  const collName = (c) =>
    c.kind === 'season'
      ? `العدد ${arabicDigits(c.number)}${c.label ? `، ${e(c.label)}` : ''}`
      : `ملفّ${c.label ? `، ${e(c.label)}` : ''}`;

  const novelLabel = site.novels.length > 1 ? 'الروايات' : 'الرواية';
  const NAV = [
    ['issues', 'الأعداد'],
    ...(site.novels.length ? [['novels', novelLabel]] : []),
    ['poems', 'الشعر'],
    ['articles', 'المقالات'],
    ['archive', 'الفهرس'],
    ['about', 'عن الكاتب'],
  ];

  function layout({ title, description, section, bodyClass = '', main }) {
    const fullTitle = title ? `${title} | ${config.name}` : config.name;
    const nav = NAV.map(
      ([key, label]) =>
        `<li><a href="${url(`${key}/`)}"${section === key ? ' aria-current="page"' : ''}>${label}</a></li>`,
    ).join('');
    return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(fullTitle)}</title>
<meta name="description" content="${e(description || config.description)}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f4eedf" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0e2a" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${url('favicon.svg')}" type="image/svg+xml">
<script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(_){}</script>
<link rel="stylesheet" href="/assets/style.css">
<script type="module" src="/assets/site.js"></script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">تخطَّ إلى المحتوى</a>
<header class="masthead">
  <div class="masthead-inner">
    <a class="site-name" href="${url()}"${section === 'home' ? ' aria-current="page"' : ''}>${e(config.name)}</a>
    <nav class="site-nav" aria-label="أقسام المجلّة"><ul>${nav}</ul></nav>
    <div class="masthead-tools">
      <a class="tool" href="${url('archive/')}#q" aria-label="البحث في النصوص">${icon.search}</a>
      <button class="tool theme-toggle" type="button" aria-label="الوضع الليلي" aria-pressed="false" hidden>${icon.moon}${icon.sun}</button>
    </div>
  </div>
</header>
<main id="main" tabindex="-1">
${main}
</main>
<footer class="colophon">
  <div class="colophon-inner">
    <p class="colophon-name">${crescent}${e(config.name)}</p>
    <p class="colophon-line">${e(config.tagline)}</p>
    <p class="colophon-meta">كتابة وتحرير: ${e(config.author)}، ${countPieces(site.pieces.length)}</p>
  </div>
</footer>
</body>
</html>
`;
  }

  // ---------- shared pieces ----------

  function contentsList(c, { limit } = {}) {
    const items = limit ? c.pieces.slice(0, limit) : c.pieces;
    if (!items.length) return '<p class="contents-empty">لم تُضَف نصوص إلى هذا العدد بعد.</p>';
    return `<ol class="contents">${items
      .map(
        (p, i) => `
      <li style="--i:${i}"><a href="${pieceUrl(p)}">
        <span class="contents-num">${arabicDigits(i + 1)}</span>
        <span class="contents-title">${e(p.title)}</span>
        <span class="contents-type">${TYPE_LABEL[p.type]}</span>
      </a></li>`,
      )
      .join('')}
    </ol>`;
  }

  function cover(c, { headingLevel = 2, intro = true } = {}) {
    const h = `h${headingLevel}`;
    const mark = c.kind === 'season' ? arabicDigits(c.number) : 'ملفّ';
    return `<section class="cover cover-${c.kind}" aria-labelledby="cover-${c.slug}">
  <div class="cover-inner">
    <div class="cover-head">
      <${h} class="cover-title" id="cover-${c.slug}">${headingLevel === 1 ? e(c.title) : `<a href="${collUrl(c)}">${e(c.title)}</a>`}</${h}>
      <p class="cover-sub">${collName(c)}، ${countPieces(c.pieces.length)}</p>
      ${intro && c.html ? `<div class="cover-intro">${c.html}</div>` : ''}
    </div>
    <div class="cover-mark${c.kind === 'theme' ? ' cover-mark-word' : ''}" aria-hidden="true">${constellation(c.slug, c.pieces.length)}<span>${mark}</span></div>
    ${contentsList(c)}
  </div>
</section>`;
  }

  function miniCovers(list) {
    return `<ul class="mini-covers">${list
      .map(
        (c) => `<li><a class="mini-cover" href="${collUrl(c)}">
        <span class="mini-num" aria-hidden="true">${arabicDigits(c.number)}</span>
        <span class="mini-title">${e(c.title)}</span>
        <span class="mini-sub">${collName(c)}</span>
      </a></li>`,
      )
      .join('')}</ul>`;
  }

  function themeRows(list) {
    return `<ul class="theme-rows">${list
      .map(
        (c) => `<li><a class="theme-row" href="${collUrl(c)}">
        <span class="theme-title">${e(c.title)}</span>
        <span class="theme-count">${countPieces(c.pieces.length)}</span>
        ${c.excerpt ? `<span class="theme-excerpt">${e(c.excerpt)}</span>` : ''}
      </a></li>`,
      )
      .join('')}</ul>`;
  }

  function entryList(list, { showType = false } = {}) {
    return `<ol class="entries">${list
      .map((p) => {
        const where = p.home ? `، ${e(p.home.title)}` : '';
        return `<li class="entry" data-type="${p.type}" data-year="${p.date.getUTCFullYear()}" data-collections="${p.memberOf.map((c) => c.slug).join(' ')}" data-slug="${p.slug}">
        <a href="${pieceUrl(p)}">
          <span class="entry-title">${e(p.title)}</span>
          <span class="entry-meta">${showType ? `${TYPE_LABEL[p.type]}، ` : ''}${date(p.date)}${where}</span>
        </a></li>`;
      })
      .join('')}</ol>`;
  }

  function byYear(list, opts) {
    const years = new Map();
    for (const p of [...list].sort((a, b) => b.date - a.date)) {
      const y = p.date.getUTCFullYear();
      if (!years.has(y)) years.set(y, []);
      years.get(y).push(p);
    }
    return [...years]
      .map(
        ([y, items]) => `<section class="year-group" aria-labelledby="y-${y}">
      <h2 class="year" id="y-${y}">${arabicDigits(y)}</h2>
      ${entryList(items, opts)}
    </section>`,
      )
      .join('');
  }

  // ---------- pages ----------

  function home() {
    const c = site.current;
    const backIssues = site.issues.filter((x) => x !== c).reverse();
    const main = `<h1 class="sr-only">${e(config.name)}</h1>
${c ? cover(c) : '<section class="page-col"><p>لم يصدر أيّ عدد بعد. أضِف مجموعة في <code>content/collections</code>.</p></section>'}
<div class="home-rest">
  ${homeNovels()}
  ${
    site.themes.length
      ? `<section class="home-section" aria-labelledby="h-themes">
    <h2 class="section-title" id="h-themes">ملفّات</h2>
    ${themeRows(site.themes)}
  </section>`
      : ''
  }
  ${
    backIssues.length
      ? `<section class="home-section" aria-labelledby="h-back">
    <h2 class="section-title" id="h-back">أعداد سابقة</h2>
    ${miniCovers(backIssues)}
  </section>`
      : ''
  }
</div>`;
    return layout({ section: 'home', bodyClass: 'page-home', main });
  }

  function collectionPage(c) {
    const others = c.kind === 'season' ? site.issues.filter((x) => x !== c).reverse() : [];
    const main = `${cover(c, { headingLevel: 1 })}
<div class="home-rest">
  ${c.restHtml ? `<section class="page-col prose">${c.restHtml}</section>` : ''}
  ${
    others.length
      ? `<section class="home-section" aria-labelledby="h-other">
    <h2 class="section-title" id="h-other">أعداد أخرى</h2>
    ${miniCovers(others)}
  </section>`
      : ''
  }
  ${
    c.kind === 'theme' && site.themes.length > 1
      ? `<section class="home-section" aria-labelledby="h-other">
    <h2 class="section-title" id="h-other">ملفّات أخرى</h2>
    ${themeRows(site.themes.filter((x) => x !== c))}
  </section>`
      : ''
  }
</div>`;
    return layout({
      title: c.title,
      description: c.excerpt || config.description,
      section: 'issues',
      bodyClass: 'page-collection',
      main,
    });
  }

  function issuesPage() {
    const main = `<div class="page-col page-head">
  <h1 class="page-title">الأعداد والملفّات</h1>
  <p class="page-lede">تُجمع النصوص في أعداد فصليّة تصدر مع تبدّل المواسم، وفي ملفّات تتبع موضوعًا واحدًا عبر السنين.</p>
</div>
<div class="home-rest">
  <section class="home-section" aria-labelledby="h-issues">
    <h2 class="section-title" id="h-issues">الأعداد الفصليّة</h2>
    ${site.issues.length ? miniCovers([...site.issues].reverse()) : '<p>لا أعداد بعد.</p>'}
  </section>
  <section class="home-section" aria-labelledby="h-themes">
    <h2 class="section-title" id="h-themes">الملفّات</h2>
    ${site.themes.length ? themeRows(site.themes) : '<p>لا ملفّات بعد.</p>'}
  </section>
</div>`;
    return layout({ title: 'الأعداد والملفّات', section: 'issues', bodyClass: 'page-issues', main });
  }

  function sectionPage(type) {
    const list = site.pieces.filter((p) => p.type === type);
    const title = type === 'poem' ? 'الشعر' : 'المقالات';
    const main = `<div class="page-col page-head">
  <h1 class="page-title">${title}</h1>
  <p class="page-lede">${countPieces(list.length)}، من الأحدث إلى الأقدم.</p>
</div>
<div class="page-col">${list.length ? byYear(list) : '<p>لا نصوص هنا بعد.</p>'}</div>`;
    return layout({ title, section: SECTION[type], bodyClass: 'page-list', main });
  }

  function archivePage() {
    const years = [...new Set(site.pieces.map((p) => p.date.getUTCFullYear()))].sort((a, b) => b - a);
    const colls = [...[...site.issues].reverse(), ...site.themes];
    const sorted = [...site.pieces].sort((a, b) => b.date - a.date);
    const main = `<div class="page-col page-head">
  <h1 class="page-title">الفهرس</h1>
  <p class="page-lede">كلّ ما نُشر في ${e(config.name)}. ابحث في العناوين والنصوص، أو صفِّ حسب النوع والسنة والعدد.</p>
</div>
<div class="page-col">
  <form class="finder" role="search" aria-label="البحث في الفهرس">
    <label class="finder-search">
      <span class="sr-only">ابحث في العناوين والنصوص</span>
      ${icon.search}
      <input id="q" type="search" name="q" placeholder="ابحث في العناوين والنصوص" autocomplete="off">
    </label>
    <div class="finder-filters">
      <fieldset class="segmented">
        <legend class="sr-only">النوع</legend>
        <label><input type="radio" name="type" value="" checked><span>الكلّ</span></label>
        <label><input type="radio" name="type" value="poem"><span>الشعر</span></label>
        <label><input type="radio" name="type" value="article"><span>المقالات</span></label>
      </fieldset>
      <label class="select"><span class="sr-only">السنة</span>
        <select name="year"><option value="">كلّ السنوات</option>${years
          .map((y) => `<option value="${y}">${arabicDigits(y)}</option>`)
          .join('')}</select>
      </label>
      <label class="select"><span class="sr-only">العدد أو الملفّ</span>
        <select name="collection"><option value="">كلّ الأعداد والملفّات</option>${colls
          .map((c) => `<option value="${c.slug}">${e(c.title)}</option>`)
          .join('')}</select>
      </label>
    </div>
  </form>
  <p class="finder-status" role="status" aria-live="polite" data-total="${sorted.length}">${countPieces(sorted.length)}</p>
  <div class="finder-empty" hidden>
    <p>لا نصوص تطابق بحثك.</p>
    <button type="button" class="text-button" data-reset>امسح البحث والتصفية</button>
  </div>
  ${entryList(sorted, { showType: true })}
</div>`;
    return layout({ title: 'الفهرس', section: 'archive', bodyClass: 'page-archive', main });
  }

  function piecePage(p, html) {
    const home = p.home;
    const list = home ? home.pieces : site.pieces.filter((x) => x.type === p.type).sort((a, b) => a.date - b.date);
    const idx = list.indexOf(p);
    const prev = list[idx - 1];
    const next = list[idx + 1];
    const words = wordCount(p.body);

    const runningHead = home
      ? `<p class="running-head"><a href="${url()}">${e(config.name)}</a><span class="rh-sep" aria-hidden="true"></span><a href="${collUrl(home)}">${collName(home)}: ${e(home.title)}</a><span class="rh-pos">${arabicDigits(idx + 1)} من ${arabicDigits(list.length)}</span></p>`
      : `<p class="running-head"><a href="${url()}">${e(config.name)}</a><span class="rh-sep" aria-hidden="true"></span><a href="${url(`${SECTION[p.type]}/`)}">${p.type === 'poem' ? 'الشعر' : 'المقالات'}</a></p>`;

    const memberLinks = p.memberOf.map((c) => `<a href="${collUrl(c)}">${e(c.title)}</a>`).join('، ');
    const meta = [date(p.date), p.type === 'article' ? readingTime(words, config.wordsPerMinute) : '']
      .filter(Boolean)
      .join('، ');

    const pager =
      prev || next
        ? `<nav class="pager" aria-label="${home ? 'في العدد نفسه' : 'نصوص أخرى'}">
      ${prev ? `<a class="pager-prev" href="${pieceUrl(prev)}" rel="prev"><span class="pager-label">${icon.back}السابق</span><span class="pager-title">${e(prev.title)}</span></a>` : '<span></span>'}
      ${next ? `<a class="pager-next" href="${pieceUrl(next)}" rel="next"><span class="pager-label">التالي${icon.forward}</span><span class="pager-title">${e(next.title)}</span></a>` : '<span></span>'}
    </nav>`
        : '';

    const main = `<article class="piece piece-${p.type}">
  <div class="piece-col">
    ${runningHead}
    <header class="piece-head">
      <h1 class="piece-title">${e(p.title)}</h1>
      <p class="piece-meta">${meta}</p>
      ${p.summary ? `<p class="standfirst">${e(p.summary)}</p>` : ''}
    </header>
    ${p.placeholder ? '<p class="placeholder-note">نصّ تجريبيّ يوضّح شكل الصفحة، ويُستبدل بنصوص الكاتب.</p>' : ''}
    ${html}
    <footer class="piece-foot">
      ${memberLinks ? `<p class="piece-in">نُشر في: ${memberLinks}</p>` : ''}
      ${pager}
    </footer>
  </div>
</article>`;
    return layout({
      title: p.title,
      description: p.summary || `${TYPE_LABEL[p.type]} من ${config.name}`,
      section: SECTION[p.type],
      bodyClass: `page-piece page-${p.type}`,
      main,
    });
  }

  function aboutPage(html, placeholder) {
    const main = `<article class="piece">
  <div class="piece-col">
    <header class="piece-head"><h1 class="piece-title">عن الكاتب</h1></header>
    ${placeholder ? '<p class="placeholder-note">نصّ تجريبيّ: اكتب نبذتك في <code>content/about.md</code>.</p>' : ''}
    <div class="prose">${html}</div>
  </div>
</article>`;
    return layout({ title: 'عن الكاتب', section: 'about', bodyClass: 'page-about', main });
  }

  function notFound() {
    const main = `<div class="page-col page-head not-found">
  <h1 class="page-title">لم نجد هذه الصفحة</h1>
  <p class="page-lede">ربّما تغيّر عنوانها أو لم تُنشر بعد. جرّب <a href="${url('archive/')}">البحث في الفهرس</a> أو عُد إلى <a href="${url()}">العدد الحالي</a>.</p>
</div>`;
    return layout({ title: 'صفحة غير موجودة', section: '', bodyClass: 'page-404', main });
  }


  // ---------- novels ----------

  const novelUrl = (n) => url(`novels/${n.slug}/`);
  const chapterUrl = (n, c) => url(`novels/${n.slug}/${c.slug}/`);
  const statusLabel = (n) => (n.status === 'complete' ? 'رواية مكتملة' : 'رواية تُنشر فصلًا فصلًا');

  // The book's face: an authored image when novel.md names one, otherwise a
  // typeset cover in the journal's cloth: midnight field, a stamped frame,
  // the book's own sky, the title in calligraphy.
  function bookCover(n, { size = 'large', link = false } = {}) {
    const author = n.author || config.author;
    const inner = n.coverUrl
      ? `<img class="book-cover-img" src="${n.coverUrl}" alt="غلاف رواية ${e(n.title)}">`
      : `<span class="book-cover-frame" aria-hidden="true"></span>
        ${constellation(`${n.slug}-cover`, 7)}
        <span class="book-cover-title">${e(n.title)}</span>
        ${n.tagline && size === 'large' ? `<span class="book-cover-tagline">${e(n.tagline)}</span>` : ''}
        <span class="book-cover-author">${e(author)}</span>`;
    const cls = `book-cover book-cover-${size}${n.coverUrl ? ' has-image' : ''}`;
    return link
      ? `<a class="${cls}" href="${novelUrl(n)}" aria-label="${e(n.title)}">${inner}</a>`
      : `<div class="${cls}"${n.coverUrl ? '' : ` role="img" aria-label="غلاف رواية ${e(n.title)}"`}>${inner}</div>`;
  }

  function chapterIndex(n) {
    if (!n.chapters.length) return '<p class="chapters-empty">لم يُنشر أيّ فصل بعد.</p>';
    return `<ol class="chapters" data-novel="${n.slug}">${n.chapters
      .map(
        (c) => `<li data-chapter="${c.slug}"><a href="${chapterUrl(n, c)}">
        <span class="chapter-no">${chapterName(c.number)}</span>
        <span class="chapter-title">${e(c.title)}</span>
        <span class="chapter-meta">${c.date ? date(c.date) : ''}${c.date ? '، ' : ''}${readingTime(wordCount(c.body), config.wordsPerMinute)}</span>
        <span class="chapter-state" aria-hidden="true"></span>
      </a></li>`,
      )
      .join('')}</ol>`;
  }

  function novelsPage() {
    // With a single novel, the section page is that novel's page.
    if (site.novels.length === 1) return novelPage(site.novels[0]);
    const main = `<div class="page-col page-head">
  <h1 class="page-title">${novelLabel}</h1>
</div>
<div class="home-rest"><ul class="shelf">${site.novels
      .map((n) => `<li>${bookCover(n, { size: 'small', link: true })}<p class="shelf-meta">${statusLabel(n)}، ${countChapters(n.chapters.length)}</p></li>`)
      .join('')}</ul></div>`;
    return layout({ title: novelLabel, section: 'novels', bodyClass: 'page-novels', main });
  }

  function novelPage(n) {
    const first = n.chapters[0];
    const latest = n.chapters[n.chapters.length - 1];
    const main = `<div class="novel" data-novel="${n.slug}" data-novel-url="${novelUrl(n)}">
  <section class="novel-hero">
    <div class="novel-hero-inner">
      ${bookCover(n)}
      <div class="novel-intro">
        <h1 class="page-title">${e(n.title)}</h1>
        <p class="novel-status">${statusLabel(n)}، ${countChapters(n.chapters.length)}${latest && latest.date && n.status !== 'complete' ? `، آخر فصل في ${formatDate(latest.date, config.locale)}` : ''}</p>
        ${n.placeholder ? '<p class="placeholder-note">رواية تجريبيّة توضّح شكل القسم، وتُستبدل برواية الكاتب.</p>' : ''}
        <h2 class="sr-only">ملخّص الرواية</h2>
        <div class="synopsis">${n.html}</div>
        ${
          first
            ? `<div class="novel-actions">
          <a class="button button-primary" href="${chapterUrl(n, first)}" data-resume>ابدأ القراءة</a>
          <p class="resume-note" data-resume-note hidden></p>
        </div>`
            : ''
        }
      </div>
    </div>
  </section>
  <div class="novel-body">
    <section class="novel-section" aria-labelledby="h-chapters">
      <h2 class="section-title" id="h-chapters">الفصول</h2>
      ${chapterIndex(n)}
    </section>
    <section class="novel-section bookmarks" aria-labelledby="h-bookmarks" data-bookmarks hidden>
      <h2 class="section-title" id="h-bookmarks">علاماتك</h2>
      <p class="bookmarks-note">تُحفظ العلامات في هذا المتصفّح وحده.</p>
      <ol class="bookmark-list"></ol>
    </section>
  </div>
</div>`;
    return layout({
      title: n.title,
      description: n.excerpt || `${statusLabel(n)} في ${config.name}`,
      section: 'novels',
      bodyClass: 'page-novel',
      main,
    });
  }

  function chapterPage(n, c, html) {
    const prev = n.chapters[c.number - 2];
    const next = n.chapters[c.number];
    const main = `<article class="chapter" data-novel="${n.slug}" data-novel-title="${e(n.title)}" data-chapter="${c.slug}" data-chapter-title="${e(c.title)}" data-chapter-no="${c.number}" data-chapter-name="${chapterName(c.number)}">
  <div class="reader-bar">
    <div class="reader-bar-inner">
      <a class="reader-book" href="${novelUrl(n)}">${icon.list}<span>${e(n.title)}</span></a>
      <span class="reader-where">${chapterName(c.number)} من ${countChapters(n.chapters.length)}</span>
      <div class="reader-tools" hidden>
        <button class="tool" type="button" data-font="-1" aria-label="تصغير الخطّ"><span class="font-glyph font-glyph-small" aria-hidden="true">ع</span></button>
        <button class="tool" type="button" data-font="1" aria-label="تكبير الخطّ"><span class="font-glyph" aria-hidden="true">ع</span></button>
        <button class="tool" type="button" data-bookmark aria-pressed="false" aria-label="ضع علامة عند هذا الموضع">${icon.bookmark}</button>
        <button class="tool" type="button" data-night aria-pressed="false" aria-label="وضع القراءة الليلية">${icon.moon}${icon.sun}</button>
      </div>
    </div>
    <div class="reader-progress" aria-hidden="true"><span></span></div>
  </div>
  <div class="chapter-col">
    <header class="chapter-head">
      ${endMark}
      <h1 class="chapter-heading">${e(c.title)}</h1>
      <p class="piece-meta"><span class="chapter-ordinal">${chapterName(c.number)}</span>، ${c.date ? `${date(c.date)}، ` : ''}${readingTime(wordCount(c.body), config.wordsPerMinute)}</p>
    </header>
    ${c.placeholder ? '<p class="placeholder-note">فصل تجريبيّ يوضّح شكل القراءة، ويُستبدل بفصول الرواية.</p>' : ''}
    <div class="prose chapter-text">${html}</div>
    ${endMark}
    <nav class="pager chapter-pager" aria-label="فصول الرواية">
      ${prev ? `<a class="pager-prev" href="${chapterUrl(n, prev)}" rel="prev"><span class="pager-label">${icon.back}${chapterName(prev.number)}</span><span class="pager-title">${e(prev.title)}</span></a>` : `<a class="pager-prev" href="${novelUrl(n)}"><span class="pager-label">${icon.back}الرواية</span><span class="pager-title">الغلاف والفصول</span></a>`}
      ${next ? `<a class="pager-next" href="${chapterUrl(n, next)}" rel="next"><span class="pager-label">${chapterName(next.number)}${icon.forward}</span><span class="pager-title">${e(next.title)}</span></a>` : `<p class="chapter-end">${n.status === 'complete' ? 'تمّت الرواية.' : 'هذا آخر ما نُشر. يتبع…'}</p>`}
    </nav>
  </div>
  <p class="reader-toast" role="status" aria-live="polite"></p>
</article>`;
    return layout({
      title: `${chapterName(c.number)}: ${c.title} | ${n.title}`,
      description: `${chapterName(c.number)} من رواية ${n.title}`,
      section: 'novels',
      bodyClass: 'page-chapter',
      main,
    });
  }

  function homeNovels() {
    if (!site.novels.length) return '';
    return `<section class="home-section" aria-labelledby="h-novel">
    <h2 class="section-title" id="h-novel">${novelLabel}</h2>
    <ul class="home-novels">${site.novels
      .map((n) => {
        const latest = n.chapters[n.chapters.length - 1];
        return `<li class="home-novel">
        ${bookCover(n, { size: 'small', link: true })}
        <div class="home-novel-text">
          <h3 class="theme-title"><a href="${novelUrl(n)}">${e(n.title)}</a></h3>
          <p class="theme-count">${statusLabel(n)}، ${countChapters(n.chapters.length)}</p>
          ${n.excerpt ? `<p class="theme-excerpt">${e(n.excerpt)}</p>` : ''}
          ${latest ? `<p class="home-novel-latest">أحدث فصل: <a href="${chapterUrl(n, latest)}">${chapterName(latest.number)}، ${e(latest.title)}</a></p>` : ''}
        </div>
      </li>`;
      })
      .join('')}</ul>
  </section>`;
  }

  return { novelsPage, novelPage, chapterPage, home, collectionPage, issuesPage, sectionPage, archivePage, piecePage, aboutPage, notFound, pieceUrl };
}
