import { parseIsoDate, toIsoDate } from './time';
import type { HalfDay, IsoDate, LeaveRequest, LeaveType } from './types';

export type LeaveCalendar = {
  /** Public holidays on the branch calendar. */
  holidays: ReadonlySet<IsoDate>;
  /** ISO weekday numbers worked (1 = Monday … 7 = Sunday). */
  workingWeekdays: readonly number[];
};

export const DEFAULT_WORKING_WEEKDAYS = [1, 2, 3, 4, 5] as const;

const isoWeekday = (d: Date) => ((d.getDay() + 6) % 7) + 1;

export type DayCountInput = {
  start: IsoDate;
  end: IsoDate;
  startHalf?: HalfDay;
  endHalf?: HalfDay;
};

/** Working days covered by a request, excluding weekends and holidays, honouring half-days. */
export function countLeaveDays(input: DayCountInput, cal: LeaveCalendar): number {
  const start = parseIsoDate(input.start);
  const end = parseIsoDate(input.end);
  if (end < start) return 0;

  let total = 0;
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = toIsoDate(d);
    if (!cal.workingWeekdays.includes(isoWeekday(d)) || cal.holidays.has(iso)) continue;
    const isStart = iso === input.start;
    const isEnd = iso === input.end;
    // A half-day on a single-day request still counts as one half.
    total += (isStart && input.startHalf) || (isEnd && input.endHalf) ? 0.5 : 1;
  }
  return total;
}

export type LeaveWarning = 'exceeds_balance' | 'short_notice' | 'overlaps_intervention' | 'attachment_required';

export type LeaveCheckInput = {
  type: LeaveType;
  days: number;
  remaining: number;
  start: IsoDate;
  today: Date;
  interventionDates: ReadonlySet<IsoDate>;
  end: IsoDate;
  hasAttachment: boolean;
};

export function leaveWarnings(i: LeaveCheckInput): LeaveWarning[] {
  const out: LeaveWarning[] = [];
  if (i.days > i.remaining) out.push('exceeds_balance');
  const noticeDays = Math.floor((parseIsoDate(i.start).getTime() - parseIsoDate(toIsoDate(i.today)).getTime()) / 86_400_000);
  if (noticeDays < i.type.minNoticeDays) out.push('short_notice');
  for (const d = parseIsoDate(i.start), end = parseIsoDate(i.end); d <= end; d.setDate(d.getDate() + 1)) {
    if (i.interventionDates.has(toIsoDate(d))) {
      out.push('overlaps_intervention');
      break;
    }
  }
  if (i.type.requiresAttachment && !i.hasAttachment) out.push('attachment_required');
  return out;
}

/** What the employee may do next, per the state table in Mobile App.md §6. */
export type LeaveAction = 'edit' | 'cancel' | 'resubmit' | 'request_cancellation' | 'new_request';

export function allowedLeaveActions(status: LeaveRequest['status']): readonly LeaveAction[] {
  switch (status) {
    case 'pending':
      return ['edit', 'cancel'];
    case 'changes_requested':
      return ['edit', 'resubmit'];
    case 'approved':
      return ['request_cancellation'];
    case 'rejected':
      return ['new_request'];
    case 'cancelled':
      return [];
  }
}

/** What can be chosen for the first and last day of a request (the design's half-day rules). */
export type HalfChoice = 'full' | HalfDay;

export function halfDayChoices(singleDay: boolean): { first: readonly HalfChoice[]; last: readonly HalfChoice[] } {
  // One day: full, morning or afternoon. Several days: the first day may only start in the
  // afternoon, the last day may only end in the morning.
  return singleDay ? { first: ['full', 'morning', 'afternoon'], last: [] } : { first: ['full', 'afternoon'], last: ['full', 'morning'] };
}
