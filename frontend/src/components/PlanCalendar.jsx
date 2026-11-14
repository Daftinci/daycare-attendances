import { T, useI18n } from '../i18n/index.jsx';
import { datesOfMonth, dayOfWeek, firstOfMonth, isWeekend } from '../lib/date.js';

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

function DayButton({ iso, on, onToggle }) {
  const { t, longDate } = useI18n();
  const day = Number(iso.slice(8));
  const weekend = isWeekend(iso);
  const style = on
    ? 'border-primary bg-primary text-white'
    : weekend
      ? 'border-line-strong bg-bg text-[#6B6F76]'
      : 'border-line-strong bg-surface text-ink hover:bg-primary-tint';
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${longDate(iso)}, ${t(on ? 'plan.attending' : 'plan.dayOff')}`}
      onClick={() => onToggle(iso)}
      className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-md border text-base font-semibold ${style}`}
    >
      {day}
      <span className="h-3 text-[10px] font-medium">{on ? t('plan.attending') : ''}</span>
    </button>
  );
}

/** Month grid. Tap a day to toggle attending. `selected` is a Set of ISO dates. */
export default function PlanCalendar({ ym, selected, onToggle }) {
  const lead = dayOfWeek(firstOfMonth(ym));
  return (
    <div className="flex flex-col gap-1.5">
      <div aria-hidden="true" className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d}><T k={`wd.${d}`} /></div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: lead }, (_, i) => <div key={`b${i}`} />)}
        {datesOfMonth(ym).map((iso) => (
          <DayButton key={iso} iso={iso} on={selected.has(iso)} onToggle={onToggle} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3.5 w-3.5 rounded bg-primary" />
          <T k="plan.attending" />
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3.5 w-3.5 rounded border border-line-strong bg-surface" />
          <T k="plan.dayOff" />
        </span>
      </div>
    </div>
  );
}
