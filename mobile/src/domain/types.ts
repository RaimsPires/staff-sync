/** ISO 8601 UTC timestamp, as exchanged with the API. */
export type IsoDateTime = string;
/** Calendar date `YYYY-MM-DD` in the site's timezone. */
export type IsoDate = string;

export type Role = 'employee' | 'site_manager';

export type AttendanceStatus =
  | 'on_time'
  | 'late'
  | 'early_leave'
  | 'overtime'
  | 'missing_checkout'
  | 'absent'
  | 'on_leave'
  | 'holiday'
  | 'flagged';

export type LatLng = { lat: number; lng: number };

export type Geofence =
  | { kind: 'circle'; center: LatLng; radiusM: number }
  | { kind: 'polygon'; points: readonly LatLng[] };

export type VerificationMethod = 'selfie' | 'qr';

export type Site = {
  id: string;
  name: string;
  address: string;
  center: LatLng;
  geofence: Geofence;
  /** Minimum GPS accuracy (metres) the site accepts as reliable. */
  minAccuracyM: number;
  requires: readonly VerificationMethod[];
  managerName: string;
  managerPhone: string;
};

export type AssignmentType = 'shift' | 'intervention';

export type Assignment = {
  id: string;
  type: AssignmentType;
  site: Site;
  date: IsoDate;
  /** `HH:mm` local to the site. */
  start: string;
  end: string;
  graceMinutes: number;
  earlyLeaveToleranceMinutes: number;
  instructions?: string;
  updatedByAdmin?: boolean;
};

export type FlagReason =
  | 'OUTSIDE_GEOFENCE'
  | 'MOCK_LOCATION'
  | 'LOW_ACCURACY'
  | 'TIME_TAMPERED'
  | 'UNSCHEDULED'
  | 'DEVICE_MISMATCH';

export type Flag = { reason: FlagReason; distanceM?: number };

export type FlagOutcome = 'pending' | 'approved' | 'rejected';

export type CheckMethod = 'self' | 'qr' | 'proxy';

export type AttendanceRecord = {
  id: string;
  date: IsoDate;
  site: Pick<Site, 'id' | 'name'>;
  scheduledStart: string;
  scheduledEnd: string;
  checkInAt?: IsoDateTime;
  checkOutAt?: IsoDateTime;
  status: AttendanceStatus;
  lateByMinutes?: number;
  earlyByMinutes?: number;
  overtimeMinutes?: number;
  method: CheckMethod;
  proxyBy?: string;
  flags: readonly Flag[];
  flagOutcome?: FlagOutcome;
  employeeComment?: string;
  adminNote?: string;
  offlineSynced?: boolean;
};

export type CorrectionKind = 'forgot_checkout' | 'wrong_time' | 'flagged_incorrectly';
export type CorrectionStatus = 'pending' | 'accepted' | 'declined';

export type CorrectionRequest = {
  id: string;
  recordId: string;
  kind: CorrectionKind;
  proposedTime?: string;
  comment: string;
  status: CorrectionStatus;
  createdAt: IsoDateTime;
};

export type LeaveStatus = 'pending' | 'changes_requested' | 'approved' | 'rejected' | 'cancelled';

export type LeaveType = {
  id: string;
  name: { en: string; fr: string };
  allowsHalfDay: boolean;
  requiresAttachment: boolean;
  /** Minimum days of notice the company asks for. */
  minNoticeDays: number;
};

export type LeaveBalance = {
  typeId: string;
  remaining: number;
  used: number;
  pending: number;
};

export type HalfDay = 'morning' | 'afternoon';

export type LeaveTimelineEntry = {
  actor: string;
  action: 'submitted' | 'recommended' | 'approved' | 'rejected' | 'changes_requested' | 'cancelled';
  at: IsoDateTime;
  comment?: string;
};

export type LeaveRequest = {
  id: string;
  typeId: string;
  start: IsoDate;
  end: IsoDate;
  startHalf?: HalfDay;
  endHalf?: HalfDay;
  days: number;
  reason: string;
  attachmentName?: string;
  status: LeaveStatus;
  approver: string;
  timeline: readonly LeaveTimelineEntry[];
  /** Set on requests an employee raised, used by the manager inbox. */
  employeeName?: string;
  recommendation?: 'approve' | 'reject';
};

export type NotificationKind =
  | 'shift_reminder'
  | 'arrival_prompt'
  | 'checkout_reminder'
  | 'schedule_change'
  | 'flag_update'
  | 'leave_decision'
  | 'correction_result'
  | 'announcement';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: IsoDateTime;
  read: boolean;
  /** In-app route to open when tapped. */
  href?: string;
};

export type Company = { id: string; name: string };

export type UserProfile = {
  id: string;
  name: string;
  employeeId: string;
  title: string;
  branch: string;
  email: string;
  phone: string;
  role: Role;
  siteIds: readonly string[];
  managerName: string;
  managerPhone: string;
  hasSmartphone: boolean;
};
