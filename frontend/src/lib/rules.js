// Business rules. Mirror of the backend services/ — keep in sync with CLAUDE.md.

export const FEVER_THRESHOLD = 37.5;
export const DEFAULT_SNACK_DEPOSIT = 500;
export const DEFAULT_BENTO_DEPOSIT = 450;

/** Temperature with 1 decimal, or null when empty/invalid. */
export function parseTemp(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

export function isFever(temperature) {
  const t = parseTemp(temperature);
  return t !== null && t >= FEVER_THRESHOLD;
}

/** Money is always whole yen and never negative. */
export function toYen(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function sumYen(logs, field) {
  return logs.reduce((sum, log) => sum + toYen(log[field]), 0);
}

function line(deposit, spent) {
  return { deposit, spent, remaining: deposit - spent };
}

/** Balance for one month = deposit (monthly plan) − sum of daily spend. Snack and bento are separate. */
export function computeBalance(plan, logs) {
  return {
    snack: line(plan ? toYen(plan.snack_deposit) : 0, sumYen(logs, 'snack_spent')),
    bento: line(plan ? toYen(plan.bento_deposit) : 0, sumYen(logs, 'bento_spent')),
  };
}

export function isLowBalance(balance) {
  return balance.snack.remaining < 0 || balance.bento.remaining < 0;
}

/**
 * Status for the Today screen.
 * present: daily log with status present
 * absent:  daily log with status absent (grouped with "Day off")
 * waiting: date is planned, no check-in yet
 * off:     date is not in the monthly plan
 */
export function deriveStatus(isPlanned, log) {
  if (log?.status === 'present') return 'present';
  if (log?.status === 'absent') return 'absent';
  return isPlanned ? 'waiting' : 'off';
}

export function matchesFilter(status, filter) {
  if (filter === 'all') return true;
  if (filter === 'off') return status === 'off' || status === 'absent';
  return status === filter;
}
