(function () {
  // A token pasted from a note or a message often carries a space or a line
  // break, which GitHub rejects as an invalid token: strip them as it is typed.
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'INPUT') return;
    var label = (t.getAttribute('aria-label') || '').toLowerCase();
    if (label.indexOf('access token') < 0 && label.indexOf('رمز الوصول') < 0) return;
    var clean = t.value.replace(/[\s\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]+/g, '');
    if (clean !== t.value) { t.value = clean; t.dispatchEvent(new Event('input', { bubbles: true })); }
  }, true);
  if (!window.CMS) return;
  var css = "\n@font-face { font-family: 'Amiri'; font-weight: 400; src: url('/najwa-al-layl/studio-l1ysrz5whpf9/fonts/amiri-400.woff2') format('woff2'); }\n@font-face { font-family: 'Amiri'; font-weight: 700; src: url('/najwa-al-layl/studio-l1ysrz5whpf9/fonts/amiri-700.woff2') format('woff2'); }\n@font-face { font-family: 'Aref Ruqaa'; font-weight: 700; src: url('/najwa-al-layl/studio-l1ysrz5whpf9/fonts/aref-ruqaa-700.woff2') format('woff2'); }\n@font-face { font-family: 'Noto Naskh Arabic'; font-weight: 400; src: url('/najwa-al-layl/studio-l1ysrz5whpf9/fonts/noto-naskh-400.woff2') format('woff2'); }\nhtml, body { background: #f1e7d1 url('/najwa-al-layl/studio-l1ysrz5whpf9/textures/paper.jpg'); background-blend-mode: multiply; color: #1b1c30; }\nbody { direction: rtl; font-family: 'Amiri', 'Noto Naskh Arabic', serif; font-size: 1.3rem; line-height: 2; padding: 1.5rem; }\n.piece { max-width: 38rem; margin: 0 auto; }\n.piece-title { font-family: 'Aref Ruqaa', 'Amiri', serif; font-weight: 700; font-size: 2.6rem; line-height: 1.5; color: #1a2160; margin: 0 0 1rem; }\n.standfirst { font-size: 1.35rem; margin: 0 0 1.5rem; }\n.draft-note { font-family: 'Noto Naskh Arabic', serif; font-size: 0.95rem; color: #4b4a62; border: 1px dashed #b9b4c9; padding: 0.5rem 0.9rem; border-radius: 2px; }\n.poem { font-size: 1.5rem; line-height: 2.1; }\n.stanza { margin: 0 0 1.75em; }\n.line { display: block; white-space: pre-wrap; padding-inline-start: 1.75em; text-indent: -1.75em; }\n.prose h2, .prose h3 { font-family: 'Aref Ruqaa', 'Amiri', serif; color: #1a2160; }\n.prose a { color: #1a2160; }\n.prose blockquote { margin: 1.5em 0; padding-inline-start: 1.25rem; border-inline-start: 1px solid #1a2160; }\n.prose img { max-width: 100%; height: auto; }\n";
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
      var body = get(props.entry, 'body').replace(/\s+$/, '');
      var stanzas = body ? body.split(/\n[ \t]*\n/) : [];
      return h('article', { className: 'piece', dir: 'rtl', lang: 'ar' },
        note(props.entry),
        h('h1', { className: 'piece-title' }, get(props.entry, 'title') || 'عنوان القصيدة'),
        h('div', { className: 'poem' }, stanzas.map(function (s, i) {
          return h('p', { className: 'stanza', key: i }, s.split('\n').map(function (line, j) {
            return h('span', { className: 'line', key: j }, line || '\u00a0');
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
