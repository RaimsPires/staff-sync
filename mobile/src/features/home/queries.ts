import { useQuery } from '@tanstack/react-query';
import { addDays } from 'date-fns';

import { qk } from '@/data/query-keys';
import { repos } from '@/data';
import { toIsoDate } from '@/domain';

export const useTodayAssignments = () =>
  useQuery({ queryKey: qk.assignmentsToday, queryFn: () => repos.schedule.getToday() });

export const useAssignmentRecord = (assignmentId: string | undefined) =>
  useQuery({
    queryKey: qk.record(assignmentId ?? 'none'),
    queryFn: () => repos.attendance.getForAssignment(assignmentId as string),
    enabled: !!assignmentId,
  });

export const useWeekSummary = () => useQuery({ queryKey: qk.week, queryFn: () => repos.attendance.getWeekSummary() });

export const useNotifications = () => useQuery({ queryKey: qk.notifications, queryFn: () => repos.notifications.list() });

/** Approved leave that covers today, if any (drives the "On leave today" card). */
export const useLeaveToday = () => {
  const today = toIsoDate(new Date());
  return useQuery({
    queryKey: ['home', 'leave-today', today],
    queryFn: async () => (await repos.schedule.getApprovedLeave(today, today))[0] ?? null,
  });
};

/** The next assignment after today, shown in the "No shift today" card. */
export const useNextShift = (enabled: boolean) => {
  const from = toIsoDate(addDays(new Date(), 1));
  const to = toIsoDate(addDays(new Date(), 14));
  return useQuery({
    queryKey: ['home', 'next-shift', from],
    queryFn: async () => (await repos.schedule.getRange(from, to)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0] ?? null,
    enabled,
  });
};
