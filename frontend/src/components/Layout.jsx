import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { T, useI18n } from '../i18n/index.jsx';
import { useClasses } from '../api/hooks.js';

// Simple stroke icons (decorative; the text label names the item).
const ICONS = {
  today: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 16l2 2 4-4',
  log: 'M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4zM8 9h8M8 13h8M8 17h5',
  students: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8',
  plan: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01',
  reports: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6L6 18',
};

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={ICONS[name]} />
    </svg>
  );
}

const NAV = [
  { to: '/', k: 'nav.today', icon: 'today', match: (p) => p === '/' },
  { to: '/log', k: 'nav.dailyLog', icon: 'log', match: (p) => p === '/log' || /^\/students\/[^/]+\/log\//.test(p) },
  { to: '/students', k: 'nav.students', icon: 'students', match: (p) => p === '/students' || /^\/students\/[^/]+$/.test(p) },
  { to: '/plan', k: 'nav.monthlyPlan', icon: 'plan', match: (p) => p.startsWith('/plan') },
  { to: '/reports', k: 'nav.reports', icon: 'reports', match: (p) => p.startsWith('/reports') },
];

function Brand() {
  const { data: classes } = useClasses();
  return (
    <div className="flex items-center gap-2.5">
      <div aria-hidden="true" className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-primary font-bold text-white">出</div>
      <div className="min-w-0">
        <div className="font-bold"><T k="app.title" /></div>
        {classes?.[0] && <div className="truncate text-xs text-muted">{classes[0].name}</div>}
      </div>
    </div>
  );
}

function MainNav() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  return (
    <nav aria-label={t('nav.main')}>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-touch items-center gap-3 rounded-md px-3 no-underline ${
                  active ? 'bg-primary-tint font-semibold text-primary' : 'text-ink-2 hover:bg-bg hover:text-ink'
                }`}
              >
                <Icon name={item.icon} />
                <T k={item.k} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** EN / 日本語 switch. Each option is written in its own language so anyone can find theirs. */
function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  const options = [
    { value: 'en', label: 'EN' },
    { value: 'ja', label: '日本語' },
  ];
  return (
    <div role="group" aria-label={t('lang.label')} className="flex rounded-md border border-line-strong p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.value}
          aria-pressed={lang === o.value}
          onClick={() => setLang(o.value)}
          className={`min-h-[40px] flex-1 rounded-[8px] px-3 text-sm font-semibold ${
            lang === o.value ? 'bg-ink text-white' : 'text-ink-2 hover:bg-bg'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Brand, menu and language toggle. Used in the desktop sidebar and the phone drawer. */
function SidebarContent() {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Brand />
      <div className="flex-1">
        <MainNav />
      </div>
      <LanguageToggle />
    </div>
  );
}

/** Phone only: top bar with a menu button that opens the sidebar as a drawer. */
function MobileBar() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="md:hidden">
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2">
        <Brand />
        <button
          type="button"
          aria-label={t('nav.openMenu')}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
          className="btn-outline flex w-11 items-center justify-center px-0"
        >
          <Icon name="menu" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-30" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
          <button type="button" aria-label={t('nav.closeMenu')} tabIndex={-1} onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40" />
          <div id="mobile-menu" className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-xl">
            <button
              type="button"
              aria-label={t('nav.closeMenu')}
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-md text-ink-2 hover:bg-bg"
            >
              <Icon name="close" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 flex-none border-r border-line bg-surface md:block">
        <SidebarContent />
      </aside>
      <MobileBar />
      <main className="mx-auto flex w-full min-w-0 max-w-[1200px] flex-col gap-5 px-4 pb-14 pt-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
