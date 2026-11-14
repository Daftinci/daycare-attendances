import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

export const keys = {
  classes: ['classes'],
  students: ['students'],
  student: (id) => ['student', String(id)],
  attendance: (date) => ['attendance', date],
  dailyLog: (id, date) => ['dailyLog', String(id), date],
  dailyLogs: (id, from, to) => ['dailyLogs', String(id), from, to],
  plan: (id, ym) => ['plan', String(id), ym],
  balance: (id, ym) => ['balance', String(id), ym],
};

export const useClasses = () => useQuery({ queryKey: keys.classes, queryFn: api.listClasses });
export const useStudents = () => useQuery({ queryKey: keys.students, queryFn: api.listStudents });

export const useStudent = (id) =>
  useQuery({ queryKey: keys.student(id), queryFn: () => api.getStudent(id), enabled: !!id });

export const useAttendance = (date) =>
  useQuery({ queryKey: keys.attendance(date), queryFn: () => api.getAttendance(date) });

export const useDailyLog = (id, date) =>
  useQuery({ queryKey: keys.dailyLog(id, date), queryFn: () => api.getDailyLog(id, date), enabled: !!id && !!date });

export const useDailyLogs = (id, from, to) =>
  useQuery({ queryKey: keys.dailyLogs(id, from, to), queryFn: () => api.listDailyLogs(id, from, to), enabled: !!id });

export const useMonthlyPlan = (id, ym) =>
  useQuery({ queryKey: keys.plan(id, ym), queryFn: () => api.getMonthlyPlan(id, ym), enabled: !!id && !!ym });

export const useBalance = (id, ym) =>
  useQuery({ queryKey: keys.balance(id, ym), queryFn: () => api.getBalance(id, ym), enabled: !!id && !!ym });

/** Saving anything can change attendance, balances and logs, so refresh everything. */
function useInvalidateAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useCheckIn(date) {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (studentId) => api.checkIn(studentId, date), onSuccess: invalidate });
}

export function useSaveDailyLog(id, date) {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (body) => api.putDailyLog(id, date, body), onSuccess: invalidate });
}

export function useSaveMonthlyPlan(id, ym) {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (body) => api.putMonthlyPlan(id, ym, body), onSuccess: invalidate });
}

export const useSummary = (from, to) =>
  useQuery({ queryKey: ['summary', from, to], queryFn: () => api.getSummary(from, to) });
