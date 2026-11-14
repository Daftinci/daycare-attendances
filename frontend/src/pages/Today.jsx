import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { T, useI18n } from '../i18n/index.jsx';
import { useAttendance, useCheckIn } from '../api/hooks.js';
import { addDays, todayTokyo } from '../lib/date.js';
import { matchesFilter } from '../lib/rules.js';
import StudentRow, { StudentListHeader } from '../components/StudentRow.jsx';
import { PageMessage, SegmentedControl } from '../components/ui.jsx';

function DatePicker({ date, onChange }) {
  const today = todayTokyo();
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn-outline w-11 px-0" aria-label={t('date.prev')} onClick={() => onChange(addDays(date, -1))}>‹</button>
      <label className="sr-only" htmlFor="today-date"><T k="date.pick" /></label>
      <input id="today-date" type="date" value={date} onChange={(e) => e.target.value && onChange(e.target.value)} className="input" />
      <button type="button" className="btn-outline w-11 px-0" aria-label={t('date.next')} onClick={() => onChange(addDays(date, 1))}>›</button>
      {date !== today && (
        <button type="button" className="btn-outline" onClick={() => onChange(today)}><T k="date.today" /></button>
      )}
    </div>
  );
}

function SummaryCard({ labelK, value, extra, warn }) {
  return (
    <div className={`rounded-lg border p-4 ${warn ? 'border-warn-line bg-warn-bg' : 'border-line bg-surface'}`}>
      <div className={`text-[13px] ${warn ? 'text-warn' : 'text-muted'}`}><T k={labelK} /></div>
      <div className={`mt-1 text-[28px] font-bold ${warn ? 'text-warn' : ''}`}>
        {value}
        {extra && <span className="text-[15px] font-medium text-muted"> {extra}</span>}
      </div>
    </div>
  );
}

function summarize(rows) {
  return {
    present: rows.filter((r) => r.status === 'present').length,
    planned: rows.filter((r) => r.is_planned).length,
    waiting: rows.filter((r) => r.status === 'waiting').length,
    fever: rows.filter((r) => r.has_fever).length,
    medicine: rows.filter((r) => r.medicine_taken).length,
  };
}

const FILTERS = ['all', 'present', 'waiting', 'off'];

export default function Today() {
  const [params, setParams] = useSearchParams();
  const date = params.get('date') || todayTokyo();
  const [filter, setFilter] = useState('all');
  const { data: rows, isLoading, isError } = useAttendance(date);
  const checkIn = useCheckIn(date);
  const { t, longDate } = useI18n();

  const setDate = (d) => setParams(d === todayTokyo() ? {} : { date: d });
  const isToday = date === todayTokyo();
  const sum = rows ? summarize(rows) : null;
  const visible = rows?.filter((r) => matchesFilter(r.status, filter)) ?? [];
  const filterOptions = FILTERS.map((f) => ({
    value: f,
    label: f === 'all' && rows ? `${t('filter.all')} (${rows.length})` : t(`filter.${f}`),
  }));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[13px] text-muted">{longDate(date)}</div>
          <h1 className="mt-1 text-[30px] font-bold leading-tight">
            <T k={isToday ? 'today.title' : 'today.titleOther'} />
          </h1>
          <p className="mt-1 text-[13px] text-muted"><T k="today.help" /></p>
        </div>
        <DatePicker date={date} onChange={setDate} />
      </div>

      {isLoading && <PageMessage />}
      {isError && <PageMessage k="common.error" />}
      {sum && (
        <>
          <section aria-label={t('today.summary')} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard labelK="summary.present" value={sum.present} extra={`/ ${sum.planned} ${t('summary.planned')}`} />
            <SummaryCard labelK="summary.notYet" value={sum.waiting} />
            <SummaryCard labelK="summary.fever" value={sum.fever} warn />
            <SummaryCard labelK="summary.medicine" value={sum.medicine} />
          </section>

          <SegmentedControl labelK="filter.label" options={filterOptions} value={filter} onChange={setFilter} tone="dark" />

          <section aria-label={t('nav.students')} className="overflow-hidden rounded-xl border border-line bg-surface">
            <StudentListHeader />
            <ul className="m-0 list-none p-0">
              {visible.map((row) => (
                <StudentRow
                  key={row.student.id}
                  row={row}
                  date={date}
                  onCheckIn={(id) => checkIn.mutate(id)}
                  checkingIn={checkIn.isPending && checkIn.variables === row.student.id}
                />
              ))}
            </ul>
            {visible.length === 0 && <PageMessage k="today.empty" />}
          </section>
        </>
      )}
    </>
  );
}
