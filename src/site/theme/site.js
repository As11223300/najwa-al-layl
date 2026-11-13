// Night/day toggle and the archive finder. Every page works without this.

const root = document.documentElement;
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function resolvedTheme() {
  return root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
}

function syncToggle() {
  const theme = resolvedTheme();
  root.dataset.themeResolved = theme;
  const button = document.querySelector('.theme-toggle');
  if (!button) return;
  button.hidden = false;
  button.setAttribute('aria-pressed', String(theme === 'dark'));
  button.setAttribute('aria-label', theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي');
  document.querySelector('[data-night]')?.setAttribute('aria-pressed', String(theme === 'dark'));
}

function toggleTheme() {
  const next = resolvedTheme() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('theme', next);
  } catch (_) {
    /* storage unavailable: the choice lasts for this page only */
  }
  syncToggle();
}

document.querySelector('.theme-toggle')?.addEventListener('click', toggleTheme);
darkQuery.addEventListener('change', syncToggle);
syncToggle();

// ---------- archive finder ----------

// Same rules as normalizeArabic in src/site/arabic.mjs.
function normalizeArabic(text) {
  return String(text)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

const DIGITS = '٠١٢٣٤٥٦٧٨٩';
const arabicDigits = (n) => String(n).replace(/[0-9]/g, (d) => DIGITS[d]);

function countPieces(n) {
  if (n === 0) return 'لا نتائج';
  if (n === 1) return 'نصّ واحد';
  if (n === 2) return 'نصّان';
  if (n <= 10) return `${arabicDigits(n)} نصوص`;
  return `${arabicDigits(n)} نصًّا`;
}

const finder = document.querySelector('.finder');
if (finder) {
  const entries = [...document.querySelectorAll('.entry')];
  const status = document.querySelector('.finder-status');
  const empty = document.querySelector('.finder-empty');
  const input = finder.querySelector('input[name="q"]');
  const base = new URL(document.querySelector('.site-name').href).pathname;
  let index = null;
  let loading = null;

  function loadIndex() {
    loading ??= fetch(`${base}search.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => (index = new Map(rows.map((row) => [row.s, row]))))
      .catch(() => (index = new Map()));
    return loading;
  }

  // Restore filters from the address so a filtered view can be shared.
  const params = new URLSearchParams(location.search);
  for (const [key, value] of params) {
    const field = finder.elements[key];
    if (!field) continue;
    if (field instanceof RadioNodeList) {
      for (const radio of field) radio.checked = radio.value === value;
    } else field.value = value;
  }

  async function apply() {
    const data = new FormData(finder);
    const q = normalizeArabic(data.get('q') || '');
    const type = data.get('type') || '';
    const year = data.get('year') || '';
    const coll = data.get('collection') || '';
    if (q && !index) {
      status.textContent = 'جارٍ البحث…';
      await loadIndex();
    }
    const words = q.split(' ').filter(Boolean);
    let shown = 0;
    for (const entry of entries) {
      const d = entry.dataset;
      let ok =
        (!type || d.type === type) &&
        (!year || d.year === year) &&
        (!coll || d.collections.split(' ').includes(coll));
      if (ok && words.length) {
        const row = index?.get(d.slug);
        const hay = row ? `${row.t} ${row.x}` : normalizeArabic(entry.textContent);
        ok = words.every((w) => hay.includes(w));
      }
      entry.hidden = !ok;
      if (ok) shown++;
    }
    const filtered = q || type || year || coll;
    status.textContent = filtered ? `${countPieces(shown)} من ${arabicDigits(entries.length)}` : countPieces(entries.length);
    empty.hidden = shown !== 0;

    const next = new URLSearchParams();
    for (const [k, v] of [['q', data.get('q')], ['type', type], ['year', year], ['collection', coll]]) {
      if (v) next.set(k, v);
    }
    const qs = next.toString();
    history.replaceState(null, '', qs ? `?${qs}${location.hash}` : location.pathname + location.hash);
  }

  let timer;
  finder.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(apply, 120);
  });
  finder.addEventListener('submit', (event) => {
    event.preventDefault();
    apply();
  });
  input.addEventListener('focus', loadIndex, { once: true });
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    finder.reset();
    apply();
    input.focus();
  });

  if (location.hash === '#q') input.focus();
  if ([...params.keys()].length) apply();
}

// ---------- the novel: reading position, bookmarks, text size ----------
// Everything here is a per-reader convenience kept in this browser only.

function readStore(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch (_) {
    return fallback;
  }
}
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    /* storage unavailable: nothing is remembered */
  }
}

const novelKey = (slug) => `najwa:novel:${slug}`;
const percent = (p) => `${arabicDigits(Math.round(p * 100))}٪`;
const SCALES = [0.88, 1, 1.12, 1.26, 1.42];

const chapter = document.querySelector('.chapter');
if (chapter) {
  const d = chapter.dataset;
  const key = novelKey(d.novel);
  const text = chapter.querySelector('.chapter-text');
  const bar = chapter.querySelector('.reader-progress');
  const toast = chapter.querySelector('.reader-toast');
  const tools = chapter.querySelector('.reader-tools');
  const bookmarkButton = chapter.querySelector('[data-bookmark]');
  const here = { chapter: d.chapter, title: d.chapterTitle, name: d.chapterName, no: Number(d.chapterNo), url: location.pathname };
  tools.hidden = false;

  let toastTimer;
  function say(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  // Position as the share of the chapter text read so far.
  function position() {
    const box = text.getBoundingClientRect();
    const read = window.innerHeight * 0.35 - box.top;
    return Math.min(1, Math.max(0, read / box.height));
  }
  function scrollToPosition(p) {
    const box = text.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + box.top + box.height * p - window.innerHeight * 0.35 });
  }

  function syncBookmarkButton() {
    const has = readStore(key, {}).bookmarks?.some((b) => b.chapter === here.chapter);
    bookmarkButton.setAttribute('aria-pressed', String(Boolean(has)));
  }

  let saveTimer;
  function onScroll() {
    const p = position();
    bar.style.setProperty('--progress', p.toFixed(4));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const store = readStore(key, {});
      store.last = { ...here, pct: p, at: Date.now() };
      if (p > 0.9) store.read = [...new Set([...(store.read || []), here.chapter])];
      writeStore(key, store);
    }, 400);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // Text size
  let scale = readStore('najwa:reader-scale', 1);
  if (!SCALES.includes(scale)) scale = 1;
  const applyScale = () => root.style.setProperty('--reader-scale', scale);
  applyScale();
  for (const button of chapter.querySelectorAll('[data-font]')) {
    button.addEventListener('click', () => {
      const p = position();
      const i = SCALES.indexOf(scale) + Number(button.dataset.font);
      if (i < 0 || i >= SCALES.length) {
        say(i < 0 ? 'هذا أصغر حجم للخطّ' : 'هذا أكبر حجم للخطّ');
        return;
      }
      scale = SCALES[i];
      applyScale();
      writeStore('najwa:reader-scale', scale);
      scrollToPosition(p);
    });
  }

  bookmarkButton.addEventListener('click', () => {
    const p = position();
    const store = readStore(key, {});
    store.bookmarks = [...(store.bookmarks || []), { ...here, pct: p, at: Date.now() }];
    writeStore(key, store);
    syncBookmarkButton();
    say(`وُضعت علامة عند ${percent(p)} من ${here.name}`);
  });

  chapter.querySelector('[data-night]').addEventListener('click', () => {
    toggleTheme();
    say(resolvedTheme() === 'dark' ? 'القراءة الليلية' : 'القراءة النهارية');
  });

  // Arrow keys turn the page; in a right-to-left book, left is forward.
  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable]')) return;
    const rel = event.key === 'ArrowLeft' ? 'next' : event.key === 'ArrowRight' ? 'prev' : null;
    const link = rel && chapter.querySelector(`.chapter-pager a[rel="${rel}"]`);
    if (link) location.href = link.href;
  });

  const jump = location.hash.match(/^#pos-([\d.]+)$/);
  if (jump) {
    requestAnimationFrame(() => scrollToPosition(Math.min(1, Number(jump[1]))));
    history.replaceState(null, '', location.pathname);
  }
  syncBookmarkButton();
  syncToggle();
  onScroll();
}

const novel = document.querySelector('.novel');
if (novel) {
  const key = novelKey(novel.dataset.novel);
  const store = readStore(key, {});
  const index = novel.querySelector('.chapters');
  const linkFor = (slug) => index?.querySelector(`[data-chapter="${slug}"] a`)?.getAttribute('href');

  for (const slug of store.read || []) {
    const item = index?.querySelector(`[data-chapter="${slug}"]`);
    if (item) item.dataset.state = 'read';
  }

  const last = store.last;
  const lastHref = last && linkFor(last.chapter);
  if (lastHref) {
    const item = index.querySelector(`[data-chapter="${last.chapter}"]`);
    item.dataset.state = 'current';
    const mark = document.createElement('span');
    mark.className = 'chapter-here';
    mark.textContent = `توقّفت هنا، عند ${percent(last.pct)}`;
    item.querySelector('a').append(mark);

    const resume = novel.querySelector('[data-resume]');
    const note = novel.querySelector('[data-resume-note]');
    if (resume && last.pct < 0.98) {
      resume.textContent = 'تابع القراءة';
      resume.href = last.pct > 0.02 ? `${lastHref}#pos-${last.pct.toFixed(3)}` : lastHref;
      note.textContent = `توقّفت في ${last.name}، «${last.title}»`;
      note.hidden = false;
    }
  }

  const section = novel.querySelector('[data-bookmarks]');
  const list = section.querySelector('.bookmark-list');
  const bookmarkIcon =
    '<svg class="icon icon-bookmark" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10a.5.5 0 0 1 .5.5v16.2l-5.5-3.9-5.5 3.9V4a.5.5 0 0 1 .5-.5Z"/></svg>';
  const closeIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function renderBookmarks() {
    const marks = (readStore(key, {}).bookmarks || []).filter((b) => linkFor(b.chapter));
    section.hidden = marks.length === 0;
    list.replaceChildren(
      ...marks.map((b, i) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `${linkFor(b.chapter)}#pos-${b.pct.toFixed(3)}`;
        a.innerHTML = bookmarkIcon;
        const title = document.createElement('span');
        title.className = 'bookmark-title';
        title.textContent = b.title;
        const meta = document.createElement('span');
        meta.className = 'bookmark-meta';
        meta.textContent = `${b.name}، عند ${percent(b.pct)}`;
        a.append(title, meta);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'tool';
        remove.setAttribute('aria-label', `احذف العلامة: ${b.title}، عند ${percent(b.pct)}`);
        remove.innerHTML = closeIcon;
        remove.addEventListener('click', () => {
          const current = readStore(key, {});
          current.bookmarks = (current.bookmarks || []).filter((_, j) => j !== i);
          writeStore(key, current);
          renderBookmarks();
          (list.querySelector('a') || novel.querySelector('[data-resume]'))?.focus();
        });
        li.append(a, remove);
        return li;
      }),
    );
  }
  renderBookmarks();
}
