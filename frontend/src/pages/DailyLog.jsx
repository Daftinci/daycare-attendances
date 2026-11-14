import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { T, useI18n } from '../i18n/index.jsx';
import { useBalance, useDailyLog, useMonthlyPlan, useSaveDailyLog, useStudent } from '../api/hooks.js';
import { monthKey, todayTokyo } from '../lib/date.js';
import { isFever, toYen } from '../lib/rules.js';
import { Avatar, PageMessage, SectionTitle, SegmentedControl, WarningBox, yen } from '../components/ui.jsx';

const EATEN = ['all', 'most', 'half', 'little'].map((v) => ({ value: v, k: `eaten.${v}` }));
const BM = ['normal', 'soft', 'hard', 'diarrhea'].map((v) => ({ value: v, k: `bm.${v}` }));
const ATTEND = [{ value: 'present', k: 'attend.present' }, { value: 'absent', k: 'attend.absent' }];
const YES_NO = [{ value: false, k: 'common.no' }, { value: true, k: 'common.yes' }];

function blankLog() {
  return {
    status: 'present', arrival_time: '', temperature: '', temp_measured_at: '', lunch_contents: '', lunch_eaten: null,
    medicine_taken: false, medicine_name: '', medicine_time: '', activities_am: '', activities_pm: '', teacher_notes: '',
    bm_count: 0, bm_condition: null, snack_spent: 0, bento_spent: 0,
  };
}

/** Turn a saved log (nulls) into form values (empty strings). */
function toForm(log) {
  const base = blankLog();
  if (!log) return base;
  const out = { ...base };
  for (const key of Object.keys(base)) {
    if (log[key] !== null && log[key] !== undefined) out[key] = log[key];
  }
  return out;
}

function Card({ children, className = '', warn }) {
  return (
    <section className={`flex flex-col gap-3.5 rounded-xl border bg-surface p-5 ${warn ? 'border-warn-line' : 'border-line'} ${className}`}>
      {children}
    </section>
  );
}

function Labeled({ k, className = '', children }) {
  return (
    <label className={`field-label ${className}`}>
      <span><T k={k} /></span>
      {children}
    </label>
  );
}

function Header({ student, date }) {
  const { longDate } = useI18n();
  return (
    <section className="card flex flex-wrap items-center gap-4">
      <Avatar name={student.name_en} size="lg" />
      <div className="flex-[1_1_220px]">
        <h1 className="m-0 text-[26px] font-bold">
          {student.name_en} <span className="text-[17px] font-medium text-muted">{student.name_ja}</span>
        </h1>
        <div className="mt-0.5 text-sm text-muted">
          <T k="log.title" /> — {longDate(date)}
        </div>
      </div>
      <Link to={`/students/${student.id}`} className="btn-outline inline-flex items-center text-ink no-underline">
        <T k="log.viewProfile" />
      </Link>
    </section>
  );
}

function BalanceTile({ labelK, left, deposit }) {
  return (
    <div className="rounded-md bg-bg px-3 py-2.5">
      <div className="text-xs text-muted"><T k={labelK} /></div>
      <div data-testid={labelK} className={`text-lg font-bold ${left < 0 ? 'text-warn-strong' : ''}`}>
        {yen(left)} <span className="text-xs font-medium text-muted">/ {yen(deposit)}</span>
      </div>
    </div>
  );
}

function LogForm({ student, date, saved, balance, planned }) {
  const navigate = useNavigate();
  const save = useSaveDailyLog(student.id, date);
  const { t } = useI18n();
  const [f, setF] = useState(() => toForm(saved));
  const set = (key) => (value) => setF((prev) => ({ ...prev, [key]: value }));
  const onInput = (key) => (e) => set(key)(e.target.value);

  const fever = isFever(f.temperature);
  // Live balance: server balance already includes the saved spend for this day, so swap it for the typed value.
  const snackLeft = balance.snack.remaining + toYen(saved?.snack_spent) - toYen(f.snack_spent);
  const bentoLeft = balance.bento.remaining + toYen(saved?.bento_spent) - toYen(f.bento_spent);
  const present = f.status === 'present';
  const backTo = date === todayTokyo() ? '/' : `/?date=${date}`;

  const onSubmit = (e) => {
    e.preventDefault();
    save.mutate(f, { onSuccess: () => navigate(backTo) });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {!planned && <WarningBox k="log.notPlanned" />}
      <div className="flex flex-wrap items-stretch gap-4">
        <Card className="flex-[1_1_340px]">
          <SectionTitle k="log.s1" />
          <SegmentedControl labelK="log.attendGroup" options={ATTEND} value={f.status} onChange={set('status')} />
          {present && (
            <Labeled k="log.arrival">
              <input type="time" value={f.arrival_time} onChange={onInput('arrival_time')} className="input max-w-[200px] text-[17px]" />
            </Labeled>
          )}
        </Card>

        <Card className="flex-[1_1_340px]" warn={fever}>
          <SectionTitle k="log.s3" />
          <div className="flex flex-wrap items-end gap-3">
            <Labeled k="log.tempC">
              <input
                type="number" step="0.1" min="34" max="42" inputMode="decimal"
                value={f.temperature} onChange={onInput('temperature')}
                className="input w-[120px] text-xl font-semibold"
              />
            </Labeled>
            <Labeled k="log.measuredAt">
              <input type="time" value={f.temp_measured_at} onChange={onInput('temp_measured_at')} className="input" />
            </Labeled>
          </div>
          {fever && <WarningBox k="log.feverWarn" />}
        </Card>

        <Card className="flex-[1_1_340px]">
          <SectionTitle k="log.s4" />
          <Labeled k="log.bento">
            <input type="text" value={f.lunch_contents} onChange={onInput('lunch_contents')} className="input" />
          </Labeled>
          <div className="text-[13px] text-muted"><T k="log.eaten" /></div>
          <SegmentedControl labelK="log.eaten" options={EATEN} value={f.lunch_eaten} onChange={set('lunch_eaten')} />
        </Card>

        <Card className="flex-[1_1_340px]">
          <SectionTitle k="log.s5" />
          <SegmentedControl labelK="log.medGroup" options={YES_NO} value={f.medicine_taken} onChange={set('medicine_taken')} />
          {f.medicine_taken && (
            <div className="flex flex-wrap gap-3">
              <Labeled k="log.medName" className="flex-[2_1_180px]">
                <input type="text" value={f.medicine_name} onChange={onInput('medicine_name')} className="input" />
              </Labeled>
              <Labeled k="log.medTime" className="flex-[1_1_120px]">
                <input type="time" value={f.medicine_time} onChange={onInput('medicine_time')} className="input" />
              </Labeled>
            </div>
          )}
        </Card>

        <Card className="flex-[1_1_100%]">
          <SectionTitle k="log.s6" />
          <div className="flex flex-wrap gap-4">
            <Labeled k="log.am" className="flex-[1_1_300px]">
              <textarea rows={4} value={f.activities_am} onChange={onInput('activities_am')} className="input resize-y py-2.5" />
            </Labeled>
            <Labeled k="log.pm" className="flex-[1_1_300px]">
              <textarea rows={4} value={f.activities_pm} onChange={onInput('activities_pm')} className="input resize-y py-2.5" />
            </Labeled>
          </div>
        </Card>

        <Card className="flex-[1_1_340px]">
          <SectionTitle k="log.s8" />
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-muted"><T k="log.bmTimes" /></span>
            <button type="button" aria-label={t('log.bmDec')} onClick={() => set('bm_count')(Math.max(0, f.bm_count - 1))} className="btn-outline w-11 px-0 text-xl">−</button>
            <span aria-live="polite" data-testid="bm-count" className="min-w-7 text-center text-[22px] font-bold">{f.bm_count}</span>
            <button type="button" aria-label={t('log.bmInc')} onClick={() => set('bm_count')(f.bm_count + 1)} className="btn-outline w-11 px-0 text-xl">+</button>
          </div>
          {f.bm_count > 0 && (
            <>
              <div className="text-[13px] text-muted"><T k="log.condition" /></div>
              <SegmentedControl labelK="log.condition" options={BM} value={f.bm_condition} onChange={set('bm_condition')} />
            </>
          )}
        </Card>

        <Card className="flex-[1_1_340px]">
          <SectionTitle k="log.spending" />
          <div className="flex flex-wrap gap-3">
            <Labeled k="log.snackYen" className="flex-[1_1_130px]">
              <input type="number" min="0" step="10" inputMode="numeric" value={f.snack_spent} onChange={onInput('snack_spent')} className="input text-[17px]" />
            </Labeled>
            <Labeled k="log.bentoYen" className="flex-[1_1_130px]">
              <input type="number" min="0" step="10" inputMode="numeric" value={f.bento_spent} onChange={onInput('bento_spent')} className="input text-[17px]" />
            </Labeled>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <BalanceTile labelK="log.snackBal" left={snackLeft} deposit={balance.snack.deposit} />
            <BalanceTile labelK="log.bentoBal" left={bentoLeft} deposit={balance.bento.deposit} />
          </div>
          {(snackLeft < 0 || bentoLeft < 0) && <WarningBox k="money.lowWarn" />}
        </Card>

        <Card className="flex-[1_1_100%]">
          <SectionTitle k="log.s7" />
          <Labeled k="log.notesHint">
            <textarea rows={4} value={f.teacher_notes} onChange={onInput('teacher_notes')} className="input resize-y py-2.5" />
          </Labeled>
        </Card>
      </div>

      {save.isError && <WarningBox k="common.error" />}
      <div className="flex flex-wrap justify-end gap-2.5">
        <Link to={backTo} className="btn-outline inline-flex min-h-12 items-center text-ink no-underline"><T k="common.cancel" /></Link>
        <button type="submit" disabled={save.isPending} className="btn-primary min-h-12 px-7">
          <T k={save.isPending ? 'common.saving' : 'log.save'} />
        </button>
      </div>
    </form>
  );
}

export default function DailyLog() {
  const { id, date } = useParams();
  const ym = monthKey(date);
  const student = useStudent(id);
  const log = useDailyLog(id, date);
  const balance = useBalance(id, ym);
  const plan = useMonthlyPlan(id, ym);
  const backTo = date === todayTokyo() ? '/' : `/?date=${date}`;

  if (student.isError) return <PageMessage k="common.notFound" />;
  const ready = student.data && log.isSuccess && balance.data && plan.isSuccess;

  return (
    <>
      <Link to={backTo} className="text-sm no-underline"><T k="log.back" /></Link>
      {!ready ? (
        <PageMessage />
      ) : (
        <>
          <Header student={student.data} date={date} />
          <LogForm
            key={`${id}-${date}`}
            student={student.data}
            date={date}
            saved={log.data}
            balance={balance.data}
            planned={!!plan.data?.days.includes(date)}
          />
        </>
      )}
    </>
  );
}
