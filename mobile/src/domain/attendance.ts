import { isInsideGeofence, distanceToGeofenceM } from './geo';
import { atLocal, minutesBetween } from './time';
import type { Assignment, AttendanceStatus, Flag, LatLng } from './types';

export type CheckInStatus = Extract<AttendanceStatus, 'on_time' | 'late'>;

export type CheckInResult = { status: CheckInStatus; lateByMinutes: number };

/** On time up to the end of the grace period, late afterwards. */
export function evaluateCheckIn(a: Pick<Assignment, 'date' | 'start' | 'graceMinutes'>, at: Date): CheckInResult {
  const lateBy = minutesBetween(atLocal(a.date, a.start), at) - a.graceMinutes;
  return lateBy > 0 ? { status: 'late', lateByMinutes: lateBy } : { status: 'on_time', lateByMinutes: 0 };
}

export type CheckOutResult = {
  status: Extract<AttendanceStatus, 'on_time' | 'early_leave' | 'overtime'>;
  earlyByMinutes: number;
  overtimeMinutes: number;
};

export function evaluateCheckOut(
  a: Pick<Assignment, 'date' | 'end' | 'earlyLeaveToleranceMinutes'>,
  at: Date,
): CheckOutResult {
  const diff = minutesBetween(atLocal(a.date, a.end), at);
  if (diff < -a.earlyLeaveToleranceMinutes) return { status: 'early_leave', earlyByMinutes: -diff, overtimeMinutes: 0 };
  if (diff > 0) return { status: 'overtime', earlyByMinutes: 0, overtimeMinutes: diff };
  return { status: 'on_time', earlyByMinutes: 0, overtimeMinutes: 0 };
}

/** Unpaid break deducted from the day's total in the check-out summary. */
export const BREAK_MINUTES = 60;

export function workedMinutes(checkIn: Date, checkOut: Date): number {
  return Math.max(0, minutesBetween(checkIn, checkOut));
}

export type CapturedPosition = LatLng & { accuracyM: number; mocked: boolean; capturedAt: Date };

export type VerificationContext = {
  position: CapturedPosition;
  site: Assignment['site'];
  /** `false` when the phone is not the device registered to the account. */
  deviceRegistered: boolean;
  /** `false` when no assignment exists for this employee at this site now. */
  scheduled: boolean;
  /** Most recent server time known to the app, used to spot a changed phone clock. */
  serverNow?: Date;
  maxClockSkewMinutes?: number;
};

/**
 * Client-side mirror of the server verification pipeline. A check-in is never blocked
 * for these reasons: it is recorded and flagged for admin review.
 */
export function collectFlags(ctx: VerificationContext): Flag[] {
  const flags: Flag[] = [];
  const { position, site } = ctx;
  if (!ctx.deviceRegistered) flags.push({ reason: 'DEVICE_MISMATCH' });
  if (!ctx.scheduled) flags.push({ reason: 'UNSCHEDULED' });
  if (!isInsideGeofence(position, site.geofence)) {
    flags.push({ reason: 'OUTSIDE_GEOFENCE', distanceM: Math.round(distanceToGeofenceM(position, site.geofence)) });
  }
  if (position.accuracyM > site.minAccuracyM) flags.push({ reason: 'LOW_ACCURACY' });
  if (position.mocked) flags.push({ reason: 'MOCK_LOCATION' });
  if (ctx.serverNow) {
    const skew = Math.abs(minutesBetween(ctx.serverNow, position.capturedAt));
    if (skew > (ctx.maxClockSkewMinutes ?? 5)) flags.push({ reason: 'TIME_TAMPERED' });
  }
  return flags;
}

export type CheckInButtonState =
  | { kind: 'waiting_gps' }
  | { kind: 'outside'; distanceM: number }
  | { kind: 'ready' }
  | { kind: 'checked_in'; since: Date }
  | { kind: 'done'; workedMinutes: number };

export type ButtonInputs = {
  position?: Pick<CapturedPosition, 'accuracyM'> & LatLng;
  site: Assignment['site'];
  checkedInAt?: Date;
  checkedOutAt?: Date;
};

/** Drives the Home check-in button (Mobile App.md §3). */
export function resolveCheckInButton({ position, site, checkedInAt, checkedOutAt }: ButtonInputs): CheckInButtonState {
  if (checkedInAt && checkedOutAt) return { kind: 'done', workedMinutes: workedMinutes(checkedInAt, checkedOutAt) };
  if (checkedInAt) return { kind: 'checked_in', since: checkedInAt };
  if (!position || position.accuracyM > site.minAccuracyM) return { kind: 'waiting_gps' };
  if (!isInsideGeofence(position, site.geofence)) {
    return { kind: 'outside', distanceM: Math.round(distanceToGeofenceM(position, site.geofence)) };
  }
  return { kind: 'ready' };
}

export type DaySummary = { gross: number; total: number; scheduled: number; difference: number };

/**
 * Minutes for the check-out summary. The unpaid break comes off both the worked time and the
 * scheduled time, so the difference reflects early leave or overtime only.
 */
export function daySummary(a: Pick<Assignment, 'date' | 'start' | 'end'>, checkIn: Date, checkOut: Date): DaySummary {
  const gross = workedMinutes(checkIn, checkOut);
  const total = Math.max(0, gross - BREAK_MINUTES);
  const scheduled = Math.max(0, minutesBetween(atLocal(a.date, a.start), atLocal(a.date, a.end)) - BREAK_MINUTES);
  return { gross, total, scheduled, difference: total - scheduled };
}

export type GateStep = 'mock_location' | 'device_unregistered' | 'not_scheduled' | 'not_at_site' | 'confirm';

export type GateInput = {
  mocked: boolean;
  deviceRegistered: boolean;
  scheduledHere: boolean;
  insideGeofence: boolean;
  mode: 'check_in' | 'check_out';
  /** The user already chose "check in anyway" / "check out anyway" for that gate. */
  unscheduledOk: boolean;
  outsideOk: boolean;
};

/** First blocking screen of the check flow, in the order the design shows them; `confirm` when none apply. */
export function resolveGate(i: GateInput): GateStep {
  if (i.mocked) return 'mock_location';
  if (!i.deviceRegistered) return 'device_unregistered';
  if (!i.scheduledHere && !i.unscheduledOk) return 'not_scheduled';
  if (i.mode === 'check_out' && !i.outsideOk && !i.insideGeofence) return 'not_at_site';
  return 'confirm';
}
