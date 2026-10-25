import type {
  AppNotification,
  Assignment,
  AttendanceRecord,
  AttendanceStatus,
  Company,
  CorrectionKind,
  CorrectionRequest,
  Flag,
  HalfDay,
  IsoDate,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  LeaveWarning,
  UserProfile,
} from '@/domain';

/** Domain-level failure the UI can map to a translated message. */
export class AppError extends Error {
  constructor(
    public readonly code:
      | 'ACCOUNT_NOT_FOUND'
      | 'ACCOUNT_DISABLED'
      | 'OTP_INVALID'
      | 'OTP_EXPIRED'
      | 'OTP_LOCKED'
      | 'INVALID_CREDENTIALS'
      | 'PASSWORD_REQUIRED'
      | 'ACCOUNT_LOCKED'
      | 'DEVICE_BOUND'
      | 'PIN_INVALID'
      | 'PIN_LOCKED'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'UNSCHEDULED'
      | 'VALIDATION',
    public readonly meta?: { attemptsLeft?: number; company?: string },
  ) {
    super(code);
  }
}

export type Session = { accessToken: string; refreshToken: string; user: UserProfile };

export interface AuthRepository {
  /** Checks the password (once the account has one) and sends a one-time code, by e-mail when the account has an address. */
  requestOtp(identifier: string, password?: string): Promise<{ passwordSetupRequired: boolean }>;
  /** Returns companies to choose from when the account belongs to several; `needsPassword` when the account has no password yet. */
  verifyOtp(identifier: string, code: string): Promise<{ companies: Company[]; session: Session; needsPassword: boolean }>;
  /** First password of an account created without one. */
  setInitialPassword(newPassword: string): Promise<void>;
  selectCompany(companyId: string): Promise<Session>;
  registerDevice(deviceId: string): Promise<void>;
  logout(): Promise<void>;
}

export type GeoPoint = { lat: number; lng: number; accuracyM: number; mocked: boolean; capturedAt: string };

export type CheckEvent = {
  /** Idempotency key generated on the phone, also used for offline sync de-duplication. */
  clientEventId: string;
  type: 'check_in' | 'check_out';
  assignmentId: string;
  position: GeoPoint;
  method: 'self' | 'qr';
  selfieUri?: string;
  qrPayload?: string;
  /** Check-out: reason for leaving early. Check-in: nothing. */
  note?: string;
  /** User chose "check in anyway" for an unscheduled site. */
  acceptUnscheduled?: boolean;
};

export type CheckResult = { record: AttendanceRecord; flags: Flag[] };

export type MonthSummary = {
  present: number;
  late: number;
  absent: number;
  hoursWorked: number;
  leaveDays: number;
  overtimeHours: number;
};

export type CorrectionInput = {
  recordId: string;
  kind: CorrectionKind;
  proposedTime?: string;
  comment: string;
  attachmentName?: string;
  attachmentUri?: string;
  attachmentType?: string;
};

export interface AttendanceRepository {
  getMonth(month: string): Promise<{ records: AttendanceRecord[]; summary: MonthSummary }>;
  getRecord(id: string): Promise<AttendanceRecord>;
  /** Today's record for one assignment, or `null` before check-in. */
  getForAssignment(assignmentId: string): Promise<AttendanceRecord | null>;
  getWeekSummary(): Promise<{ present: number; late: number; hoursWorked: number; scheduledDays: number }>;
  checkIn(event: CheckEvent): Promise<CheckResult>;
  checkOut(event: CheckEvent): Promise<CheckResult>;
  /** Replays offline events; one result per `clientEventId`. */
  sync(events: readonly CheckEvent[]): Promise<Record<string, CheckResult | AppError>>;
  addComment(recordId: string, comment: string): Promise<void>;
  requestCorrection(input: CorrectionInput): Promise<CorrectionRequest>;
  listCorrections(recordId: string): Promise<CorrectionRequest[]>;
}

export interface ScheduleRepository {
  getRange(from: IsoDate, to: IsoDate): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment>;
  /** Assignments for today, ordered by start time. */
  getToday(): Promise<Assignment[]>;
  getHolidays(from: IsoDate, to: IsoDate): Promise<IsoDate[]>;
  /** Approved leave ranges that intersect the window. */
  getApprovedLeave(from: IsoDate, to: IsoDate): Promise<{ start: IsoDate; end: IsoDate; typeId: string }[]>;
}

export type LeaveDraft = {
  typeId: string;
  start: IsoDate;
  end: IsoDate;
  startHalf?: HalfDay;
  endHalf?: HalfDay;
  reason: string;
  attachmentName?: string;
  /** Local file picked for the request; uploaded when it is sent. */
  attachmentUri?: string;
  attachmentType?: string;
};

export type LeavePreview = { days: number; remainingAfter: number; warnings: LeaveWarning[]; reviewer: string };

export interface LeaveRepository {
  getTypes(): Promise<LeaveType[]>;
  getBalances(year: number): Promise<LeaveBalance[]>;
  list(): Promise<LeaveRequest[]>;
  get(id: string): Promise<LeaveRequest>;
  preview(draft: LeaveDraft): Promise<LeavePreview>;
  submit(draft: LeaveDraft): Promise<LeaveRequest>;
  update(id: string, draft: LeaveDraft): Promise<LeaveRequest>;
  cancel(id: string, reason?: string): Promise<LeaveRequest>;
}

export interface NotificationRepository {
  list(): Promise<AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface ProfileRepository {
  get(): Promise<UserProfile>;
  /** Raised with the admin, who resets it. */
  getDevice(): Promise<{ model: string; registeredAt: string; lastActiveAt: string }>;
  /** `false` when another phone is bound to the account. */
  isDeviceRegistered(): Promise<boolean>;
  /** Hand this phone's push token to the API so it can notify the employee. */
  registerPushToken(): Promise<void>;
  /** A fresh link to the profile photo, or null when there is none (links expire, so ask each time). */
  getPhotoUrl(): Promise<string | null>;
  /** Upload a new profile photo from a local file, or remove it with null. */
  setPhoto(uri: string | null): Promise<void>;
}

export type RosterEntry = {
  employeeId: string;
  name: string;
  scheduled: { start: string; end: string };
  checkInAt?: string;
  checkOutAt?: string;
  status: AttendanceStatus | 'not_arrived' | 'left';
  hasSmartphone: boolean;
  phone: string;
  note?: string;
  role?: string;
  checkInMethod?: 'gps' | 'qr' | 'manager';
  /** Change made offline and not yet synced. */
  queued?: boolean;
};

export type ManagerSite = { id: string; name: string; address: string; expected: number };

export type ManagerSummary = {
  expected: number;
  present: number;
  notArrived: number;
  left: number;
  absent: number;
  onLeave: number;
  flagged: number;
  /** Leave requests still waiting for this manager's recommendation. */
  pendingLeave: number;
  alerts: ManagerAlert[];
};

export type ManagerAlert = {
  id: string;
  kind: 'late' | 'flag' | 'missing_checkout' | 'leave_request';
  employeeId?: string;
  name?: string;
  phone?: string;
  /** `HH:mm` of the event, when there is one. */
  time?: string;
  count?: number;
};

/** A leave request in the manager inbox, with what the manager needs to decide. */
export type ManagerLeaveItem = LeaveRequest & {
  employeeId: string;
  role?: string;
  sentAt: string;
  /** Colleagues off on overlapping dates. */
  others: { name: string; start: IsoDate; end: IsoDate; typeId: string }[];
};

export type ProxyInput = {
  /** Idempotency key; reuse it when the same action is retried or replayed. */
  clientEventId?: string;
  /** Site the check is made at (the manager's current site). */
  siteId?: string;
  employeeId?: string;
  badgeToken?: string;
  pin?: string;
  /** Employee photo taken by the manager as an alternative to the PIN. */
  photoUri?: string;
  note?: string;
  managerPosition: GeoPoint;
  type: 'check_in' | 'check_out';
  acceptUnscheduled?: boolean;
};

export interface ManagerRepository {
  getSites(): Promise<ManagerSite[]>;
  getSummary(siteId: string): Promise<ManagerSummary>;
  getRoster(siteId: string): Promise<RosterEntry[]>;
  findByBadge(token: string, siteId?: string): Promise<RosterEntry>;
  /** Checks the employee's PIN ahead of the check; counts failed attempts. */
  verifyPin(employeeId: string, pin: string): Promise<void>;
  proxyCheck(input: ProxyInput): Promise<{ entry: RosterEntry; flags: Flag[] }>;
  addNote(employeeId: string, note: string): Promise<void>;
  leaveInbox(siteId: string): Promise<ManagerLeaveItem[]>;
  /** The employee's scheduled shifts inside a date range (what a leave request would remove). */
  employeeShifts(employeeId: string, start: IsoDate, end: IsoDate): Promise<{ date: IsoDate; start: string; end: string }[]>;
  recommend(id: string, decision: 'approve' | 'reject', comment: string): Promise<void>;
}
