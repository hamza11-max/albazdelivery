/**
 * Text normalisation for catalog search, used both when indexing and when
 * querying, so "احمر" finds "أحمر" and "chaussure" finds "Chaussuré".
 */
const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g // harakat, Quranic marks, tatweel
const LATIN_MARKS = /[̀-ͯ]/g

export function normaliseSearchText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(LATIN_MARKS, '')
    .replace(ARABIC_MARKS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Turns what someone typed into an SQLite FTS5 query: every word must match
 * as a prefix ("chem bla" finds "Chemise blanche"). Returns null when there is
 * nothing to search for. Words are quoted, so FTS operators typed by a user
 * (AND, NEAR, *, -) are treated as plain text.
 */
export function ftsQuery(input: string): string | null {
  const words = normaliseSearchText(input)
    .split(' ')
    .map((w) => w.replace(/"/g, ''))
    .filter((w) => w.length > 0)
    .slice(0, 8)
  return words.length === 0 ? null : words.map((w) => `"${w}"*`).join(' ')
}
