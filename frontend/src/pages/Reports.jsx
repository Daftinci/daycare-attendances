import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { T, useI18n } from '../i18n/index.jsx';
import { useClasses, useSummary } from '../api/hooks.js';
import { addDays, addMonths, firstOfMonth, lastOfMonth, monthKey, startOfWeek, todayTokyo } from '../lib/date.js';
import { exportSummaryXlsx, summaryColumns } from '../lib/excel.js';
import { PageMessage, SectionTitle, SegmentedControl, WarningBox, yen } from '../components/ui.jsx';

const TYPES = [
  { value: 'week', k: 'report.week' },
  { value: 'month', k: 'report.month' },
];

/** Work out from/to for the chosen period. `at` is any date inside it. */
function periodOf(type, at) {
  if (type === 'week') {
    const from = startOfWeek(at);
    return { from, to: addDays(from, 6) };
  }
  const ym = monthKey(at);
  return { from: firstOfMonth(ym), to: lastOfMonth(ym) };
}

function shiftPeriod(type, at, step) {
  return type === 'week' ? addDays(startOfWeek(at), 7 * step) : firstOfMonth(addMonths(monthKey(at), step));
}

function PeriodNav({ label, onPrev, onNext }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <button type="button" className="btn-outline w-11 px-0" aria-label={t('report.prev')} onClick={onPrev}>‹</button>
      <div data-testid="period-label" className="min-w-[200px] text-center text-lg font-semibold">{label}</div>
      <button type="button" className="btn-outline w-11 px-0" aria-label={t('report.next')} onClick={onNext}>›</button>
    </div>
  );
}

function PreviewTable({ rows, isMonth }) {
  const { t } = useI18n();
  const cols = summaryColumns(t, isMonth);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            {cols.map((c) => (
              <th key={c.key} scope="col" className="whitespace-nowrap border-b border-line px-2.5 py-2 font-medium">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.student.id} className="border-b border-line-soft">
              {cols.map((c) => {
                const v = c.get(r);
                const warn = v != null && c.warn?.(v);
                return (
                  <td key={c.key} className={`whitespace-nowrap px-2.5 py-2.5 ${warn ? 'font-bold text-warn-strong' : ''}`}>
                    {v == null ? '—' : c.money ? yen(v) : v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const { t, shortDate, monthName, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const type = params.get('type') === 'week' ? 'week' : 'month';
  const at = params.get('at') || todayTokyo();
  const { from, to } = periodOf(type, at);
  const isMonth = type === 'month';
  const summary = useSummary(from, to);
  const { data: classes } = useClasses();
  const [exporting, setExporting] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);

  const go = (nextType, nextAt) => setParams({ type: nextType, at: nextAt });
  const label = isMonth ? monthName(monthKey(from)) : `${shortDate(from)} – ${shortDate(to)}`;

  const onExport = async () => {
    setExporting(true);
    setExportFailed(false);
    try {
      await exportSummaryXlsx(summary.data, {
        t,
        from,
        to,
        isMonth,
        title: `${t(isMonth ? 'report.monthlyTitle' : 'report.weeklyTitle')} — ${label}`,
        subtitle: [classes?.[0]?.name, t('xl.exportedOn', { date: shortDate(todayTokyo()) })].filter(Boolean).join(' · '),
        filename: isMonth ? `attendance-month-${monthKey(from)}-${lang}.xlsx` : `attendance-week-${from}-${lang}.xlsx`,
      });
    } catch (err) {
      console.error(err);
      setExportFailed(true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div>
        <SectionTitle as="h1" k="report.title" className="text-[28px]" />
        <p className="mt-1.5 text-sm text-muted"><T k="report.help" /></p>
      </div>

      <section className="card flex flex-wrap items-center justify-between gap-4">
        <SegmentedControl labelK="report.periodType" options={TYPES} value={type} onChange={(v) => go(v, at)} />
        <PeriodNav label={label} onPrev={() => go(type, shiftPeriod(type, at, -1))} onNext={() => go(type, shiftPeriod(type, at, 1))} />
        <button type="button" className="btn-primary" disabled={!summary.data || exporting} onClick={onExport}>
          <T k={exporting ? 'report.exporting' : 'report.export'} />
        </button>
      </section>

      {exportFailed && <WarningBox k="report.exportError" />}

      <section className="card flex flex-col gap-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <SectionTitle k="report.preview" className="text-lg" />
          {!isMonth && <span className="text-[13px] text-muted"><T k="report.moneyNote" /></span>}
        </div>
        {summary.data ? <PreviewTable rows={summary.data} isMonth={isMonth} /> : <PageMessage />}
      </section>
    </>
  );
}
