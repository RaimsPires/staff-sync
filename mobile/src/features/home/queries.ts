import { useQuery } from '@tanstack/react-query';

import { qk } from '@/data/query-keys';
import { repos } from '@/data';

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
