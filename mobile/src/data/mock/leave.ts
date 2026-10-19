import {
  countLeaveDays,
  DEFAULT_WORKING_WEEKDAYS,
  leaveWarnings,
  type LeaveRequest,
} from '@/domain';

import { AppError, type LeaveDraft, type LeaveRepository } from '../repositories/types';
import { BALANCES, LEAVE_TYPES, db, delay } from './db';

function compute(draft: LeaveDraft) {
  const type = LEAVE_TYPES.find((t) => t.id === draft.typeId);
  if (!type) throw new AppError('VALIDATION');
  const days = countLeaveDays(draft, { holidays: new Set(db.holidays), workingWeekdays: DEFAULT_WORKING_WEEKDAYS });
  const remaining = BALANCES.find((b) => b.typeId === type.id)?.remaining ?? 0;
  const warnings = leaveWarnings({
    type,
    days,
    remaining,
    start: draft.start,
    end: draft.end,
    today: new Date(),
    interventionDates: new Set(db.assignments.filter((a) => a.type === 'intervention').map((a) => a.date)),
    hasAttachment: !!draft.attachmentName,
  });
  return { days, remaining, warnings };
}

export const mockLeave: LeaveRepository = {
  async getTypes() {
    await delay(80);
    return LEAVE_TYPES;
  },

  async getBalances() {
    await delay(100);
    return BALANCES;
  },

  async list() {
    await delay();
    return [...db.leave].sort((a, b) => b.start.localeCompare(a.start));
  },

  async get(id) {
    await delay(100);
    const r = db.leave.find((x) => x.id === id);
    if (!r) throw new AppError('NOT_FOUND');
    return r;
  },

  async preview(draft) {
    await delay(120);
    const { days, remaining, warnings } = compute(draft);
    return { days, remainingAfter: remaining - days, warnings, reviewer: 'Karim Mbarga' };
  },

  async submit(draft) {
    await delay(400);
    const { days } = compute(draft);
    const created: LeaveRequest = {
      id: `lv-${Date.now()}`,
      ...draft,
      days,
      status: 'pending',
      approver: 'Karim Mbarga',
      timeline: [{ actor: db.signedIn?.name ?? 'You', action: 'submitted', at: new Date().toISOString() }],
    };
    db.leave = [created, ...db.leave];
    return created;
  },

  async update(id, draft) {
    await delay(300);
    const current = db.leave.find((r) => r.id === id);
    if (!current || (current.status !== 'pending' && current.status !== 'changes_requested')) throw new AppError('CONFLICT');
    const { days } = compute(draft);
    const updated: LeaveRequest = { ...current, ...draft, days, status: 'pending' };
    db.leave = db.leave.map((r) => (r.id === id ? updated : r));
    return updated;
  },

  async cancel(id, reason) {
    await delay(300);
    const current = db.leave.find((r) => r.id === id);
    if (!current) throw new AppError('NOT_FOUND');
    // Approved leave needs approver sign-off, so it stays approved with a recorded request.
    const status = current.status === 'approved' ? current.status : 'cancelled';
    const updated: LeaveRequest = {
      ...current,
      status,
      timeline: [
        ...current.timeline,
        { actor: db.signedIn?.name ?? 'You', action: 'cancelled', at: new Date().toISOString(), comment: reason },
      ],
    };
    db.leave = db.leave.map((r) => (r.id === id ? updated : r));
    return updated;
  },
};
