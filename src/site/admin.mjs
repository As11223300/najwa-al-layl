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
