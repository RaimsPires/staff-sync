import type { Company, LeaveTimelineEntry, Role, UserProfile } from '@/domain';

/** `GET /me/profile` and the `user` blocks of the auth responses, after camelizing. */
export type ApiProfile = {
  id: string;
  name: string;
  employeeNo?: string | null;
  title?: string | null;
  branch?: string | null;
  email?: string | null;
  phone?: string | null;
  role: string;
  siteIds: string[];
  siteNames: string[];
  managerName?: string | null;
  managerPhone?: string | null;
};

export type ApiCompany = { id: string; name: string; initials: string; color: string; role: string };

/** The phone app only knows two roles; web-only roles fall back to employee. */
export const toRole = (role: string): Role => (role === 'site_manager' ? 'site_manager' : 'employee');

export const toCompany = (c: ApiCompany): Company => ({ ...c, role: toRole(c.role) });

/**
 * The server also logs edits, resubmissions and cancellation requests. Resubmitting reads as a new
 * submission and a cancellation request as a pending cancellation; plain edits and any action the
 * app does not know are left out, so a new server action can never break the timeline.
 */
const TIMELINE_ACTIONS: Record<string, LeaveTimelineEntry['action'] | undefined> = {
  submitted: 'submitted',
  resubmitted: 'submitted',
  recommended: 'recommended',
  approved: 'approved',
  rejected: 'rejected',
  changes_requested: 'changes_requested',
  cancelled: 'cancelled',
  cancellation_requested: 'cancelled',
};

export const toTimeline = (raw: any[] | undefined): LeaveTimelineEntry[] =>
  (raw ?? []).flatMap((t) => {
    const action = TIMELINE_ACTIONS[t.action];
    return action ? [{ actor: t.actor ?? '', action, at: t.at, comment: t.comment ?? undefined }] : [];
  });

export const toProfile = (p: ApiProfile): UserProfile => ({
  id: p.id,
  name: p.name,
  employeeId: p.employeeNo ?? '',
  title: p.title ?? '',
  branch: p.branch ?? '',
  email: p.email ?? '',
  phone: p.phone ?? '',
  role: toRole(p.role),
  siteIds: p.siteIds,
  siteNames: p.siteNames,
  managerName: p.managerName ?? '',
  managerPhone: p.managerPhone ?? '',
  hasSmartphone: true,
});

import type { AppNotification, Assignment, AttendanceRecord, CheckMethod, CorrectionRequest, Geofence, LeaveBalance, LeaveRequest, LeaveType, NotificationKind, Site } from '@/domain';

import { stripNulls } from './case';

type ApiGeofence = { type: string; coordinates: number[][][] };
type ApiSite = {
  id: string;
  name: string;
  address?: string | null;
  center: [number, number];
  geofence: ApiGeofence;
  minAccuracyM: number;
  requires: ('selfie' | 'qr')[];
  managerName?: string | null;
  managerPhone?: string | null;
};

/** The API always sends a GeoJSON polygon ([lng, lat] pairs, ring closed); circles are approximated server-side. */
const toGeofence = (g: ApiGeofence): Geofence => ({
  kind: 'polygon',
  points: g.coordinates[0].slice(0, -1).map(([lng, lat]) => ({ lat, lng })),
});

export const toSite = (s: ApiSite): Site => ({
  id: s.id,
  name: s.name,
  address: s.address ?? '',
  center: { lat: s.center[1], lng: s.center[0] },
  geofence: toGeofence(s.geofence),
  minAccuracyM: s.minAccuracyM,
  requires: s.requires,
  managerName: s.managerName ?? '',
  managerPhone: s.managerPhone ?? '',
});

export const toAssignment = (a: any): Assignment => ({
  id: a.id,
  type: a.type,
  site: toSite(a.site),
  date: a.date,
  start: a.start,
  end: a.end,
  graceMinutes: a.graceMin,
  earlyLeaveToleranceMinutes: a.earlyLeaveTolMin,
  instructions: a.instructions ?? undefined,
  updatedByAdmin: a.updatedByAdmin || undefined,
  previousStart: a.previousStart ?? undefined,
  attachments: a.attachments?.length ? a.attachments : undefined,
});

const METHODS: readonly CheckMethod[] = ['self', 'qr', 'proxy'];

export const toRecord = (r: any): AttendanceRecord => {
  const x = stripNulls(r);
  return {
    id: x.id,
    date: x.date,
    site: { id: x.site.id, name: x.site.name },
    scheduledStart: x.scheduledStart ?? '',
    scheduledEnd: x.scheduledEnd ?? '',
    checkInAt: x.checkInAt,
    checkOutAt: x.checkOutAt,
    status: x.status,
    lateByMinutes: x.lateByMinutes,
    earlyByMinutes: x.earlyByMinutes,
    overtimeMinutes: x.overtimeMinutes,
    method: METHODS.includes(x.method) ? x.method : 'self',
    proxyBy: x.proxyBy,
    flags: (x.flags ?? []).map((f: any) => ({ reason: f.reason, distanceM: f.distanceM })),
    flagOutcome: x.flagOutcome,
    employeeComment: x.employeeComment,
    adminNote: x.adminNote,
    offlineSynced: x.offlineSynced || undefined,
  };
};

export const toCorrection = (c: any): CorrectionRequest => ({
  id: c.id,
  recordId: c.recordId,
  kind: c.kind,
  proposedTime: c.proposedOut ?? c.proposedIn ?? undefined,
  comment: c.comment,
  status: c.status,
  createdAt: c.createdAt,
  adminResponse: c.adminResponse ?? undefined,
  decidedAt: c.decidedAt ?? undefined,
});

export const toLeaveType = (t: any): LeaveType => ({
  id: t.id,
  name: { en: t.nameEn, fr: t.nameFr },
  allowsHalfDay: t.halfDayAllowed,
  requiresAttachment: t.requiresDocument,
  minNoticeDays: t.minNoticeDays,
});

export const toBalance = (b: any): LeaveBalance => ({ typeId: b.leaveTypeId, remaining: b.remaining, used: b.used, pending: b.pending });

export const toLeave = (l: any): LeaveRequest => {
  const x = stripNulls(l);
  return {
    id: x.id,
    typeId: x.leaveTypeId,
    start: x.startDate,
    end: x.endDate,
    startHalf: x.startHalf,
    endHalf: x.endHalf,
    days: x.days,
    reason: x.reason,
    attachmentName: x.attachmentKeys?.[0]?.split('/').pop(),
    status: x.status,
    approver: x.approver ?? '',
    timeline: toTimeline(x.timeline),
    employeeName: x.employeeName,
    recommendation: x.recommendation,
    recommendationComment: x.recommendationComment,
  };
};

const KINDS: readonly NotificationKind[] = ['shift_reminder', 'arrival_prompt', 'checkout_reminder', 'schedule_change', 'flag_update', 'leave_decision', 'correction_result', 'announcement'];

export const toNotification = (n: any): AppNotification => ({
  id: n.id,
  kind: KINDS.includes(n.type) ? n.type : 'announcement',
  title: n.title,
  body: n.body ?? '',
  at: n.createdAt,
  read: n.read,
  href: n.href ?? undefined,
});
