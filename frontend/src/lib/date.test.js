import { describe, expect, it } from 'vitest';
import { addDays, addMonths, formatLongEN, formatLongJA, formatShort, nowHMTokyo, todayTokyo, weekdaysOfMonth } from './date.js';

describe('Asia/Tokyo helpers', () => {
  it('uses the Tokyo date, not UTC', () => {
    // 2026-11-15 20:30 UTC is already 2026-11-16 05:30 in Tokyo
    const instant = new Date('2026-11-15T20:30:00Z');
    expect(todayTokyo(instant)).toBe('2026-11-16');
    expect(nowHMTokyo(instant)).toBe('05:30');
  });

  it('formats dates in English and Japanese', () => {
    expect(formatLongEN('2026-11-16')).toBe('Monday, 16 November 2026');
    expect(formatLongJA('2026-11-16')).toBe('2026年11月16日(月)');
    expect(formatShort('2026-11-16')).toBe('16 Nov (Mon)');
  });

  it('does month and day math', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(weekdaysOfMonth('2026-12')).toHaveLength(23);
  });
});
