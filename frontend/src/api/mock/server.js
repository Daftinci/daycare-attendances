// In-memory mock of the backend API described in CLAUDE.md.
// Each exported function matches one endpoint. Data resets on page reload.
import { buildSeed } from './data.js';
import { computeBalance, deriveStatus, isFever, parseTemp, toYen, DEFAULT_SNACK_DEPOSIT, DEFAULT_BENTO_DEPOSIT } from '../../lib/rules.js';
import { monthKey, nowHMTokyo, firstOfMonth, lastOfMonth, todayTokyo } from '../../lib/date.js';

let db;

export function resetMockStore() {
  db = buildSeed();
}
resetMockStore();

class NotFoundError extends Error {
  constructor(what) {
    super(`${what} not found`);
    this.status = 404;
  }
}

const clone = (v) => (v == null ? v : structuredClone(v));

function findStudent(id) {
  const s = db.students.find((x) => x.id === Number(id));
  if (!s) throw new NotFoundError('Student');
  return s;
}

function withClass(student) {
  const cls = db.classes.find((c) => c.id === student.class_id);
  return { ...student, class_name: cls?.name ?? '' };
}

function findPlan(studentId, ym) {
  return db.plans.find((p) => p.student_id === Number(studentId) && p.month === firstOfMonth(ym));
}

function findLog(studentId, date) {
  return db.logs.find((l) => l.student_id === Number(studentId) && l.date === date);
}

function logsInRange(studentId, from, to) {
  return db.logs.filter((l) => l.student_id === Number(studentId) && (!from || l.date >= from) && (!to || l.date <= to));
}

function nextId(rows) {
  return rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}

// ---- Classes / students ----

export async function listClasses() {
  return clone(db.classes);
}

export async function listStudents() {
  return clone(db.students.filter((s) => s.is_active).map(withClass));
}

export async function getStudent(id) {
  return clone(withClass(findStudent(id)));
}

// ---- Attendance (Today screen) ----

export async function getAttendance(date) {
  const ym = monthKey(date);
  return db.students
    .filter((s) => s.is_active)
    .map((s) => {
      const plan = findPlan(s.id, ym);
      const isPlanned = !!plan?.days.includes(date);
      const log = findLog(s.id, date);
      return {
        student: clone(withClass(s)),
        status: deriveStatus(isPlanned, log),
        is_planned: isPlanned,
        arrival_time: log?.arrival_time ?? null,
        temperature: log?.temperature ?? null,
        has_fever: isFever(log?.temperature),
        medicine_taken: !!log?.medicine_taken,
      };
    });
}

function emptyLog(studentId, date) {
  return {
    student_id: Number(studentId), date, status: 'present', arrival_time: null, temperature: null, temp_measured_at: null,
    lunch_contents: '', lunch_eaten: null, medicine_taken: false, medicine_name: '', medicine_time: null,
    activities_am: '', activities_pm: '', teacher_notes: '', bm_count: 0, bm_condition: null, snack_spent: 0, bento_spent: 0,
  };
}

/** Check in = create/update the log with status present and arrival = now (Asia/Tokyo). */
export async function checkIn(studentId, date) {
  findStudent(studentId);
  const now = new Date().toISOString();
  const existing = findLog(studentId, date);
  if (existing) {
    existing.status = 'present';
    existing.arrival_time = existing.arrival_time ?? nowHMTokyo();
    existing.updated_at = now;
    return clone(existing);
  }
  const log = { ...emptyLog(studentId, date), id: nextId(db.logs), arrival_time: nowHMTokyo(), created_by: 1, created_at: now, updated_at: now };
  db.logs.push(log);
  return clone(log);
}

// ---- Daily logs ----

export async function getDailyLog(studentId, date) {
  findStudent(studentId);
  return clone(findLog(studentId, date) ?? null);
}

function normalizeLog(body) {
  const present = body.status === 'present';
  const medicine = !!body.medicine_taken;
  const bmCount = Math.max(0, parseInt(body.bm_count, 10) || 0);
  return {
    status: present ? 'present' : 'absent',
    arrival_time: present ? body.arrival_time || null : null,
    temperature: parseTemp(body.temperature),
    temp_measured_at: body.temp_measured_at || null,
    lunch_contents: body.lunch_contents ?? '',
    lunch_eaten: body.lunch_eaten || null,
    medicine_taken: medicine,
    medicine_name: medicine ? body.medicine_name ?? '' : '',
    medicine_time: medicine ? body.medicine_time || null : null,
    activities_am: body.activities_am ?? '',
    activities_pm: body.activities_pm ?? '',
    teacher_notes: body.teacher_notes ?? '',
    bm_count: bmCount,
    bm_condition: bmCount > 0 ? body.bm_condition || 'normal' : null,
    snack_spent: toYen(body.snack_spent),
    bento_spent: toYen(body.bento_spent),
  };
}

export async function putDailyLog(studentId, date, body) {
  findStudent(studentId);
  const now = new Date().toISOString();
  const data = normalizeLog(body);
  const existing = findLog(studentId, date);
  if (existing) {
    Object.assign(existing, data, { updated_at: now });
    return clone(existing);
  }
  const log = { id: nextId(db.logs), student_id: Number(studentId), date, ...data, created_by: 1, created_at: now, updated_at: now };
  db.logs.push(log);
  return clone(log);
}

export async function listDailyLogs(studentId, from, to) {
  findStudent(studentId);
  return clone(logsInRange(studentId, from, to).sort((a, b) => b.date.localeCompare(a.date)));
}

// ---- Monthly plans ----

export async function getMonthlyPlan(studentId, ym) {
  findStudent(studentId);
  return clone(findPlan(studentId, ym) ?? null);
}

export async function putMonthlyPlan(studentId, ym, body) {
  findStudent(studentId);
  const data = {
    snack_deposit: body.snack_deposit === undefined ? DEFAULT_SNACK_DEPOSIT : toYen(body.snack_deposit),
    bento_deposit: body.bento_deposit === undefined ? DEFAULT_BENTO_DEPOSIT : toYen(body.bento_deposit),
    money_received: !!body.money_received,
    report_received_on: body.report_received_on || null,
    parent_notes: body.parent_notes ?? '',
    days: [...new Set(body.days ?? [])].filter((d) => monthKey(d) === ym).sort(),
  };
  const existing = findPlan(studentId, ym);
  if (existing) {
    Object.assign(existing, data);
    return clone(existing);
  }
  const plan = { id: nextId(db.plans), student_id: Number(studentId), month: firstOfMonth(ym), ...data };
  db.plans.push(plan);
  return clone(plan);
}

// ---- Balance ----

export async function getBalance(studentId, ym) {
  findStudent(studentId);
  const plan = findPlan(studentId, ym);
  const logs = logsInRange(studentId, firstOfMonth(ym), lastOfMonth(ym));
  return computeBalance(plan, logs);
}

// ---- Reports ----

function plannedDatesInRange(studentId, from, to) {
  return db.plans
    .filter((p) => p.student_id === Number(studentId))
    .flatMap((p) => p.days)
    .filter((d) => d >= from && d <= to)
    .sort();
}

function summarizeStudent(student, from, to, today) {
  const logs = logsInRange(student.id, from, to);
  const planned = plannedDatesInRange(student.id, from, to);
  const byDate = Object.fromEntries(logs.map((l) => [l.date, l]));
  const present = logs.filter((l) => l.status === 'present');
  const singleMonth = monthKey(from) === monthKey(to);
  const plan = singleMonth ? findPlan(student.id, monthKey(from)) : null;
  const money = computeBalance(plan, logs);
  return {
    student: clone(withClass(student)),
    planned_days: planned.length,
    attended: present.length,
    absent: logs.filter((l) => l.status === 'absent').length,
    // planned days already past (before today) with no log at all
    not_recorded: planned.filter((d) => d < today && !byDate[d]).length,
    fever_days: present.filter((l) => isFever(l.temperature)).length,
    medicine_days: present.filter((l) => l.medicine_taken).length,
    snack: money.snack,
    bento: money.bento,
    has_deposit: !!plan,
    days: Object.fromEntries(
      [...new Set([...planned, ...logs.map((l) => l.date)])].map((d) => [
        d,
        byDate[d]?.status ?? (d < today ? 'missing' : 'planned'),
      ]),
    ),
  };
}

/** GET /reports/summary?from=&to= — per-student totals for a week or month. */
export async function getSummary(from, to, today = todayTokyo()) {
  return db.students.filter((s) => s.is_active).map((s) => summarizeStudent(s, from, to, today));
}
