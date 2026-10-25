import { AppError, type AttendanceRepository, type CheckEvent, type CheckResult } from '../types';
import { guarded, http } from '../../http/client';
import { toCorrection, toRecord } from '../../http/mappers';
import { uploadFile } from '../../http/upload';

const toCheckResult = (r: any): CheckResult => ({
  record: toRecord(r.record),
  flags: (r.flags ?? []).map((f: any) => ({ reason: f.reason, distanceM: f.distanceM ?? undefined })),
});

async function toBody(e: CheckEvent, withType: boolean) {
  return {
    ...(withType ? { type: e.type } : {}),
    clientEventId: e.clientEventId,
    shiftId: e.assignmentId,
    lat: e.position.lat,
    lng: e.position.lng,
    accuracyM: e.position.accuracyM,
    capturedAt: e.position.capturedAt,
    isMockLocation: e.position.mocked,
    method: e.method,
    qrPayload: e.qrPayload,
    note: e.note,
    acceptUnscheduled: e.acceptUnscheduled,
    selfieKey: e.selfieUri ? await uploadFile('selfie', e.selfieUri) : undefined,
  };
}

/** Same code names the screens already understand; anything else stays a plain error. */
const domainError = (code: string, extra?: Record<string, unknown>) =>
  code === 'ALREADY_CHECKED_IN' || code === 'NO_OPEN_RECORD' ? new AppError('CONFLICT') : code === 'UNSCHEDULED' ? new AppError('UNSCHEDULED') : new AppError('VALIDATION', extra as never);

export const httpAttendance: AttendanceRepository = {
  async getMonth(month) {
    const res = await http.get<{ records: unknown[]; summary: any }>('/me/attendance', { query: { month } });
    return { records: res.records.map(toRecord), summary: res.summary };
  },
  async getRecord(id) {
    return toRecord(await http.get(`/me/attendance/${id}`));
  },
  async getForAssignment(assignmentId) {
    const r = await http.get<unknown | null>(`/me/attendance/for-shift/${assignmentId}`);
    return r ? toRecord(r) : null;
  },
  getWeekSummary() {
    return http.get('/me/attendance/week-summary');
  },
  async checkIn(event) {
    return toCheckResult(await guarded(async () => http.post('/attendance/check-in', { body: await toBody(event, false) })));
  },
  async checkOut(event) {
    return toCheckResult(await guarded(async () => http.post('/attendance/check-out', { body: await toBody(event, false) })));
  },
  async sync(events) {
    const body = { events: await Promise.all(events.map((e) => toBody(e, true))) };
    const res = await http.post<{ results: { clientEventId: string; ok: boolean; result?: unknown; error?: { code?: string } }[] }>('/attendance/sync', { body });
    return Object.fromEntries(res.results.map((r) => [r.clientEventId, r.ok && r.result ? toCheckResult(r.result) : domainError(r.error?.code ?? '')]));
  },
  async addComment(recordId, comment) {
    await http.post(`/me/attendance/${recordId}/comment`, { body: { comment } });
  },
  async requestCorrection(input) {
    const attachmentKey = input.attachmentUri ? await uploadFile('correction-attachment', input.attachmentUri, input.attachmentType) : undefined;
    const time = input.proposedTime;
    const body = {
      kind: input.kind,
      comment: input.comment,
      attachmentKey,
      proposedIn: input.kind === 'wrong_time' ? time : undefined,
      proposedOut: input.kind === 'forgot_checkout' ? time : undefined,
    };
    return toCorrection(await guarded(() => http.post(`/me/attendance/${input.recordId}/corrections`, { body })));
  },
  async listCorrections(recordId) {
    return (await http.get<any[]>('/me/corrections', { query: { recordId } })).map(toCorrection);
  },
};
