// Site-wide settings for «نجوى الليل».
// Edit these freely; every page is regenerated from them.

export default {
  // The admin dashboard (/admin/) edits this private repository; every save
  // there rebuilds the site and publishes it to siteUrl.
  cms: {
    repo: 'As11223300/najwa-al-layl-studio',
    branch: 'main',
    siteUrl: 'https://as11223300.github.io/najwa-al-layl/',
  },

  // name, tagline, author and description below are defaults: once the
  // author edits «معلومات الموقع» in the dashboard, content/settings.json wins.
  name: 'نجوى الليل',

  // One line under the name in the footer colophon.
  tagline: 'قصائد ومقالات ورواية تُكتب في آخر الليل',

  // Your name or pen name, shown in the colophon and on the novel cover.
  author: '',

  // Used in <meta name="description"> on the home page.
  description: 'نجوى الليل: مجلّة شخصيّة للشعر والمقالات ورواية تُنشر فصلًا فصلًا.',

  // Date and number formatting. "ar-u-nu-arab" gives Arabic-Indic digits and
  // month names such as «يناير». For Levantine month names («كانون الثاني»),
  // use "ar-SY-u-nu-arab".
  locale: 'ar-u-nu-arab',

  // Average reading speed used for the reading-time line on articles.
  wordsPerMinute: 180,
};
