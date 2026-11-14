import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { buildSummaryWorkbook } from './excel.js';
import { getSummary } from '../api/mock/server.js';
import { translate } from '../i18n/index.jsx';

const ctx = (lang, overrides) => ({
  t: (k, v) => translate(lang, k, v),
  from: '2026-11-01',
  to: '2026-11-30',
  isMonth: true,
  title: 'Monthly summary — November 2026',
  subtitle: 'Himawari',
  ...overrides,
});

describe('getSummary', () => {
  it('counts planned, attended and money per student', async () => {
    const rows = await getSummary('2026-11-01', '2026-11-30', '2026-11-15');
    expect(rows).toHaveLength(24);
    const haruto = rows.find((r) => r.student.id === 1);
    expect(haruto.planned_days).toBeGreaterThan(0);
    expect(haruto.attended + haruto.absent).toBeLessThanOrEqual(haruto.planned_days);
    expect(haruto.snack.deposit).toBe(500);
    // Sota is seeded to overspend snack money
    expect(rows.find((r) => r.student.id === 3).snack.remaining).toBeLessThan(0);
    expect(rows.find((r) => r.student.id === 11).snack.remaining).toBeLessThan(0);
    // Hina has no November plan
    const hina = rows.find((r) => r.student.id === 6);
    expect(hina.planned_days).toBe(0);
    expect(hina.has_deposit).toBe(false);
  });

  it('marks past planned days without a log as missing', async () => {
    const rows = await getSummary('2026-11-16', '2026-11-22', '2026-11-20');
    const haruto = rows.find((r) => r.student.id === 1);
    expect(haruto.days['2026-11-16']).toBe('missing');
    expect(haruto.days['2026-11-20']).toBe('planned');
    expect(haruto.not_recorded).toBeGreaterThan(0);
  });
});

describe('buildSummaryWorkbook', () => {
  it('creates Summary and Attendance sheets with one row per student plus totals', async () => {
    const rows = await getSummary('2026-11-01', '2026-11-30', '2026-11-15');
    const wb = buildSummaryWorkbook(ExcelJS, rows, ctx('en'));
    const [summary, attendance] = wb.worksheets;
    expect(summary.name).toBe('Summary');
    expect(attendance.name).toBe('Attendance');
    expect(summary.getRow(4).getCell(1).value).toBe('Name');
    // title (1) + subtitle (2) + blank (3) + header (4) + 24 students + total
    expect(summary.rowCount).toBe(4 + 24 + 1);
    expect(summary.getRow(29).getCell(1).value).toBe('Total');
    expect(summary.getRow(5).getCell(1).value).toBe('Haruto Sato');
    // monthly sheet includes deposit / left columns
    expect(summary.getRow(4).cellCount).toBe(14);

    // attendance grid: 2 name cols + 30 days + attended
    expect(attendance.getRow(4).cellCount).toBe(33);
    const sotaRow = attendance.getRow(6 + 2); // rows 1-5 are title, subtitle, blank, day numbers, weekdays
    expect(sotaRow.getCell(1).value).toBe('Sota Takahashi');
  });

  it('uses the selected language and drops money balance columns for a week', async () => {
    const rows = await getSummary('2026-11-09', '2026-11-15', '2026-11-15');
    const wb = buildSummaryWorkbook(ExcelJS, rows, ctx('ja', { from: '2026-11-09', to: '2026-11-15', isMonth: false }));
    const summary = wb.worksheets[0];
    expect(summary.name).toBe('集計');
    expect(summary.getRow(4).getCell(2).value).toBe('氏名');
    expect(summary.getRow(4).cellCount).toBe(10);
    const buffer = await wb.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
