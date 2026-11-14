import { Link, useParams } from 'react-router-dom';
import { T, useI18n } from '../i18n/index.jsx';
import { useBalance, useDailyLogs, useMonthlyPlan, useStudent } from '../api/hooks.js';
import { addDays, firstOfMonth, formatMedium, formatShort, lastOfMonth, monthKey, todayTokyo } from '../lib/date.js';
import { isFever } from '../lib/rules.js';
import MoneyBalance from '../components/MoneyBalance.jsx';
import { Avatar, PageMessage, SectionTitle, yen } from '../components/ui.jsx';

function InfoItem({ k, children }) {
  return (
    <div>
      <dt className="text-xs text-muted"><T k={k} /></dt>
      <dd className="m-0 mt-0.5 font-medium">{children || '—'}</dd>
    </div>
  );
}

function InfoCard({ student, today }) {
  return (
    <aside className="flex flex-[1_1_300px] flex-col gap-4 rounded-xl border border-line bg-surface p-6">
      <div className="flex flex-col items-start gap-3">
        <Avatar name={student.name_en} size="xl" />
        <div>
          <h1 className="m-0 text-2xl font-bold">{student.name_en}</h1>
          <div className="text-base text-muted">{student.name_ja} · {student.name_kana}</div>
        </div>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-3.5 text-sm">
        <InfoItem k="profile.class">{student.class_name}</InfoItem>
        <InfoItem k="profile.birthday">{student.birthday && formatMedium(student.birthday)}</InfoItem>
        <InfoItem k="profile.parent">{student.parent_name}</InfoItem>
        <InfoItem k="profile.phone">
          {student.parent_phone && <a href={`tel:${student.parent_phone}`}>{student.parent_phone}</a>}
        </InfoItem>
      </dl>
      <div className="border-t border-line pt-4">
        <div className="text-xs text-muted"><T k="profile.notes" /></div>
        <p className="m-0 mt-1.5 text-sm leading-relaxed">{student.notes || '—'}</p>
      </div>
      <Link to={`/students/${student.id}/log/${today}`} className="btn-primary flex items-center justify-center text-white no-underline hover:text-white">
        <T k="profile.openTodayLog" />
      </Link>
    </aside>
  );
}

function StatTile({ k, value }) {
  return (
    <div className="rounded-[12px] bg-bg p-3.5">
      <div className="text-xs text-muted"><T k={k} /></div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function MonthStats({ studentId, ym, plan, logs }) {
  const { monthName } = useI18n();
  const present = logs.filter((l) => l.status === 'present');
  return (
    <section className="card flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 text-lg font-bold">{monthName(ym)}</h2>
        <Link to={`/plan?student=${studentId}&month=${ym}`} className="text-sm font-medium"><T k="profile.editPlan" /></Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        <StatTile k="stat.planned" value={plan?.days.length ?? 0} />
        <StatTile k="stat.attended" value={present.length} />
        <StatTile k="stat.absent" value={logs.filter((l) => l.status === 'absent').length} />
        <StatTile k="stat.fever" value={present.filter((l) => isFever(l.temperature)).length} />
      </div>
    </section>
  );
}

function lunchText(log, t) {
  if (log.status === 'absent') return t('status.absent');
  if (!log.lunch_eaten) return '—';
  return t(`eaten.${log.lunch_eaten}`);
}

function bmText(log, t) {
  if (log.status === 'absent') return '—';
  if (!log.bm_count) return '0';
  return `${log.bm_count} · ${t(`bm.${log.bm_condition}`)}`;
}

const COLS = ['col.date', 'col.arrival', 'col.temp', 'col.lunch', 'col.medicine', 'col.bm', 'col.spent'];

function RecentLogs({ studentId, logs }) {
  const { t } = useI18n();
  return (
    <section className="card flex flex-col gap-3.5">
      <SectionTitle k="recent.title" className="text-lg" />
      {logs.length === 0 ? (
        <p className="m-0 text-muted"><T k="recent.empty" /></p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                {COLS.map((k) => (
                  <th key={k} scope="col" className="border-b border-line px-2.5 py-2 font-medium"><T k={k} /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const fever = isFever(log.temperature);
                const absent = log.status === 'absent';
                return (
                  <tr key={log.id} className="border-b border-line-soft">
                    <td className="px-2.5 py-3 font-medium">
                      <Link to={`/students/${studentId}/log/${log.date}`}>{formatShort(log.date)}</Link>
                    </td>
                    <td className="px-2.5 py-3">{log.arrival_time ?? '—'}</td>
                    <td className={`px-2.5 py-3 ${fever ? 'font-bold text-warn-strong' : ''}`}>
                      {log.temperature != null ? `${log.temperature.toFixed(1)} °C` : '—'}
                    </td>
                    <td className="px-2.5 py-3">{lunchText(log, t)}</td>
                    <td className="px-2.5 py-3">{absent ? '—' : t(log.medicine_taken ? 'common.yes' : 'common.no')}</td>
                    <td className="px-2.5 py-3">{bmText(log, t)}</td>
                    <td className="px-2.5 py-3">{yen(log.snack_spent + log.bento_spent)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function StudentProfile() {
  const { id } = useParams();
  const today = todayTokyo();
  const ym = monthKey(today);
  const student = useStudent(id);
  const plan = useMonthlyPlan(id, ym);
  const balance = useBalance(id, ym);
  const monthLogs = useDailyLogs(id, firstOfMonth(ym), lastOfMonth(ym));
  const recent = useDailyLogs(id, addDays(today, -30), today);

  if (student.isError) return <PageMessage k="common.notFound" />;
  if (!student.data || !plan.isSuccess || !balance.data || !monthLogs.data || !recent.data) return <PageMessage />;

  return (
    <div className="flex flex-wrap items-start gap-5">
      <InfoCard student={student.data} today={today} />
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        <MonthStats studentId={id} ym={ym} plan={plan.data} logs={monthLogs.data} />
        <section className="card flex flex-col gap-4">
          <SectionTitle k="balance.title" className="text-lg" />
          <div className="flex flex-wrap gap-4">
            <MoneyBalance labelK="balance.snack" line={balance.data.snack} />
            <MoneyBalance labelK="balance.bento" line={balance.data.bento} />
          </div>
        </section>
        <RecentLogs studentId={id} logs={recent.data.slice(0, 10)} />
      </div>
    </div>
  );
}
