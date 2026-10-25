import { guarded, http } from '../../http/client';
import { toBalance, toLeave, toLeaveType } from '../../http/mappers';
import { uploadFile } from '../../http/upload';
import type { LeaveDraft, LeaveRepository } from '../types';

const draftBody = (d: LeaveDraft) => ({
  leaveTypeId: d.typeId,
  startDate: d.start,
  endDate: d.end,
  startHalf: d.startHalf,
  endHalf: d.endHalf,
  reason: d.reason,
});

/** The body plus, when a new file was picked, its uploaded key. */
const sendBody = async (d: LeaveDraft) => ({
  ...draftBody(d),
  attachmentKeys: d.attachmentUri ? [await uploadFile('leave-attachment', d.attachmentUri, d.attachmentType)] : undefined,
});

export const httpLeave: LeaveRepository = {
  async getTypes() {
    return (await http.get<unknown[]>('/leave/types')).map(toLeaveType);
  },
  async getBalances(year) {
    return (await http.get<unknown[]>('/me/leave/balances', { query: { year } })).map(toBalance);
  },
  async list() {
    return (await http.get<unknown[]>('/me/leave/requests')).map(toLeave);
  },
  async get(id) {
    return toLeave(await http.get(`/me/leave/requests/${id}`));
  },
  async preview(draft) {
    const p = await http.post<{ days: number; remainingAfter: number; warnings: { code: string; detail?: string }[]; reviewer?: string | null }>('/me/leave/requests/preview', { body: draftBody(draft) });
    return { days: p.days, remainingAfter: p.remainingAfter, warnings: p.warnings as never, reviewer: p.reviewer ?? '' };
  },
  async submit(draft) {
    return toLeave(await guarded(async () => http.post('/me/leave/requests', { body: await sendBody(draft) })));
  },
  async update(id, draft) {
    return toLeave(await guarded(async () => http.patch(`/me/leave/requests/${id}`, { body: await sendBody(draft) })));
  },
  async cancel(id, reason) {
    return toLeave(await guarded(() => http.post(`/me/leave/requests/${id}/cancel`, { body: { reason: reason ?? 'Cancelled by employee' } })));
  },
};
