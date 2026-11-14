// Excel (.xlsx) export for the weekly / monthly summary.
// exceljs is loaded only when the teacher presses Export, so it does not slow the app down.
import { datesBetween, dayOfWeek, isWeekend } from './date.js';

const COLORS = {
  header: 'FFE3F1EF', // primary tint
  headerText: 'FF0A574F',
  weekend: 'FFEEEDE8',
  warnText: 'FF8A3A06',
  warnFill: 'FFFDF0E6',
  border: 'FFE3E1DA',
};
const YEN = '"¥"#,##0;[Red]-"¥"#,##0';
const MARKS = { present: '○', absent: '×', missing: '–', planned: '·' };

const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const thin = { style: 'thin', color: { argb: COLORS.border } };
const box = { top: thin, left: thin, bottom: thin, right: thin };

/** Columns of the Summary sheet. Money deposit / left only make sense for a whole month. */
export function summaryColumns(t, isMonth) {
  const cols = [
    { key: 'name_en', header: t('xl.nameEn'), width: 20, get: (r) => r.student.name_en },
    { key: 'name_ja', header: t('xl.nameJa'), width: 14, get: (r) => r.student.name_ja },
    { key: 'planned', header: t('xl.planned'), width: 10, get: (r) => r.planned_days, sum: true },
    { key: 'attended', header: t('xl.attended'), width: 10, get: (r) => r.attended, sum: true },
    { key: 'absent', header: t('xl.absent'), width: 10, get: (r) => r.absent, sum: true },
    { key: 'not_recorded', header: t('xl.notRecorded'), width: 12, get: (r) => r.not_recorded, sum: true },
    { key: 'fever', header: t('xl.fever'), width: 10, get: (r) => r.fever_days, sum: true, warn: (v) => v > 0 },
    { key: 'medicine', header: t('xl.medicine'), width: 10, get: (r) => r.medicine_days, sum: true },
    { key: 'snack_spent', header: t('xl.snackSpent'), width: 13, get: (r) => r.snack.spent, sum: true, money: true },
    { key: 'bento_spent', header: t('xl.bentoSpent'), width: 13, get: (r) => r.bento.spent, sum: true, money: true },
  ];
  if (!isMonth) return cols;
  const deposit = (line) => (r) => (r.has_deposit ? r[line].deposit : null);
  const left = (line) => (r) => (r.has_deposit ? r[line].remaining : null);
  return [
    ...cols,
    { key: 'snack_deposit', header: t('xl.snackDeposit'), width: 13, get: deposit('snack'), sum: true, money: true },
    { key: 'snack_left', header: t('xl.snackLeft'), width: 13, get: left('snack'), sum: true, money: true, warn: (v) => v < 0 },
    { key: 'bento_deposit', header: t('xl.bentoDeposit'), width: 13, get: deposit('bento'), sum: true, money: true },
    { key: 'bento_left', header: t('xl.bentoLeft'), width: 13, get: left('bento'), sum: true, money: true, warn: (v) => v < 0 },
  ];
}

function addTitle(ws, { title, subtitle, width }) {
  ws.addRow([title]).font = { bold: true, size: 14 };
  ws.addRow([subtitle]).font = { color: { argb: 'FF5B616B' } };
  ws.addRow([]);
  ws.mergeCells(1, 1, 1, Math.max(width, 2));
  ws.mergeCells(2, 1, 2, Math.max(width, 2));
}

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.headerText } };
    cell.fill = fill(COLORS.header);
    cell.border = box;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  row.height = 32;
}

function addSummarySheet(wb, rows, ctx) {
  const ws = wb.addWorksheet(ctx.t('xl.sheetSummary'), { views: [{ state: 'frozen', xSplit: 2, ySplit: 4 }] });
  const cols = summaryColumns(ctx.t, ctx.isMonth);
  addTitle(ws, { title: ctx.title, subtitle: ctx.subtitle, width: cols.length });
  styleHeader(ws.addRow(cols.map((c) => c.header)));
  cols.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width;
  });

  for (const r of rows) {
    const row = ws.addRow(cols.map((c) => c.get(r)));
    cols.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      cell.border = box;
      if (c.money) cell.numFmt = YEN;
      if (c.warn && cell.value != null && c.warn(cell.value)) {
        cell.font = { bold: true, color: { argb: COLORS.warnText } };
        cell.fill = fill(COLORS.warnFill);
      }
    });
  }

  const totals = cols.map((c, i) => {
    if (i === 0) return ctx.t('xl.total');
    if (!c.sum) return null;
    return rows.reduce((s, r) => s + (c.get(r) ?? 0), 0);
  });
  const totalRow = ws.addRow(totals);
  totalRow.font = { bold: true };
  cols.forEach((c, i) => {
    const cell = totalRow.getCell(i + 1);
    cell.border = { ...box, top: { style: 'medium' } };
    if (c.money) cell.numFmt = YEN;
  });
  return ws;
}

function addAttendanceSheet(wb, rows, ctx) {
  const dates = datesBetween(ctx.from, ctx.to);
  const ws = wb.addWorksheet(ctx.t('xl.sheetAttendance'), { views: [{ state: 'frozen', xSplit: 2, ySplit: 5 }] });
  const width = dates.length + 3;
  addTitle(ws, { title: ctx.title, subtitle: ctx.subtitle, width });

  const dayRow = ws.addRow([ctx.t('xl.nameEn'), ctx.t('xl.nameJa'), ...dates.map((d) => Number(d.slice(8))), ctx.t('xl.attended')]);
  const wdRow = ws.addRow(['', '', ...dates.map((d) => ctx.t(`wd.${dayOfWeek(d)}`)), '']);
  styleHeader(dayRow);
  styleHeader(wdRow);
  wdRow.height = 18;
  ws.getColumn(1).width = 20;
  ws.getColumn(2).width = 14;
  dates.forEach((_, i) => {
    ws.getColumn(i + 3).width = 4.5;
  });
  ws.getColumn(width).width = 10;

  for (const r of rows) {
    const marks = dates.map((d) => MARKS[r.days[d]] ?? '');
    const row = ws.addRow([r.student.name_en, r.student.name_ja, ...marks, r.attended]);
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.border = box;
      if (col > 2) cell.alignment = { horizontal: 'center' };
      const d = dates[col - 3];
      if (d && isWeekend(d)) cell.fill = fill(COLORS.weekend);
      if (d && r.days[d] === 'absent') cell.font = { color: { argb: COLORS.warnText } };
    });
  }
  ws.addRow([]);
  ws.addRow([ctx.t('xl.legend')]).font = { color: { argb: 'FF5B616B' } };
  return ws;
}

/** Build the workbook. `ExcelJS` is passed in so this stays testable and lazy-loadable. */
export function buildSummaryWorkbook(ExcelJS, rows, ctx) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Attendance 出欠管理';
  wb.created = new Date();
  addSummarySheet(wb, rows, ctx);
  addAttendanceSheet(wb, rows, ctx);
  return wb;
}

function download(buffer, filename) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Load exceljs, build the file and start the download. */
export async function exportSummaryXlsx(rows, ctx) {
  const mod = await import('exceljs');
  const ExcelJS = mod.default ?? mod;
  const wb = buildSummaryWorkbook(ExcelJS, rows, ctx);
  download(await wb.xlsx.writeBuffer(), ctx.filename);
}
