// The admin dashboard at /admin/: Sveltia CMS, served from this site's own
// files, editing the private studio repository on GitHub.
//
// Nothing secret lives here. The page and its config are public by nature;
// the GitHub token the author signs in with is typed into the browser and
// stays in that browser only.

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const FONT_FILES = [
  ['@fontsource/amiri/files/amiri-arabic-400-normal.woff2', 'amiri-400.woff2'],
  ['@fontsource/amiri/files/amiri-arabic-700-normal.woff2', 'amiri-700.woff2'],
  ['@fontsource/aref-ruqaa/files/aref-ruqaa-arabic-700-normal.woff2', 'aref-ruqaa-700.woff2'],
  ['@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-arabic-400-normal.woff2', 'noto-naskh-400.woff2'],
];

const date = (label, name = 'date') => ({
  label,
  name,
  widget: 'datetime',
  date_format: 'YYYY-MM-DD',
  time_format: false,
  format: 'YYYY-MM-DD',
  default: '{{now}}',
});

const published = {
  label: 'منشور',
  name: 'published',
  widget: 'boolean',
  default: false,
  hint: 'اتركه مطفأً لتبقى مسوّدة خاصّة لا تظهر في الموقع. أشعله ثمّ احفظ لتُنشر.',
};

const title = { label: 'العنوان', name: 'title', widget: 'string' };

export function cmsConfig({ cms, base }) {
  const site = cms.siteUrl.replace(/\/?$/, '/');
  return {
    backend: {
      name: 'github',
      repo: cms.repo,
      branch: cms.branch || 'main',
      // Sign-in with a fine-grained token only: "Sign in with GitHub" would
      // need a separate OAuth server, which this site does not run.
      auth_methods: ['token'],
      commit_messages: {
        create: 'إنشاء «{{slug}}» في {{collection}}',
        update: 'تحديث «{{slug}}» في {{collection}}',
        delete: 'حذف «{{slug}}» من {{collection}}',
        uploadMedia: 'رفع صورة «{{path}}»',
        deleteMedia: 'حذف صورة «{{path}}»',
      },
    },
    site_url: site,
    display_url: site,
    logo: { src: `${base}favicon.svg` },
    media_folder: 'public/uploads',
    public_folder: `${new URL(site).pathname}uploads`,
    slug: { encoding: 'unicode', clean_accents: false, sanitize_replacement: '-' },
    collections: [
      {
        name: 'poems',
        label: 'القصائد',
        label_singular: 'قصيدة',
        icon: 'edit_note',
        folder: 'content/poems',
        create: true,
        delete: true,
        slug: '{{slug}}',
        identifier_field: 'title',
        summary: '{{title}}',
        sortable_fields: ['date', 'title'],
        preview_path: 'poems/{{slug}}/',
        fields: [
          title,
          date('التاريخ'),
          published,
          {
            label: 'الأعداد والملفّات',
            name: 'collections',
            widget: 'relation',
            collection: 'issues',
            multiple: true,
            required: false,
            value_field: '{{slug}}',
            search_fields: ['title'],
            display_fields: ['title'],
          },
          {
            label: 'القصيدة',
            name: 'body',
            widget: 'text',
            hint: 'يُحفظ كلّ سطر وكلّ مسافة كما تكتبهما. السطر الفارغ يبدأ مقطعًا جديدًا.',
          },
        ],
      },
      {
        name: 'articles',
        label: 'المقالات',
        label_singular: 'مقالة',
        icon: 'article',
        folder: 'content/articles',
        create: true,
        delete: true,
        slug: '{{slug}}',
        identifier_field: 'title',
        summary: '{{title}}',
        sortable_fields: ['date', 'title'],
        preview_path: 'articles/{{slug}}/',
        fields: [
          title,
          date('التاريخ'),
          published,
          { label: 'سطر تحت العنوان', name: 'summary', widget: 'text', required: false },
          {
            label: 'الأعداد والملفّات',
            name: 'collections',
            widget: 'relation',
            collection: 'issues',
            multiple: true,
            required: false,
            value_field: '{{slug}}',
            search_fields: ['title'],
            display_fields: ['title'],
          },
          { label: 'المقالة', name: 'body', widget: 'markdown' },
        ],
      },
      {
        name: 'issues',
        label: 'الأعداد والملفّات',
        label_singular: 'عدد أو ملفّ',
        icon: 'auto_stories',
        folder: 'content/collections',
        create: true,
        delete: true,
        slug: '{{slug}}',
        identifier_field: 'title',
        summary: '{{title}}',
        sortable_fields: ['date', 'title'],
        preview_path: 'issues/{{slug}}/',
        fields: [
          title,
          {
            label: 'النوع',
            name: 'kind',
            widget: 'select',
            default: 'season',
            options: [
              { label: 'عدد فصليّ (مرقّم)', value: 'season' },
              { label: 'ملفّ موضوعيّ', value: 'theme' },
            ],
          },
          { label: 'الموسم أو الوصف القصير', name: 'label', widget: 'string', required: false, hint: 'مثل: شتاء ٢٠٢٦' },
          date('تاريخ الصدور'),
          published,
          {
            label: 'غلاف الصفحة الرئيسة',
            name: 'featured',
            widget: 'boolean',
            default: false,
            required: false,
            hint: 'أحدث عدد فصليّ يظهر غلافًا تلقائيًا. أشعل هذا لتختار عددًا آخر.',
          },
          {
            label: 'التقديم',
            name: 'body',
            widget: 'markdown',
            required: false,
            hint: 'الفقرة الأولى تظهر على الغلاف، والباقي في صفحة العدد.',
          },
        ],
      },
      {
        name: 'novels',
        label: 'الروايات',
        label_singular: 'رواية',
        icon: 'menu_book',
        folder: 'content/novels',
        create: true,
        delete: true,
        slug: '{{slug}}',
        identifier_field: 'title',
        summary: '{{title}}',
        preview_path: 'novels/{{slug}}/',
        fields: [
          title,
          { label: 'سطر تحت العنوان على الغلاف', name: 'tagline', widget: 'string', default: 'رواية', required: false },
          {
            label: 'الحالة',
            name: 'status',
            widget: 'select',
            default: 'ongoing',
            options: [
              { label: 'تُنشر فصلًا فصلًا', value: 'ongoing' },
              { label: 'مكتملة', value: 'complete' },
            ],
          },
          date('التاريخ'),
          published,
          {
            label: 'صورة الغلاف',
            name: 'cover',
            widget: 'image',
            required: false,
            hint: 'اختياريّة، ويُفضّل أن تكون طوليّة بنسبة ٢ إلى ٣. من دونها يُصمَّم غلاف بالخطّ والنجوم.',
          },
          {
            label: 'اسم المؤلّف على الغلاف',
            name: 'author',
            widget: 'string',
            required: false,
            hint: 'اتركه فارغًا ليُستخدم اسمك من «معلومات الموقع».',
          },
          { label: 'الملخّص', name: 'body', widget: 'markdown', required: false },
        ],
      },
      {
        name: 'chapters',
        label: 'فصول الروايات',
        label_singular: 'فصل',
        icon: 'bookmark',
        folder: 'content/chapters',
        create: true,
        delete: true,
        slug: '{{slug}}',
        identifier_field: 'title',
        summary: '{{fields.order}}. {{title}}',
        sortable_fields: ['order', 'date', 'title'],
        view_groups: [{ label: 'الرواية', field: 'novel' }],
        fields: [
          {
            label: 'الرواية',
            name: 'novel',
            widget: 'relation',
            collection: 'novels',
            value_field: '{{slug}}',
            search_fields: ['title'],
            display_fields: ['title'],
          },
          {
            label: 'رقم الفصل',
            name: 'order',
            widget: 'number',
            value_type: 'int',
            min: 1,
            default: 1,
            hint: 'يحدّد ترتيب الفصل. لإعادة الترتيب غيّر الأرقام. يُكتب اسم الفصل («الفصل الأول») تلقائيًا.',
          },
          title,
          date('التاريخ'),
          published,
          { label: 'نصّ الفصل', name: 'body', widget: 'markdown' },
        ],
      },
      {
        name: 'pages',
        label: 'الموقع',
        icon: 'settings',
        files: [
          {
            name: 'settings',
            label: 'معلومات الموقع',
            file: 'content/settings.json',
            fields: [
              { label: 'اسم الموقع', name: 'name', widget: 'string' },
              { label: 'العبارة تحت الاسم', name: 'tagline', widget: 'string', required: false },
              { label: 'اسمك كما يظهر في الموقع', name: 'author', widget: 'string', required: false },
              { label: 'وصف الموقع لمحرّكات البحث', name: 'description', widget: 'text', required: false },
            ],
          },
          {
            name: 'about',
            label: 'عن الكاتب',
            file: 'content/about.md',
            preview_path: 'about/',
            fields: [{ label: 'النبذة', name: 'body', widget: 'markdown', required: false }],
          },
        ],
      },
    ],
  };
}

function adminHtml({ base, immutableVersion }) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>لوحة التحكّم | نجوى الليل</title>
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="cms-config-url" type="application/yaml" href="./config.yml">
<script type="importmap">${JSON.stringify({
    imports: { [`https://unpkg.com/immutable@${immutableVersion}/dist/immutable.es.js`]: `${base}admin/vendor/immutable.es.js` },
  })}</script>
<script>
  // Open the dashboard in Arabic unless the author picked another language.
  try {
    var key = 'sveltia-cms.prefs';
    var prefs = JSON.parse(localStorage.getItem(key) || '{}') || {};
    if (!prefs.locale || prefs.locale === 'auto') { prefs.locale = 'ar'; localStorage.setItem(key, JSON.stringify(prefs)); }
  } catch (_) {}
</script>
<style>
  /* Writing fields follow the direction of what is typed: Arabic paragraphs
     run right to left, a Latin quotation left to right. */
  textarea, input[type='text'], [contenteditable='true'] { unicode-bidi: plaintext; text-align: start; }
  @font-face { font-family: 'Amiri'; font-weight: 400; font-display: swap; src: url('${base}admin/fonts/amiri-400.woff2') format('woff2'); }
  @font-face { font-family: 'Noto Naskh Arabic'; font-weight: 400; font-display: swap; src: url('${base}admin/fonts/noto-naskh-400.woff2') format('woff2'); }
  textarea, [contenteditable='true'] { font-family: 'Amiri', 'Noto Naskh Arabic', serif; font-size: 1.15rem; line-height: 1.9; }
</style>
</head>
<body>
<script src="./locale-ar.js"></script>
<script src="./sveltia-cms.js"></script>
<script src="./admin.js"></script>
</body>
</html>
`;
}

// Live preview in the journal's own type and paper, and a poem preview that
// keeps every line and space exactly as written.
function adminJs(base) {
  return `(function () {
  // A token pasted from a note or a message often carries a space or a line
  // break, which GitHub rejects as an invalid token: strip them as it is typed.
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'INPUT') return;
    var label = (t.getAttribute('aria-label') || '').toLowerCase();
    if (label.indexOf('access token') < 0 && label.indexOf('رمز الوصول') < 0) return;
    var clean = t.value.replace(/[\\s\\u200b-\\u200f\\u202a-\\u202e\\u2066-\\u2069\\ufeff]+/g, '');
    if (clean !== t.value) { t.value = clean; t.dispatchEvent(new Event('input', { bubbles: true })); }
  }, true);
  if (!window.CMS) return;
  var css = ${JSON.stringify(previewCss(base))};
  try { CMS.registerPreviewStyle(css, { raw: true }); } catch (e) { console.warn(e); }
  var h = (CMS.React && CMS.React.createElement) || window.h;
  if (!h) return;
  function get(entry, key) {
    var v = entry && entry.getIn ? entry.getIn(['data', key]) : entry && entry.data && entry.data[key];
    return v == null ? '' : String(v);
  }
  function note(entry) {
    return entry && entry.getIn && entry.getIn(['data', 'published']) === true
      ? null
      : h('p', { className: 'draft-note' }, 'مسوّدة خاصّة: لا تظهر في الموقع حتّى تُشعل «منشور» وتحفظ.');
  }
  try {
    CMS.registerPreviewTemplate('poems', function (props) {
      var body = get(props.entry, 'body').replace(/\\s+$/, '');
      var stanzas = body ? body.split(/\\n[ \\t]*\\n/) : [];
      return h('article', { className: 'piece', dir: 'rtl', lang: 'ar' },
        note(props.entry),
        h('h1', { className: 'piece-title' }, get(props.entry, 'title') || 'عنوان القصيدة'),
        h('div', { className: 'poem' }, stanzas.map(function (s, i) {
          return h('p', { className: 'stanza', key: i }, s.split('\\n').map(function (line, j) {
            return h('span', { className: 'line', key: j }, line || '\\u00a0');
          }));
        })));
    });
    ['articles', 'chapters', 'novels', 'issues'].forEach(function (name) {
      CMS.registerPreviewTemplate(name, function (props) {
        var sub = name === 'articles' ? get(props.entry, 'summary') : name === 'novels' ? get(props.entry, 'tagline') : '';
        return h('article', { className: 'piece', dir: 'rtl', lang: 'ar' },
          note(props.entry),
          h('h1', { className: 'piece-title' }, get(props.entry, 'title') || 'العنوان'),
          sub ? h('p', { className: 'standfirst' }, sub) : null,
          h('div', { className: 'prose' }, props.widgetFor ? props.widgetFor('body') : get(props.entry, 'body')));
      });
    });
  } catch (e) { console.warn('preview templates', e); }
})();
`;
}

function previewCss(base) {
  const asset = `${base}admin/`;
  return `
@font-face { font-family: 'Amiri'; font-weight: 400; src: url('${asset}fonts/amiri-400.woff2') format('woff2'); }
@font-face { font-family: 'Amiri'; font-weight: 700; src: url('${asset}fonts/amiri-700.woff2') format('woff2'); }
@font-face { font-family: 'Aref Ruqaa'; font-weight: 700; src: url('${asset}fonts/aref-ruqaa-700.woff2') format('woff2'); }
@font-face { font-family: 'Noto Naskh Arabic'; font-weight: 400; src: url('${asset}fonts/noto-naskh-400.woff2') format('woff2'); }
html, body { background: #f1e7d1 url('${asset}textures/paper.jpg'); background-blend-mode: multiply; color: #1b1c30; }
body { direction: rtl; font-family: 'Amiri', 'Noto Naskh Arabic', serif; font-size: 1.3rem; line-height: 2; padding: 1.5rem; }
.piece { max-width: 38rem; margin: 0 auto; }
.piece-title { font-family: 'Aref Ruqaa', 'Amiri', serif; font-weight: 700; font-size: 2.6rem; line-height: 1.5; color: #1a2160; margin: 0 0 1rem; }
.standfirst { font-size: 1.35rem; margin: 0 0 1.5rem; }
.draft-note { font-family: 'Noto Naskh Arabic', serif; font-size: 0.95rem; color: #4b4a62; border: 1px dashed #b9b4c9; padding: 0.5rem 0.9rem; border-radius: 2px; }
.poem { font-size: 1.5rem; line-height: 2.1; }
.stanza { margin: 0 0 1.75em; }
.line { display: block; white-space: pre-wrap; padding-inline-start: 1.75em; text-indent: -1.75em; }
.prose h2, .prose h3 { font-family: 'Aref Ruqaa', 'Amiri', serif; color: #1a2160; }
.prose a { color: #1a2160; }
.prose blockquote { margin: 1.5em 0; padding-inline-start: 1.25rem; border-inline-start: 1px solid #1a2160; }
.prose img { max-width: 100%; height: auto; }
`;
}

function checkHtml({ repo, base }) {
  const [owner, name] = repo.split('/');
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>فحص رمز الدخول | نجوى الليل</title>
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<style>
  @font-face { font-family: 'Amiri'; font-weight: 400; src: url('${base}admin/fonts/amiri-400.woff2') format('woff2'); }
  @font-face { font-family: 'Aref Ruqaa'; font-weight: 700; src: url('${base}admin/fonts/aref-ruqaa-700.woff2') format('woff2'); }
  @font-face { font-family: 'Noto Naskh Arabic'; font-weight: 400; src: url('${base}admin/fonts/noto-naskh-400.woff2') format('woff2'); }
  :root { color-scheme: light; }
  body { margin: 0; background: #f1e7d1 url('${base}admin/textures/paper.jpg'); background-blend-mode: multiply; color: #1b1c30;
         font-family: 'Noto Naskh Arabic', 'Amiri', serif; font-size: 1.05rem; line-height: 1.9; }
  main { max-width: 38rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
  h1 { font-family: 'Aref Ruqaa', 'Amiri', serif; color: #1a2160; font-size: 2.4rem; line-height: 1.5; margin: 0 0 .5rem; }
  p { margin: 0 0 1rem; }
  label { display: block; margin: 1.5rem 0 .4rem; }
  input { width: 100%; box-sizing: border-box; padding: .7rem .9rem; font: 1rem ui-monospace, monospace; direction: ltr;
          border: 1px solid #b9b4c9; border-radius: 2px; background: #fffdf7; color: #1b1c30; }
  input:focus { outline: 2px solid #1a2160; outline-offset: 2px; }
  button { margin-top: 1rem; padding: .65rem 1.6rem; font: inherit; color: #f3ead5; background: #121844; border: 0; border-radius: 2px; cursor: pointer; }
  button:disabled { opacity: .6; cursor: default; }
  ol { list-style: none; padding: 0; margin: 2rem 0 0; }
  li { padding: .9rem 1rem; margin-bottom: .6rem; border: 1px solid #d6cdb5; border-radius: 2px; background: rgb(255 253 247 / .6); }
  li b { display: block; }
  .ok b::before { content: '✓ '; color: #1d6b3a; }
  .bad b::before { content: '✗ '; color: #9b1c1c; }
  .ok { border-color: #a9cdb4; } .bad { border-color: #e0a9a9; }
  .note { font-size: .95rem; color: #4b4a62; }
  a { color: #1a2160; }
  code { direction: ltr; unicode-bidi: isolate; font-size: .9em; }
</style>
</head>
<body>
<main>
  <h1>فحص رمز الدخول</h1>
  <p>الصق رمز الدخول إلى اللوحة لتعرف هل يقبله GitHub، وهل يصل إلى مستودع <code>${repo}</code>.</p>
  <p class="note">يُرسَل الرمز إلى GitHub وحده (api.github.com) للفحص، ولا يُحفظ في أيّ مكان. أغلق الصفحة بعد الفحص.</p>
  <form id="f" autocomplete="off">
    <label for="t">رمز الوصول (Personal Access Token)</label>
    <input id="t" type="password" spellcheck="false" autocapitalize="off" placeholder="github_pat_…">
    <button id="go" type="submit">افحص الرمز</button>
  </form>
  <ol id="out" aria-live="polite"></ol>
  <p class="note" style="margin-top:2rem"><a href="./">العودة إلى لوحة التحكّم</a></p>
</main>
<script>
(function () {
  var OWNER = ${JSON.stringify(owner)}, REPO = ${JSON.stringify(name)};
  var out = document.getElementById('out');
  function row(ok, title, detail) {
    var li = document.createElement('li'); li.className = ok ? 'ok' : 'bad';
    var b = document.createElement('b'); b.textContent = title; li.appendChild(b);
    if (detail) { var s = document.createElement('span'); s.textContent = detail; li.appendChild(s); }
    out.appendChild(li);
  }
  function gh(path, token) {
    return fetch('https://api.github.com' + path, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' }, cache: 'no-store' });
  }
  document.getElementById('f').addEventListener('submit', async function (e) {
    e.preventDefault();
    out.textContent = '';
    var input = document.getElementById('t');
    var raw = input.value;
    var token = raw.replace(/[\\s\\u200b-\\u200f\\u202a-\\u202e\\u2066-\\u2069\\ufeff]+/g, '');
    var btn = document.getElementById('go'); btn.disabled = true;
    try {
      if (!token) { row(false, 'لم تلصق رمزًا.'); return; }
      if (token !== raw) row(true, 'أزلتُ مسافات أو أسطرًا زائدة من الرمز.', 'كانت هذه على الأرجح سبب رسالة «الرمز غير صالح». اللوحة صارت تزيلها تلقائيًا أيضًا.');
      if (/^github_pat_/.test(token)) row(true, 'شكل الرمز صحيح: رمز دقيق الصلاحيّات (fine-grained).');
      else if (/^gh[pousr]_/.test(token)) row(true, 'هذا رمز من النوع الكلاسيكيّ (classic).', 'يعمل إن كانت له صلاحيّة repo، لكنّ الرمز الدقيق (fine-grained) أكثر أمانًا لأنّه يقتصر على مستودع واحد.');
      else { row(false, 'هذا لا يبدو رمز GitHub.', 'رمز الوصول الدقيق يبدأ بـ github_pat_ ويُعرض مرّة واحدة فقط عند إنشائه. إن لم تنسخه حينها فأنشئ رمزًا جديدًا.'); }

      var me = await gh('/user', token);
      if (me.status === 401) {
        row(false, 'GitHub يرفض هذا الرمز (401).', 'الأسباب المعتادة: نُسخ ناقصًا، أو حُذف، أو انتهت صلاحيّته، أو أُعيد إنشاؤه فتغيّر. أنشئ رمزًا جديدًا وانسخه كاملًا بزرّ النسخ بجانبه.');
        return;
      }
      if (!me.ok) { row(false, 'تعذّر الاتّصال بـ GitHub (' + me.status + ').', 'حاول مرّة أخرى بعد قليل.'); return; }
      var user = await me.json();
      row(true, 'GitHub يقبل الرمز. صاحبه: ' + user.login);
      if (user.login.toLowerCase() !== OWNER.toLowerCase()) row(false, 'الرمز لحساب آخر غير ' + OWNER + '.', 'أنشئ الرمز وأنت داخل حساب ' + OWNER + '.');

      var repo = await gh('/repos/' + OWNER + '/' + REPO, token);
      if (repo.status === 404) {
        row(false, 'الرمز لا يصل إلى المستودع ' + OWNER + '/' + REPO + '.', 'إمّا أنّ المستودع غير موجود بعد (أنشئه باسم ' + REPO + ' ونوع Private)، وإمّا أنّ الرمز لم يُمنح إيّاه: في إعدادات الرمز اختر Only select repositories ثمّ ' + REPO + '. إن أنشأت المستودع بعد الرمز فعدّل الرمز وأضفه.');
        return;
      }
      if (!repo.ok) { row(false, 'تعذّر قراءة المستودع (' + repo.status + ').'); return; }
      var info = await repo.json();
      row(true, 'الرمز يصل إلى المستودع ' + info.full_name + (info.private ? ' (خاصّ).' : '.'));
      if (!info.private) row(false, 'تنبيه: هذا المستودع عامّ.', 'المسوّدات فيه يمكن لأيّ أحد قراءتها. اجعله Private من Settings.');

      var contents = await gh('/repos/' + OWNER + '/' + REPO + '/contents/', token);
      if (contents.status === 403) {
        row(false, 'الرمز لا يملك صلاحيّة قراءة المحتوى.', 'في إعدادات الرمز: Repository permissions ← Contents ← Read and write.');
        return;
      }
      if (contents.status === 404) {
        row(false, 'المستودع فارغ بعد.', 'لم تُرفع ملفّات الموقع إليه بعد. أخبر Claude ليرفعها، ثمّ أعد الفحص.');
      } else if (contents.ok) {
        row(true, 'الرمز يقرأ ملفّات المستودع.');
      }
      row(true, 'تأكّد من صلاحيّة الكتابة.', 'لا يمكن فحص الكتابة من غير الكتابة فعلًا. في إعدادات الرمز يجب أن تكون Contents على Read and write، لا Read-only. إن كانت كذلك فسجّل الدخول إلى اللوحة الآن.');
    } catch (err) {
      row(false, 'تعذّر الاتّصال بـ GitHub.', 'تأكّد من اتّصال الإنترنت وحاول مرّة أخرى.');
    } finally {
      btn.disabled = false;
      input.value = '';
    }
  });
})();
</script>
</body>
</html>
`;
}

export function writeAdmin({ root, publicOut, base, write, cms }) {
  if (!cms || !cms.repo || !cms.siteUrl) return;
  const { repo, siteUrl, branch = 'main' } = cms;

  const dir = path.join(publicOut, 'admin');
  const modules = path.join(root, 'node_modules');
  // Custom previews load immutable.js on demand from a CDN; the import map in
  // index.html sends that request to this copy.
  const immutableVersion = JSON.parse(fs.readFileSync(path.join(modules, 'immutable/package.json'), 'utf8')).version;
  write(path.join(dir, 'vendor', 'immutable.es.js'), fs.readFileSync(path.join(modules, 'immutable/dist/immutable.es.js')));
  write(path.join(dir, 'index.html'), adminHtml({ base, immutableVersion }));
  write(path.join(dir, 'admin.js'), adminJs(base));
  write(path.join(dir, 'check', 'index.html'), checkHtml({ repo, base }));
  write(path.join(dir, 'config.yml'), YAML.stringify(JSON.parse(JSON.stringify(cmsConfig({ cms: { repo, siteUrl, branch }, base }))), { lineWidth: 0 }));
  const sveltia = path.join(modules, '@sveltia/cms');
  const version = JSON.parse(fs.readFileSync(path.join(sveltia, 'package.json'), 'utf8')).version;
  write(path.join(dir, 'sveltia-cms.js'), fs.readFileSync(path.join(sveltia, 'dist/sveltia-cms.js')));
  // Parts Sveltia loads on demand (React for the previews, the QR code for
  // phone sign-in, Git helpers), served from here rather than a CDN.
  const chunks = path.join(sveltia, 'dist/chunks');
  const copyChunks = (from, to) => {
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      if (entry.isDirectory()) copyChunks(path.join(from, entry.name), path.join(to, entry.name));
      else if (!entry.name.endsWith('.map')) write(path.join(to, entry.name), fs.readFileSync(path.join(from, entry.name)));
    }
  };
  copyChunks(chunks, path.join(dir, 'chunks'));
  // Sveltia downloads its interface translation from a CDN and caches it in
  // the browser; seed that cache from this site's own copy instead.
  const ar = JSON.parse(fs.readFileSync(path.join(sveltia, 'locales/ar.json'), 'utf8'));
  write(
    path.join(dir, 'locale-ar.js'),
    `try{localStorage.setItem('sveltia-cms.locale',JSON.stringify(${JSON.stringify({ _locale: 'ar', _version: version, ...ar })}))}catch(_){}\n`,
  );
  for (const [from, to] of FONT_FILES) write(path.join(dir, 'fonts', to), fs.readFileSync(path.join(modules, from)));
  write(path.join(dir, 'textures', 'paper.jpg'), fs.readFileSync(path.join(root, 'src/site/theme/textures/paper.jpg')));
}
