# CLAUDE.md — Student Attendance App (出欠管理)

## What this is
A web app for daycare/kindergarten **teachers** to record each student's day and to store the monthly plan that parents report.
Only teachers use the app. Parents do not log in. Teachers enter the parent's monthly report themselves.

UI design (starting point for layout and copy): https://claude.ai/artifact/3nAoPSNfM48DCaWKhDsf13
It has 4 screens: Today, Daily log, Student profile, Monthly plan.
Since then we changed: sidebar menu instead of a top nav, Today as a list instead of a card grid, one language at a time with a toggle, and a new Reports screen. Where this file and the design disagree, this file wins.

## Status
- **Frontend is built first** and runs on an in-memory **mock API** (`frontend/src/api/mock/`) with 24 dummy students. Data resets on page reload.
- **Backend is not started yet.** When it is ready, only `frontend/src/api/client.js` changes: replace each mock call with a `fetch` to the matching endpoint below. Keep the same function names and data shapes (snake_case, like the API).

## Tech stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic, PostgreSQL 16
- **Frontend**: React 18 + Vite (JavaScript/JSX), React Router 6, TanStack Query 5, Tailwind CSS 3, exceljs (Excel export, lazy-loaded)
- **Infra**: Docker + docker-compose (services: `db`, `api`, `web`)
- **Tests**: pytest (backend), Vitest + Testing Library (frontend)
- No i18n library and no date library: small helpers in `src/i18n/` and `src/lib/date.js`.

## Project structure
```
backend/                 # not started yet
  app/
    main.py
    config.py            # env settings (pydantic-settings)
    db.py                # engine, session
    models/              # SQLAlchemy models
    schemas/             # Pydantic schemas
    routers/             # auth, students, attendance, daily_logs, monthly_plans, reports
    services/            # business rules (status, balance, fever, summary)
    seed.py              # sample students for local dev (match frontend mock data)
  alembic/
  tests/
frontend/
  src/
    App.jsx, main.jsx    # routes, QueryClient, LanguageProvider
    pages/               # Today, DailyLog, StudentProfile, StudentPicker, MonthlyPlan, Reports
    components/          # Layout (sidebar), StudentRow, ui (SegmentedControl, StatusBadge…), MoneyBalance, PlanCalendar
    api/
      client.js          # the ONLY place that talks to the server (mock today)
      hooks.js           # TanStack Query hooks
      mock/              # data.js (seed), server.js (in-memory endpoints)
    lib/
      rules.js           # business rules — mirror of backend services/
      date.js            # Asia/Tokyo date helpers
      excel.js           # .xlsx builder for Reports
    i18n/                # en.json, ja.json, index.jsx (LanguageProvider, useI18n, <T>)
    test/                # setup + renderApp helper
docker-compose.yml
```

## Features

### Layout
- **Sidebar menu** on tablet/laptop: app name + class, menu items with icons (Today, Daily log, Students, Monthly plan, Reports), language toggle at the bottom.
- **Phone**: top bar with a ☰ button that opens the same menu as a drawer.

### 1. Today (今日の出欠)
- **List** of students for the selected date (default: today), with a date picker and ‹ › buttons.
- 1024px and wider: one row per student with columns (student, status, arrival, temp, notes, action) and a header row. Narrower: each row stacks (name + status, then details + button).
- Each student has a status:
  - `present`: has a daily log with status present
  - `absent`: has a daily log with status absent (shown under the "Day off" filter)
  - `waiting`: date is a planned day in the monthly plan, no check-in yet
  - `off`: date is not in the monthly plan
- **Check in** button saves arrival time = current server time (Asia/Tokyo). Teacher can edit it later in the daily log. Strong (green) button for `waiting`, outline button for `off`/`absent`.
- Summary counters: present / planned, not arrived yet, fever count, medicine count.
- Filter tabs: All, Present, Not yet, Day off.

### 2. Daily log (日誌), one per student per date
1. Attendance: present / absent
2. Arrival time
3. Body temperature (°C, 1 decimal) + measured time
4. Lunch: bento contents (text) + amount eaten (`all` 完食, `most` ほぼ, `half` 半分, `little` 少し)
5. Medicine: yes/no; if yes, medicine name + time given
6. Activities: AM (午前) and PM (午後), free text
7. Teacher notes (先生からのメモ)
8. Bowel movement: count (0+) + condition (`normal` 普通, `soft` 軟便, `hard` 硬い, `diarrhea` 下痢); condition only when count > 0
- Spending today: snack ¥ and bento ¥, entered by the teacher. Show the remaining balance for the month live.
- Shows a note when the date is not in the monthly plan.

### 3. Student profile (園児プロフィール)
- Basic info: name EN, name JP (kanji), kana, class, birthday, parent name, parent phone, notes for teachers.
- This month: planned days, attended, absent, fever days.
- Money balance bars for snack and bento.
- Recent daily logs table (scrolls horizontally on phone).
- "Daily log" and "Students" in the menu open a student list to pick from.

### 4. Monthly plan (月間予定)
- Teacher picks student + month (default: next month) and enters the parent's report.
- Calendar: tap days to toggle attending. Buttons: "All weekdays", "Clear".
- Money from parent: snack (default ¥500), bento (default ¥450), "money received" checkbox, report received date.
- Notes from parent.

### 5. Reports (集計) — weekly and monthly summary, export to Excel
- Choose **Week** (Monday–Sunday) or **Month**, move with ‹ ›, preview table on screen, **Export to Excel** button.
- `.xlsx` file with 2 sheets, in the language currently selected:
  1. **Summary**: one row per student — planned, attended, absent, not recorded, fever days, medicine days, snack spent, bento spent. Month only: snack/bento deposit and money left (below 0 highlighted). Totals row.
  2. **Attendance**: student × day grid — ○ present, × absent, – planned but no log, · planned (upcoming), weekends grey.
- Week files show spending only (deposits are per month).
- File name: `attendance-month-YYYY-MM-<lang>.xlsx` / `attendance-week-<monday>-<lang>.xlsx`.

## Business rules (backend: `services/` with tests; frontend mirror: `src/lib/rules.js` with tests)
- **Fever**: temperature >= 37.5 °C. Show a warning on the Today row and the log.
- **Balance** for a student and month = deposit (from monthly plan) − sum of daily spend in that month. Snack and bento are tracked separately. No plan = deposit 0.
- Balance below 0 shows a warning. Do not block saving.
- Status for the Today screen follows the rules in Feature 1.
- **Not recorded** (reports) = a planned day before today with no daily log.
- One daily log per (student, date). One monthly plan per (student, month).
- Money is stored as **integer yen**. Never use float for money.
- Dates and times use **Asia/Tokyo** time zone.

## Data model (PostgreSQL)
- `teachers` (id, name, email unique, password_hash, created_at)
- `classes` (id, name)
- `students` (id, class_id FK, name_en, name_ja, name_kana, birthday, parent_name, parent_phone, notes, is_active, created_at)
- `monthly_plans` (id, student_id FK, month DATE first-of-month, snack_deposit INT, bento_deposit INT, money_received BOOL, report_received_on DATE, parent_notes TEXT; UNIQUE(student_id, month))
- `planned_days` (id, plan_id FK, date DATE; UNIQUE(plan_id, date))
- `daily_logs` (id, student_id FK, date DATE, status ENUM(present, absent), arrival_time TIME, temperature NUMERIC(3,1), temp_measured_at TIME, lunch_contents TEXT, lunch_eaten ENUM, medicine_taken BOOL, medicine_name TEXT, medicine_time TIME, activities_am TEXT, activities_pm TEXT, teacher_notes TEXT, bm_count INT default 0, bm_condition ENUM nullable, snack_spent INT default 0, bento_spent INT default 0, created_by FK teachers, created_at, updated_at; UNIQUE(student_id, date))

## API (prefix `/api`)
The frontend mock in `src/api/mock/server.js` implements these with the same shapes.
- `POST /auth/login` → JWT. All other endpoints need a teacher token.
- `GET /classes`
- `GET /students`, `POST /students`, `GET /students/{id}`, `PATCH /students/{id}` (student responses include `class_name`)
- `GET /attendance?date=YYYY-MM-DD` → per student: `student`, `status`, `is_planned`, `arrival_time`, `temperature`, `has_fever`, `medicine_taken`
- `POST /students/{id}/check-in?date=` → creates/updates the daily log with status present and arrival time now (keeps an existing arrival time)
- `GET /students/{id}/daily-logs/{date}`, `PUT /students/{id}/daily-logs/{date}`
- `GET /students/{id}/daily-logs?from=&to=`
- `GET /students/{id}/monthly-plans/{YYYY-MM}`, `PUT /students/{id}/monthly-plans/{YYYY-MM}` (plan includes `days`: list of dates)
- `GET /students/{id}/balance?month=YYYY-MM` → deposit, spent, remaining for snack and bento
- `GET /reports/summary?from=&to=` → per student: `planned_days`, `attended`, `absent`, `not_recorded`, `fever_days`, `medicine_days`, `snack`/`bento` (deposit, spent, remaining), `has_deposit`, `days` (date → present | absent | missing | planned)

## UI rules
- **Language**: one language at a time, **EN / 日本語 toggle** in the sidebar (phone: in the menu drawer). Default English; the choice is saved in the browser (`localStorage`).
  - All UI text lives in `i18n/en.json` and `i18n/ja.json` (same keys in both). Use `<T k="…" />` or `useI18n().t(…)`. Do not hardcode UI text in components.
  - Dates and month names follow the language (`longDate`, `shortDate`, `monthName` from `useI18n()`).
  - Student and class names are data: always show both scripts (e.g. Haruto Sato / 佐藤 陽翔).
- **Responsive**: must work on phone, tablet and laptop. Tablet is the main device — check 820px and 1024px widths (sidebar takes 240px).
- Touch targets at least 44px. Use real `<button>`, `<label>` + `<input>`.
- Design tokens (in `tailwind.config.js`):
  - background `#F6F5F1`, surface `#FFFFFF`, border `#E3E1DA`
  - text `#1C1F23`, muted `#5B616B`
  - primary `#0F6E66`, primary tint `#E3F1EF`
  - warning text `#8A3A06` on `#FDF0E6` (fever, low balance)
  - status badges: waiting `#6B4E00` on `#FFF6D6`, off `#4D5259` on `#EEEDE8`, medicine `#1E4FA3` on `#EAF0FB`
  - fonts: Inter + Noto Sans JP

## Commands
```
cd frontend && npm install                    # first time
cd frontend && npm run dev                    # frontend (mock API) → http://localhost:5173
cd frontend && npm test                       # frontend tests
cd frontend && npm run build                  # production build
docker compose up --build                     # run everything (once backend exists)
docker compose exec api alembic upgrade head  # migrate
docker compose exec api pytest                # backend tests
```

## How to work on this project
- Frontend first (done on mock data). Next: backend in this order — DB models + migrations → business rules with tests → API → swap `api/client.js` from mock to real endpoints → login.
- Ask me before adding a new library or changing the data model.
- Explain your plan briefly before a big change. I want to be involved in decisions.
- Keep functions small. Put type hints on all Python code.
- Keep business rules in sync between `backend/app/services/` and `frontend/src/lib/rules.js`.
- Backend seed script (`backend/app/seed.py`) should match the frontend mock data (24 students, Nov + Dec 2026 plans).

## Decisions made
- Excel export: **yes** — weekly and monthly class summary as `.xlsx` (Reports screen). PDF not planned.
- Language: toggle instead of side-by-side bilingual labels.

## Open questions (ask me before building these parts)
- Early pick-up or a different pick-up time: does it go in the monthly plan or the daily log?
- A student comes on a day marked "off": allow with a warning, or block? *(For now: allowed; the row shows a "Not planned" tag and the Check in button is the outline style.)*
- Is the ¥450 bento money per month, or per week or meal?
- Teacher roles: do all teachers see all classes, or only their own class?
- Should individual student reports (one student's month, for parents) also be exported?
