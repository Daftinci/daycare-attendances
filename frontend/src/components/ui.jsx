// Small shared UI pieces.
import { T, useI18n } from '../i18n/index.jsx';

export function Avatar({ name, size = 'md' }) {
  const sizes = { md: 'h-11 w-11 text-base', lg: 'h-14 w-14 text-[22px]', xl: 'h-[72px] w-[72px] text-[28px]' };
  return (
    <div aria-hidden="true" className={`flex flex-none items-center justify-center rounded-full bg-primary-tint font-bold text-primary ${sizes[size]}`}>
      {name?.charAt(0) ?? '?'}
    </div>
  );
}

/** Row of toggle buttons (single choice). options: [{ value, k }] */
export function SegmentedControl({ labelK, options, value, onChange, tone = 'primary' }) {
  const on = tone === 'dark' ? 'border-ink bg-ink text-white' : 'border-primary bg-primary text-white';
  const shape = tone === 'dark' ? 'rounded-full px-4' : 'rounded-md px-4';
  const { t } = useI18n();
  return (
    <div role="group" aria-label={t(labelK)} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const pressed = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(o.value)}
            className={`min-h-touch border py-2 font-medium ${shape} ${pressed ? on : 'border-line-strong bg-surface text-ink hover:bg-bg'}`}
          >
            {o.label ?? <T k={o.k} />}
          </button>
        );
      })}
    </div>
  );
}

export function WarningBox({ k }) {
  return (
    <div role="status" className="rounded-md bg-warn-bg px-3 py-2.5 text-sm font-medium text-warn">
      <T k={k} />
    </div>
  );
}

export function SectionTitle({ k, as: Tag = 'h2', className = 'text-[17px]' }) {
  return (
    <Tag className={`m-0 font-bold ${className}`}>
      <T k={k} />
    </Tag>
  );
}

const BADGE = {
  present: 'bg-primary-tint text-primary-ink',
  waiting: 'bg-wait-bg text-wait-fg',
  off: 'bg-off-bg text-off-fg',
  absent: 'bg-off-bg text-off-fg',
};

export function StatusBadge({ status }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE[status]}`}>
      <T k={`status.${status}`} />
    </span>
  );
}

export function PageMessage({ k = 'common.loading' }) {
  return (
    <p role="status" className="py-10 text-center text-muted">
      <T k={k} />
    </p>
  );
}

export function yen(n) {
  return `¥${n.toLocaleString('en-US')}`;
}
