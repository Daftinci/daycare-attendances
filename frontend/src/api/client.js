// The one place the UI talks to "the server".
// Today it calls the in-memory mock. When the FastAPI backend exists, replace each
// function body with a fetch to the matching /api endpoint (same names, same shapes).
import * as mock from './mock/server.js';

const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 150;

function call(fn) {
  return async (...args) => {
    if (LATENCY_MS) await new Promise((r) => setTimeout(r, LATENCY_MS));
    return fn(...args);
  };
}

export const api = {
  listClasses: call(mock.listClasses), //                      GET  /classes
  listStudents: call(mock.listStudents), //                    GET  /students
  getStudent: call(mock.getStudent), //                        GET  /students/{id}
  getAttendance: call(mock.getAttendance), //                  GET  /attendance?date=
  checkIn: call(mock.checkIn), //                              POST /students/{id}/check-in?date=
  getDailyLog: call(mock.getDailyLog), //                      GET  /students/{id}/daily-logs/{date}
  putDailyLog: call(mock.putDailyLog), //                      PUT  /students/{id}/daily-logs/{date}
  listDailyLogs: call(mock.listDailyLogs), //                  GET  /students/{id}/daily-logs?from=&to=
  getMonthlyPlan: call(mock.getMonthlyPlan), //                GET  /students/{id}/monthly-plans/{YYYY-MM}
  putMonthlyPlan: call(mock.putMonthlyPlan), //                PUT  /students/{id}/monthly-plans/{YYYY-MM}
  getBalance: call(mock.getBalance), //                        GET  /students/{id}/balance?month=
  getSummary: call(mock.getSummary), //                        GET  /reports/summary?from=&to=
};
