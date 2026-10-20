import { useQuery } from '@tanstack/react-query';
import { endOfMonth, startOfMonth } from 'date-fns';

import { repos } from '@/data';
import { qk } from '@/data/query-keys';
import { toIsoDate } from '@/domain';

/** Assignments, holidays and approved leave for the month containing `anchor`. */
export function useMonthSchedule(anchor: Date) {
  const from = toIsoDate(startOfMonth(anchor));
  const to = toIsoDate(endOfMonth(anchor));
  const assignments = useQuery({ queryKey: qk.range(from, to), queryFn: () => repos.schedule.getRange(from, to) });
  const holidays = useQuery({ queryKey: ['holidays', from, to], queryFn: () => repos.schedule.getHolidays(from, to) });
  const leave = useQuery({ queryKey: ['approved-leave', from, to], queryFn: () => repos.schedule.getApprovedLeave(from, to) });
  return { assignments: assignments.data ?? [], holidays: holidays.data ?? [], leave: leave.data ?? [], isLoading: assignments.isLoading };
}
