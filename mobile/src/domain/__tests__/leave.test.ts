import { allowedLeaveActions, countLeaveDays, DEFAULT_WORKING_WEEKDAYS, leaveWarnings } from '../leave';
import type { LeaveType } from '../types';

const cal = { holidays: new Set(['2026-10-21']), workingWeekdays: DEFAULT_WORKING_WEEKDAYS };
const annual: LeaveType = {
  id: 'annual',
  name: { en: 'Annual', fr: 'Annuel' },
  allowsHalfDay: true,
  requiresAttachment: false,
  minNoticeDays: 7,
};

describe('countLeaveDays', () => {
  it('skips weekends and holidays', () => {
    // Mon 19 → Mon 26, holiday Wed 21: 19,20,22,23,26 = 5
    expect(countLeaveDays({ start: '2026-10-19', end: '2026-10-26' }, cal)).toBe(5);
  });
  it('honours half days on the first and last day', () => {
    expect(countLeaveDays({ start: '2026-10-22', end: '2026-10-23', startHalf: 'afternoon', endHalf: 'morning' }, cal)).toBe(1);
  });
  it('counts a single half day', () => {
    expect(countLeaveDays({ start: '2026-10-22', end: '2026-10-22', startHalf: 'morning' }, cal)).toBe(0.5);
  });
  it('returns 0 for inverted ranges', () => {
    expect(countLeaveDays({ start: '2026-10-23', end: '2026-10-22' }, cal)).toBe(0);
  });
});

describe('leaveWarnings', () => {
  const base = {
    type: annual,
    days: 3,
    remaining: 9,
    start: '2026-11-10',
    end: '2026-11-12',
    today: new Date('2026-10-19T09:00:00'),
    interventionDates: new Set<string>(),
    hasAttachment: false,
  };
  it('has none for a valid request', () => {
    expect(leaveWarnings(base)).toEqual([]);
  });
  it('flags balance, notice, overlap and attachments', () => {
    const w = leaveWarnings({
      ...base,
      days: 12,
      start: '2026-10-20',
      end: '2026-10-21',
      interventionDates: new Set(['2026-10-21']),
      type: { ...annual, requiresAttachment: true },
    });
    expect(w).toEqual(['exceeds_balance', 'short_notice', 'overlaps_intervention', 'attachment_required']);
  });
});

describe('allowedLeaveActions', () => {
  it('follows the status table', () => {
    expect(allowedLeaveActions('pending')).toEqual(['edit', 'cancel']);
    expect(allowedLeaveActions('approved')).toEqual(['request_cancellation']);
    expect(allowedLeaveActions('cancelled')).toEqual([]);
  });
});
