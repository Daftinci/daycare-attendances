import { Link } from 'react-router-dom';
import { T, useI18n } from '../i18n/index.jsx';
import { useStudents } from '../api/hooks.js';
import { todayTokyo } from '../lib/date.js';
import { Avatar, PageMessage, SectionTitle } from '../components/ui.jsx';

/** List of students. mode "profile" opens the profile, mode "log" opens today's daily log. */
export default function StudentPicker({ mode }) {
  const { data: students, isLoading } = useStudents();
  const today = todayTokyo();
  const href = (s) => (mode === 'log' ? `/students/${s.id}/log/${today}` : `/students/${s.id}`);

  return (
    <>
      <div>
        <SectionTitle as="h1" k={mode === 'log' ? 'picker.logs' : 'picker.students'} className="text-[28px]" />
        <p className="mt-1.5 text-sm text-muted"><T k={mode === 'log' ? 'picker.logsHelp' : 'picker.studentsHelp'} /></p>
      </div>
      {isLoading && <PageMessage />}
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 p-0">
        {students?.map((s) => (
          <li key={s.id}>
            <Link
              to={href(s)}
              className="flex min-h-[64px] items-center gap-3 rounded-lg border border-line bg-surface p-3 text-ink no-underline hover:border-primary hover:text-ink"
            >
              <Avatar name={s.name_en} />
              <span>
                <span className="block font-semibold">{s.name_en}</span>
                <span className="block text-[13px] text-muted">{s.name_ja}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
