// Arabic text helpers: digits, plurals, dates, search normalisation.

const DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function arabicDigits(value) {
  return String(value).replace(/[0-9]/g, (d) => DIGITS[d]);
}

export function formatDate(date, locale) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatYear(date) {
  return arabicDigits(date.getUTCFullYear());
}

// Arabic counted nouns: 1, 2, 3 to 10, 11 and up.
function counted(n, { one, two, few, many }) {
  if (n === 1) return one;
  if (n === 2) return two;
  const num = arabicDigits(n);
  if (n >= 3 && n <= 10) return `${num} ${few}`;
  return `${num} ${many}`;
}

export function countPieces(n) {
  if (n === 0) return 'لا نصوص بعد';
  return counted(n, { one: 'نصّ واحد', two: 'نصّان', few: 'نصوص', many: 'نصًّا' });
}

export function readingTime(words, wordsPerMinute) {
  const minutes = Math.max(1, Math.round(words / wordsPerMinute));
  return 'قراءة في ' + counted(minutes, { one: 'دقيقة', two: 'دقيقتين', few: 'دقائق', many: 'دقيقة' });
}

export function wordCount(text) {
  return (text.match(/[\p{L}\p{N}]+/gu) || []).length;
}

// Shared with the browser search script: keep both copies in step.
export function normalizeArabic(text) {
  return String(text)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '') // tashkeel and tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

const ORDINALS = [
  'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
  'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر', 'السادس عشر', 'السابع عشر',
  'الثامن عشر', 'التاسع عشر', 'العشرون',
];

// «الفصل الأول» … «الفصل العشرون», then «الفصل ٢١».
export function chapterName(n) {
  return `الفصل ${ORDINALS[n - 1] || arabicDigits(n)}`;
}

export function countChapters(n) {
  if (n === 0) return 'لا فصول بعد';
  if (n === 1) return 'فصل واحد';
  if (n === 2) return 'فصلان';
  return `${arabicDigits(n)} ${n <= 10 ? 'فصول' : 'فصلًا'}`;
}
