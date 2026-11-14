import { T, useI18n } from '../i18n/index.jsx';
import { yen } from './ui.jsx';

/** Progress bar for one money line (snack or bento). */
export default function MoneyBalance({ labelK, line }) {
  const { deposit, spent, remaining } = line;
  const pct = deposit > 0 ? Math.min(100, Math.round((spent / deposit) * 100)) : spent > 0 ? 100 : 0;
  const low = remaining < 0;
  return (
    <div className="flex flex-1 basis-[260px] flex-col gap-2">
      <div className="flex justify-between gap-2 text-sm">
        <span className="font-semibold"><T k={labelK} /></span>
        <span className="text-muted">{yen(spent)} / {yen(deposit)}</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2.5 overflow-hidden rounded-full bg-line-soft"
      >
        <div className={`h-full ${low ? 'bg-warn-strong' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`text-xl font-bold ${low ? 'text-warn-strong' : ''}`}>
        {yen(remaining)} <span className="text-[13px] font-medium text-muted"><T k="balance.left" /></span>
      </div>
    </div>
  );
}
