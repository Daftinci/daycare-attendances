import { describe, expect, it } from 'vitest';
import { computeBalance, deriveStatus, isFever, isLowBalance, matchesFilter, parseTemp, toYen } from './rules.js';

describe('isFever', () => {
  it('uses 37.5 °C as the threshold', () => {
    expect(isFever(37.4)).toBe(false);
    expect(isFever(37.5)).toBe(true);
    expect(isFever('37.6')).toBe(true);
  });
  it('treats empty values as no fever', () => {
    expect(isFever(null)).toBe(false);
    expect(isFever('')).toBe(false);
  });
});

describe('parseTemp', () => {
  it('rounds to 1 decimal', () => {
    expect(parseTemp('36.66')).toBe(36.7);
    expect(parseTemp('abc')).toBeNull();
  });
});

describe('toYen', () => {
  it('returns whole, non-negative yen', () => {
    expect(toYen('120')).toBe(120);
    expect(toYen('12.9')).toBe(12);
    expect(toYen('-5')).toBe(0);
    expect(toYen('')).toBe(0);
  });
});

describe('computeBalance', () => {
  const plan = { snack_deposit: 500, bento_deposit: 450 };

  it('subtracts snack and bento separately', () => {
    const b = computeBalance(plan, [
      { snack_spent: 40, bento_spent: 0 },
      { snack_spent: 30, bento_spent: 150 },
    ]);
    expect(b.snack).toEqual({ deposit: 500, spent: 70, remaining: 430 });
    expect(b.bento).toEqual({ deposit: 450, spent: 150, remaining: 300 });
    expect(isLowBalance(b)).toBe(false);
  });

  it('goes negative without clamping', () => {
    const b = computeBalance(plan, [{ snack_spent: 600, bento_spent: 0 }]);
    expect(b.snack.remaining).toBe(-100);
    expect(isLowBalance(b)).toBe(true);
  });

  it('uses 0 deposit when there is no plan', () => {
    const b = computeBalance(null, [{ snack_spent: 20, bento_spent: 0 }]);
    expect(b.snack.remaining).toBe(-20);
  });
});

describe('deriveStatus', () => {
  it('follows the Today rules', () => {
    expect(deriveStatus(true, { status: 'present' })).toBe('present');
    expect(deriveStatus(false, { status: 'present' })).toBe('present');
    expect(deriveStatus(true, null)).toBe('waiting');
    expect(deriveStatus(false, null)).toBe('off');
    expect(deriveStatus(true, { status: 'absent' })).toBe('absent');
  });
  it('groups absent with Day off', () => {
    expect(matchesFilter('absent', 'off')).toBe(true);
    expect(matchesFilter('waiting', 'off')).toBe(false);
  });
});
