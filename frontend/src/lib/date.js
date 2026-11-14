// All app dates are ISO strings (YYYY-MM-DD) in Asia/Tokyo.
// Calendar math runs in UTC on those strings, so the browser's own time zone never matters.

const TZ = 'Asia/Tokyo';
const JA_WD = ['日', '月', '火', '水', '木', '金', '土'];

export function todayTokyo(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function nowHMTokyo(now = new Date()) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
}

export function toUTCDate(iso) {
  return new Date(`${iso}T00:00:00Z`);
}

export function toISO(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const d = toUTCDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

export function dayOfWeek(iso) {
  return toUTCDate(iso).getUTCDay();
}

export function isWeekend(iso) {
  const dow = dayOfWeek(iso);
  return dow === 0 || dow === 6;
}

function fmt(iso, options) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...options }).format(toUTCDate(iso));
}

/** "Monday, 16 November 2026" */
export function formatLongEN(iso) {
  const wd = fmt(iso, { weekday: 'long' });
  return `${wd}, ${fmt(iso, { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

/** "2026年11月16日(月)" */
export function formatLongJA(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}年${m}月${d}日(${JA_WD[dayOfWeek(iso)]})`;
}

/** "16 Nov (Mon)" */
export function formatShort(iso) {
  return `${fmt(iso, { day: 'numeric', month: 'short' })} (${fmt(iso, { weekday: 'short' })})`;
}

/** "16 Nov 2026" */
export function formatMedium(iso) {
  return fmt(iso, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function monthKey(iso) {
  return iso.slice(0, 7);
}

export function firstOfMonth(ym) {
  return `${ym}-01`;
}

export function daysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function lastOfMonth(ym) {
  return `${ym}-${String(daysInMonth(ym)).padStart(2, '0')}`;
}

export function addMonths(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  return toISO(new Date(Date.UTC(y, m - 1 + n, 1))).slice(0, 7);
}

export function datesOfMonth(ym) {
  return Array.from({ length: daysInMonth(ym) }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`);
}

export function weekdaysOfMonth(ym) {
  return datesOfMonth(ym).filter((iso) => !isWeekend(iso));
}

/** { en: "December 2026", ja: "2026年12月" } */
export function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return { en: fmt(`${ym}-01`, { month: 'long', year: 'numeric' }), ja: `${y}年${m}月` };
}

/** Monday of the week that contains `iso` (weeks run Monday–Sunday). */
export function startOfWeek(iso) {
  const dow = dayOfWeek(iso);
  return addDays(iso, dow === 0 ? -6 : 1 - dow);
}

/** Every date from `from` to `to`, both included. */
export function datesBetween(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** "11月16日(月)" */
export function formatShortJA(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${m}月${d}日(${JA_WD[dayOfWeek(iso)]})`;
}
