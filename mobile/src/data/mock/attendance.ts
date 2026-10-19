import {
  collectFlags,
  evaluateCheckIn,
  evaluateCheckOut,
  workedMinutes,
  type AttendanceRecord,
  type CorrectionRequest,
} from '@/domain';

import {
  AppError,
  type AttendanceRepository,
  type CheckEvent,
  type CheckResult,
  type MonthSummary,
} from '../repositories/types';
import { db, delay } from './db';

const recordIdFor = (assignmentId: string) => `rec-${assignmentId}`;
const minutesOf = (r: AttendanceRecord) =>
  r.checkInAt && r.checkOutAt ? workedMinutes(new Date(r.checkInAt), new Date(r.checkOutAt)) : 0;

function summarize(records: AttendanceRecord[]): MonthSummary {
  const worked = records.reduce((s, r) => s + minutesOf(r), 0);
  return {
    present: records.filter((r) => r.checkInAt).length,
    late: records.filter((r) => (r.lateByMinutes ?? 0) > 0).length,
    absent: records.filter((r) => r.status === 'absent').length,
    hoursWorked: Math.round((worked / 60) * 10) / 10,
    leaveDays: records.filter((r) => r.status === 'on_leave').length,
    overtimeHours: Math.round((records.reduce((s, r) => s + (r.overtimeMinutes ?? 0), 0) / 60) * 10) / 10,
  };
}

function process(event: CheckEvent): CheckResult {
  const assignment = db.assignments.find((a) => a.id === event.assignmentId);
  if (!assignment) throw new AppError('NOT_FOUND');
  const at = new Date(event.position.capturedAt);
  const recordId = recordIdFor(assignment.id);
  const existing = db.records.find((r) => r.id === recordId);

  if (event.type === 'check_in') {
    if (existing?.checkInAt) throw new AppError('CONFLICT');
    const flags = collectFlags({
      site: assignment.site,
      deviceRegistered: true,
      scheduled: assignment.date === db.today || !!event.acceptUnscheduled,
      position: { ...event.position, capturedAt: at },
      serverNow: new Date(),
    });
    const { status, lateByMinutes } = evaluateCheckIn(assignment, at);
    const record: AttendanceRecord = {
      id: recordId,
      date: assignment.date,
      site: { id: assignment.site.id, name: assignment.site.name },
      scheduledStart: assignment.start,
      scheduledEnd: assignment.end,
      checkInAt: at.toISOString(),
      status: flags.length ? 'flagged' : status,
      lateByMinutes,
      method: event.method === 'qr' ? 'qr' : 'self',
      flags,
      flagOutcome: flags.length ? 'pending' : undefined,
    };
    db.records = [...db.records.filter((r) => r.id !== recordId), record];
    return { record, flags };
  }

  if (!existing?.checkInAt || existing.checkOutAt) throw new AppError('CONFLICT');
  const out = evaluateCheckOut(assignment, at);
  const record: AttendanceRecord = {
    ...existing,
    checkOutAt: at.toISOString(),
    status: existing.flags.length ? 'flagged' : out.status === 'on_time' ? existing.status : out.status,
    earlyByMinutes: out.earlyByMinutes,
    overtimeMinutes: out.overtimeMinutes,
    adminNote: event.note,
  };
  db.records = db.records.map((r) => (r.id === recordId ? record : r));
  return { record, flags: existing.flags.slice() };
}

export const mockAttendance: AttendanceRepository = {
  async getMonth(month) {
    await delay();
    const records = db.records.filter((r) => r.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
    return { records, summary: summarize(records) };
  },

  async getRecord(id) {
    await delay(100);
    const r = db.records.find((x) => x.id === id);
    if (!r) throw new AppError('NOT_FOUND');
    return r;
  },

  async getForAssignment(assignmentId) {
    await delay(100);
    return db.records.find((r) => r.id === recordIdFor(assignmentId)) ?? null;
  },

  async getWeekSummary() {
    await delay(100);
    const from = new Date();
    from.setDate(from.getDate() - 6);
    const recent = db.records.filter((r) => r.date >= from.toISOString().slice(0, 10));
    const s = summarize(recent);
    return { present: s.present, late: s.late, hoursWorked: s.hoursWorked };
  },

  async checkIn(event) {
    await delay(400);
    return process(event);
  },

  async checkOut(event) {
    await delay(400);
    return process(event);
  },

  async sync(events) {
    await delay(300);
    const results: Record<string, CheckResult | AppError> = {};
    for (const e of [...events].sort((a, b) => a.position.capturedAt.localeCompare(b.position.capturedAt))) {
      try {
        const res = process(e);
        res.record.offlineSynced = true;
        results[e.clientEventId] = res;
      } catch (err) {
        results[e.clientEventId] = err instanceof AppError ? err : new AppError('VALIDATION');
      }
    }
    return results;
  },

  async addComment(recordId, comment) {
    await delay(150);
    db.records = db.records.map((r) => (r.id === recordId ? { ...r, employeeComment: comment } : r));
  },

  async requestCorrection(input) {
    await delay(300);
    const created: CorrectionRequest = {
      id: `cr-${Date.now()}`,
      recordId: input.recordId,
      kind: input.kind,
      proposedTime: input.proposedTime,
      comment: input.comment,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.corrections = [...db.corrections, created];
    return created;
  },

  async listCorrections(recordId) {
    await delay(80);
    return db.corrections.filter((c) => c.recordId === recordId);
  },
};
