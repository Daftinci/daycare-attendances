import { Link } from 'react-router-dom';
import { T } from '../i18n/index.jsx';
import { Avatar, StatusBadge } from './ui.jsx';

// Same column widths for the header and every row (1024px+). Narrower screens stack each row.
export const ROW_GRID = 'lg:grid lg:grid-cols-[minmax(170px,2fr)_96px_60px_76px_minmax(0,1fr)_130px] lg:items-center lg:gap-3';

function Tag({ k, className }) {
  return (
    <span className={`tag ${className}`}>
      <T k={k} />
    </span>
  );
}

/** Small label shown only on phone, where there is no header row. */
function PhoneLabel({ k }) {
  return (
    <span className="mr-1.5 text-xs text-muted lg:hidden">
      <T k={k} />
    </span>
  );
}

/** Column header row for the student list (hidden on phone). */
export function StudentListHeader() {
  const cols = ['col.student', 'col.status', 'card.arrival', 'card.temp', 'col.notes', null];
  return (
    <div aria-hidden="true" className={`hidden border-b border-line px-4 py-2.5 text-xs font-medium text-muted ${ROW_GRID}`}>
      {cols.map((k, i) => (
        <div key={i}>{k && <T k={k} />}</div>
      ))}
    </div>
  );
}

export default function StudentRow({ row, date, onCheckIn, checkingIn }) {
  const { student, status, arrival_time, temperature, has_fever, medicine_taken, is_planned } = row;
  const present = status === 'present';
  return (
    <li
      data-testid="student-row"
      aria-label={student.name_en}
      className={`flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-line-soft px-4 py-3 last:border-b-0 ${ROW_GRID} ${
        has_fever ? 'bg-warn-bg/60' : ''
      }`}
    >
      {/* Name */}
      <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
        <Avatar name={student.name_en} />
        <div className="min-w-0">
          <Link to={`/students/${student.id}`} className="block truncate font-semibold text-ink no-underline hover:underline">
            {student.name_en}
          </Link>
          <div className="truncate text-[13px] text-muted">{student.name_ja}</div>
        </div>
      </div>

      {/* Status */}
      <div>
        <StatusBadge status={status} />
      </div>

      {/* Line break below 1024px: name + status on line 1, details + button on line 2 */}
      <div aria-hidden="true" className="h-0 basis-full lg:hidden" />

      {/* Arrival + temp: own line on phone; shares the line with the button on tablet */}
      <div className="flex basis-full gap-5 sm:flex-1 sm:basis-auto lg:contents">
        <div className="tabular-nums">
          <PhoneLabel k="card.arrival" />
          <span className="font-semibold">{arrival_time ?? '—'}</span>
        </div>
        <div className="tabular-nums">
          <PhoneLabel k="card.temp" />
          <span className={`font-semibold ${has_fever ? 'text-warn-strong' : ''}`}>
            {temperature != null ? `${temperature.toFixed(1)} °C` : '—'}
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 empty:hidden lg:empty:block">
        {has_fever && <Tag k="tag.fever" className="bg-warn-bg text-warn" />}
        {medicine_taken && <Tag k="tag.medicine" className="bg-med-bg text-med-fg" />}
        {!is_planned && present && <Tag k="tag.notPlanned" className="bg-off-bg font-normal text-off-fg" />}
      </div>

      {/* Action: full width on phone, fixed width on tablet */}
      <div className="basis-full sm:w-40 sm:basis-auto lg:w-auto">
        {present ? (
          <Link
            to={`/students/${student.id}/log/${date}`}
            className="flex min-h-touch w-full items-center justify-center rounded-md border border-primary px-3 font-semibold no-underline"
          >
            <T k="action.openLog" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onCheckIn(student.id)}
            disabled={checkingIn}
            // Expected students get the strong button; day-off students a quieter one (still allowed).
            className={status === 'waiting' ? 'btn-primary w-full' : 'btn-outline w-full'}
          >
            <T k="action.checkIn" />
          </button>
        )}
      </div>
    </li>
  );
}
