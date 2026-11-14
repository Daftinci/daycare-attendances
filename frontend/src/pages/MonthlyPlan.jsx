import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { T, useI18n } from '../i18n/index.jsx';
import { useMonthlyPlan, useSaveMonthlyPlan, useStudents } from '../api/hooks.js';
import { addMonths, monthKey, todayTokyo, weekdaysOfMonth } from '../lib/date.js';
import { DEFAULT_BENTO_DEPOSIT, DEFAULT_SNACK_DEPOSIT, toYen } from '../lib/rules.js';
import PlanCalendar from '../components/PlanCalendar.jsx';
import { PageMessage, SectionTitle, WarningBox, yen } from '../components/ui.jsx';

function Labeled({ k, className = '', children }) {
  return (
    <label className={`field-label ${className}`}>
      <span><T k={k} /></span>
      {children}
    </label>
  );
}

function toForm(plan) {
  return {
    days: new Set(plan?.days ?? []),
    snack_deposit: plan?.snack_deposit ?? DEFAULT_SNACK_DEPOSIT,
    bento_deposit: plan?.bento_deposit ?? DEFAULT_BENTO_DEPOSIT,
    money_received: plan?.money_received ?? false,
    report_received_on: plan?.report_received_on ?? todayTokyo(),
    parent_notes: plan?.parent_notes ?? '',
  };
}

function PlanForm({ studentId, ym, saved }) {
  const [f, setF] = useState(() => toForm(saved));
  const [justSaved, setJustSaved] = useState(false);
  const save = useSaveMonthlyPlan(studentId, ym);
  const set = (key, value) => {
    setJustSaved(false);
    setF((prev) => ({ ...prev, [key]: value }));
  };
  const toggle = (iso) => {
    const days = new Set(f.days);
    days.has(iso) ? days.delete(iso) : days.add(iso);
    set('days', days);
  };
  const onSubmit = (e) => {
    e.preventDefault();
    save.mutate({ ...f, days: [...f.days] }, { onSuccess: () => setJustSaved(true) });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {!saved && <WarningBox k="plan.new" />}
      <Labeled k="plan.received" className="max-w-[240px]">
        <input type="date" value={f.report_received_on} onChange={(e) => set('report_received_on', e.target.value)} className="input" />
      </Labeled>

      <div className="flex flex-wrap items-start gap-5">
        <section className="card flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <SectionTitle k="plan.days" className="text-lg" />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-outline" onClick={() => set('days', new Set(weekdaysOfMonth(ym)))}>
                <T k="plan.allWeekdays" />
              </button>
              <button type="button" className="btn-outline" onClick={() => set('days', new Set())}>
                <T k="plan.clear" />
              </button>
            </div>
          </div>
          <div className="text-sm text-muted">
            <T k="plan.tapHint" /> · <strong data-testid="planned-count" className="text-ink"><T k="plan.count" vars={{ n: f.days.size }} /></strong>
          </div>
          <PlanCalendar ym={ym} selected={f.days} onToggle={toggle} />
        </section>

        <div className="flex flex-[1_1_320px] flex-col gap-5">
          <section className="card flex flex-col gap-3.5">
            <SectionTitle k="plan.money" className="text-lg" />
            <Labeled k="plan.snackMoney">
              <input type="number" min="0" step="10" inputMode="numeric" value={f.snack_deposit} onChange={(e) => set('snack_deposit', e.target.value)} className="input text-[17px]" />
            </Labeled>
            <Labeled k="plan.bentoMoney">
              <input type="number" min="0" step="10" inputMode="numeric" value={f.bento_deposit} onChange={(e) => set('bento_deposit', e.target.value)} className="input text-[17px]" />
            </Labeled>
            <div className="flex items-baseline justify-between rounded-md bg-bg p-3">
              <span className="text-[13px] text-muted"><T k="plan.total" /></span>
              <span className="text-[22px] font-bold">{yen(toYen(f.snack_deposit) + toYen(f.bento_deposit))}</span>
            </div>
            <label className="flex min-h-touch cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" checked={f.money_received} onChange={(e) => set('money_received', e.target.checked)} className="h-5 w-5 accent-primary" />
              <T k="plan.moneyReceived" />
            </label>
          </section>
          <section className="card flex flex-col gap-2.5">
            <Labeled k="plan.notes">
              <textarea rows={4} value={f.parent_notes} onChange={(e) => set('parent_notes', e.target.value)} className="input resize-y py-2.5" />
            </Labeled>
          </section>
        </div>
      </div>

      {save.isError && <WarningBox k="common.error" />}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {justSaved && <span role="status" className="font-medium text-primary"><T k="common.saved" /></span>}
        <button type="submit" disabled={save.isPending} className="btn-primary min-h-12 px-7">
          <T k={save.isPending ? 'common.saving' : 'plan.save'} />
        </button>
      </div>
    </form>
  );
}

export default function MonthlyPlan() {
  const [params, setParams] = useSearchParams();
  const { data: students } = useStudents();
  const { monthName } = useI18n();
  const thisMonth = monthKey(todayTokyo());
  const studentId = params.get('student') || (students?.[0] ? String(students[0].id) : '');
  const ym = params.get('month') || addMonths(thisMonth, 1);
  const plan = useMonthlyPlan(studentId, ym);
  const months = [...new Set([thisMonth, addMonths(thisMonth, 1), addMonths(thisMonth, 2), ym])].sort();

  const update = (key, value) => setParams({ student: studentId, month: ym, [key]: value });

  return (
    <>
      <div>
        <SectionTitle as="h1" k="plan.title" className="text-[28px]" />
        <p className="mt-1.5 text-sm text-muted"><T k="plan.help" /></p>
      </div>

      <section className="card flex flex-wrap items-end gap-4">
        <Labeled k="plan.student" className="flex-[1_1_240px]">
          <select value={studentId} onChange={(e) => update('student', e.target.value)} className="input">
            {students?.map((s) => (
              <option key={s.id} value={s.id}>{s.name_en} {s.name_ja}</option>
            ))}
          </select>
        </Labeled>
        <Labeled k="plan.month" className="flex-[1_1_200px]">
          <select value={ym} onChange={(e) => update('month', e.target.value)} className="input">
            {months.map((m) => (
              <option key={m} value={m}>{monthName(m)}</option>
            ))}
          </select>
        </Labeled>
      </section>

      {!plan.isSuccess ? (
        <PageMessage />
      ) : (
        <PlanForm key={`${studentId}-${ym}`} studentId={studentId} ym={ym} saved={plan.data} />
      )}
    </>
  );
}
