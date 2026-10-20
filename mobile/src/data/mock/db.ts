import * as Device from 'expo-device';
import type {
  AppNotification,
  Assignment,
  AttendanceRecord,
  Company,
  CorrectionRequest,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  Site,
  UserProfile,
} from '@/domain';
import { toIsoDate } from '@/domain';

import type { ManagerLeaveItem, RosterEntry } from '../repositories/types';

/**
 * In-memory fake backend. Seeded relative to "today" so the app always has a live-looking
 * schedule. Replace by implementing the repository interfaces against the real API.
 */

export const delay = (ms = 220) => new Promise<void>((r) => setTimeout(r, ms));

export const MOCK_OTP = '123456';

const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};
const isWeekday = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6;
const iso = toIsoDate;

export const SITE_A: Site = {
  id: 'site-a',
  name: 'Bonanjo Tower Site',
  address: '12 Rue Joss, Bonanjo, Douala',
  center: { lat: 4.0511, lng: 9.7679 },
  geofence: { kind: 'circle', center: { lat: 4.0511, lng: 9.7679 }, radiusM: 120 },
  minAccuracyM: 40,
  requires: [],
  managerName: 'Karim Mbarga',
  managerPhone: '+237600000002',
};

export const SITE_B: Site = {
  id: 'site-b',
  name: 'Akwa Warehouse',
  address: '88 Boulevard de la Liberté, Akwa, Douala',
  center: { lat: 4.0469, lng: 9.7042 },
  geofence: {
    kind: 'polygon',
    points: [
      { lat: 4.0465, lng: 9.7038 },
      { lat: 4.0465, lng: 9.7046 },
      { lat: 4.0473, lng: 9.7046 },
      { lat: 4.0473, lng: 9.7038 },
    ],
  },
  minAccuracyM: 40,
  requires: ['qr'],
  managerName: 'Karim Mbarga',
  managerPhone: '+237600000002',
};

export const COMPANIES: Company[] = [
  { id: 'co-1', name: 'Ivoire Bâtiment', initials: 'IB', color: '#0A6AE6', role: 'employee' },
  { id: 'co-2', name: 'Sahel Logistique', initials: 'SL', color: '#0B2A52', role: 'site_manager' },
  { id: 'co-3', name: 'Café du Port', initials: 'CP', color: '#B45309', role: 'employee' },
];

type Account = { identifiers: string[]; companies: string[]; profile: UserProfile; active: boolean };

const amina: UserProfile = {
  id: 'u-amina',
  name: 'Amina Diallo',
  employeeId: 'EMP-0142',
  title: 'Site Technician',
  branch: 'Douala',
  email: 'amina@staffsync.app',
  phone: '+225 07 12 34 56 78',
  role: 'employee',
  siteIds: ['site-a', 'site-b'],
  siteNames: ['Bonanjo Tower Site', 'Akwa Warehouse'],
  managerName: 'Karim Mbarga',
  managerPhone: '+237600000002',
  hasSmartphone: true,
};

const karim: UserProfile = {
  ...amina,
  id: 'u-karim',
  name: 'Karim Mbarga',
  employeeId: 'EMP-0007',
  title: 'Site Manager',
  email: 'karim@staffsync.app',
  phone: '+225 05 46 22 11 90',
  role: 'site_manager',
  managerName: 'Sandrine Eto',
  managerPhone: '+237600000009',
};

export const ACCOUNTS: Account[] = [
  { identifiers: [amina.email, amina.phone], companies: ['co-1', 'co-2', 'co-3'], profile: amina, active: true },
  { identifiers: [karim.email, karim.phone], companies: ['co-1'], profile: karim, active: true },
  {
    identifiers: ['disabled@staffsync.app'],
    companies: ['co-1'],
    profile: { ...amina, id: 'u-off', email: 'disabled@staffsync.app' },
    active: false,
  },
];

export const SITES: Site[] = [SITE_A, SITE_B];

const now = new Date();
const today = iso(now);

function buildAssignments(): Assignment[] {
  const out: Assignment[] = [];
  for (let i = -35; i <= 21; i++) {
    const d = addDays(now, i);
    if (!isWeekday(d)) continue;
    out.push({
      id: `as-${iso(d)}`,
      type: 'shift',
      site: SITE_A,
      date: iso(d),
      start: '08:00',
      end: '17:00',
      graceMinutes: 10,
      earlyLeaveToleranceMinutes: 10,
    });
  }
  const intervention = iso(addDays(now, 3));
  out.push({
    id: 'as-intervention-1',
    type: 'intervention',
    site: SITE_B,
    date: intervention,
    start: '13:00',
    end: '16:00',
    graceMinutes: 10,
    earlyLeaveToleranceMinutes: 10,
    instructions: 'Inspect loading bay 3 and the fire exits. Bring your safety badge and helmet.',
    updatedByAdmin: true,
    previousStart: '12:00',
    attachments: [
      { name: 'Access-badge-procedure.pdf', size: '240 KB' },
      { name: 'Floor-plan.png', size: '1.1 MB' },
    ],
  });
  // Second assignment today so the Home carousel has something to swipe.
  if (isWeekday(now)) {
    out.push({
      id: 'as-today-intervention',
      type: 'intervention',
      site: SITE_B,
      date: today,
      start: '17:30',
      end: '19:00',
      graceMinutes: 10,
      earlyLeaveToleranceMinutes: 10,
      instructions: 'Evening stock count.',
    });
  }
  return out;
}

function buildHistory(): AttendanceRecord[] {
  const out: AttendanceRecord[] = [];
  let n = 0;
  for (let i = -35; i < 0; i++) {
    const d = addDays(now, i);
    if (!isWeekday(d)) continue;
    n++;
    const date = iso(d);
    const base = {
      id: `rec-${date}`,
      date,
      site: { id: SITE_A.id, name: SITE_A.name },
      scheduledStart: '08:00',
      scheduledEnd: '17:00',
      method: 'self' as const,
      flags: [],
    };
    const at = (h: number, m: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).toISOString();
    if (n % 11 === 0) {
      out.push({ ...base, status: 'absent' });
    } else if (n % 7 === 0) {
      out.push({ ...base, checkInAt: at(8, 27), checkOutAt: at(17, 3), status: 'late', lateByMinutes: 17 });
    } else if (n % 9 === 0) {
      out.push({ ...base, checkInAt: at(7, 58), status: 'missing_checkout' });
    } else if (n % 13 === 0) {
      out.push({
        ...base,
        checkInAt: at(8, 4),
        checkOutAt: at(17, 2),
        status: 'flagged',
        flags: [{ reason: 'OUTSIDE_GEOFENCE', distanceM: 420 }],
        flagOutcome: 'pending',
      });
    } else if (n % 5 === 0) {
      out.push({ ...base, checkInAt: at(7, 55), checkOutAt: at(17, 40), status: 'overtime', overtimeMinutes: 40 });
    } else {
      out.push({ ...base, checkInAt: at(7, 50 + (n % 8)), checkOutAt: at(17, 0), status: 'on_time' });
    }
  }
  return out;
}

export const LEAVE_TYPES: LeaveType[] = [
  { id: 'annual', name: { en: 'Annual leave', fr: 'Congé annuel' }, allowsHalfDay: true, requiresAttachment: false, minNoticeDays: 7 },
  { id: 'sick', name: { en: 'Sick leave', fr: 'Congé maladie' }, allowsHalfDay: false, requiresAttachment: true, minNoticeDays: 0 },
  { id: 'unpaid', name: { en: 'Unpaid leave', fr: 'Congé sans solde' }, allowsHalfDay: true, requiresAttachment: false, minNoticeDays: 3 },
];

const iso0 = (offset: number) => iso(addDays(now, offset));

function buildLeave(): LeaveRequest[] {
  return [
    {
      id: 'lv-1',
      typeId: 'annual',
      start: iso0(21),
      end: iso0(25),
      days: 5,
      reason: 'Family visit',
      status: 'approved',
      approver: 'Sandrine Eto',
      timeline: [
        { actor: 'Amina Diallo', action: 'submitted', at: addDays(now, -6).toISOString() },
        { actor: 'Karim Mbarga', action: 'recommended', at: addDays(now, -5).toISOString(), comment: 'No conflict at the site.' },
        { actor: 'Sandrine Eto', action: 'approved', at: addDays(now, -4).toISOString() },
      ],
    },
    {
      id: 'lv-2',
      typeId: 'sick',
      start: iso0(-40),
      end: iso0(-39),
      days: 2,
      reason: 'Flu',
      attachmentName: 'medical-certificate.pdf',
      status: 'approved',
      approver: 'Sandrine Eto',
      timeline: [{ actor: 'Amina Diallo', action: 'submitted', at: addDays(now, -41).toISOString() }],
    },
    {
      id: 'lv-3',
      typeId: 'annual',
      start: iso0(40),
      end: iso0(41),
      days: 2,
      reason: 'Personal matters',
      status: 'pending',
      approver: 'Karim Mbarga',
      timeline: [{ actor: 'Amina Diallo', action: 'submitted', at: addDays(now, -1).toISOString() }],
    },
    {
      id: 'lv-4',
      typeId: 'unpaid',
      start: iso0(-70),
      end: iso0(-68),
      days: 3,
      reason: 'Moving house',
      status: 'rejected',
      approver: 'Sandrine Eto',
      timeline: [
        { actor: 'Amina Diallo', action: 'submitted', at: addDays(now, -80).toISOString() },
        { actor: 'Sandrine Eto', action: 'rejected', at: addDays(now, -78).toISOString(), comment: 'Peak season, please reschedule.' },
      ],
    },
  ];
}

export const BALANCES: LeaveBalance[] = [
  { typeId: 'annual', remaining: 9, used: 8, pending: 2 },
  { typeId: 'sick', remaining: 8, used: 2, pending: 0 },
  { typeId: 'unpaid', remaining: 10, used: 0, pending: 0 },
];

function buildNotifications(): AppNotification[] {
  const ago = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();
  return [
    { id: 'n1', kind: 'shift_reminder', title: 'Shift starts soon', body: 'Bonanjo Tower Site at 08:00.', at: ago(20), read: false, href: '/' },
    { id: 'n2', kind: 'leave_decision', title: 'Leave approved', body: 'Your annual leave was approved by Sandrine Eto.', at: ago(180), read: false, href: '/leave/lv-1' },
    { id: 'n3', kind: 'schedule_change', title: 'Schedule updated', body: 'An intervention was added at Akwa Warehouse.', at: ago(300), read: false, href: '/schedule/as-intervention-1' },
    { id: 'n4', kind: 'flag_update', title: 'Check-in flagged', body: 'Your check-in could not be verified. Your admin has been notified.', at: ago(60 * 30), read: true },
    { id: 'n6', kind: 'checkout_reminder', title: "You didn't check out", body: 'No check-out was recorded for your last shift. Tap to see what to do.', at: ago(60 * 10), read: false, href: '/forgotten-checkout' },
    { id: 'n5', kind: 'announcement', title: 'Safety briefing', body: 'Monthly safety briefing on Friday at 15:00.', at: ago(60 * 52), read: true },
  ];
}

export const ROSTER_SEED: RosterEntry[] = [
  { employeeId: 'u-amina', name: 'Amina Diallo', role: 'Mason', scheduled: { start: '08:00', end: '17:00' }, status: 'not_arrived', hasSmartphone: true, phone: '+237600000001' },
  { employeeId: 'u-paul', name: 'Paul Nkeng', role: 'Foreman', scheduled: { start: '08:00', end: '17:00' }, status: 'on_time', checkInAt: '07:52', checkInMethod: 'gps', hasSmartphone: true, phone: '+237600000011' },
  { employeeId: 'u-fatou', name: 'Fatou Sow', role: 'Electrician', scheduled: { start: '08:00', end: '17:00' }, status: 'late', checkInAt: '08:34', checkInMethod: 'qr', hasSmartphone: true, phone: '+237600000012' },
  { employeeId: 'u-joseph', name: 'Joseph Atangana', role: 'Laborer', scheduled: { start: '08:00', end: '17:00' }, status: 'not_arrived', hasSmartphone: false, phone: '+237600000013' },
  { employeeId: 'u-grace', name: 'Grace Tchamba', role: 'Welder', scheduled: { start: '08:00', end: '17:00' }, status: 'flagged', checkInAt: '08:05', checkInMethod: 'gps', hasSmartphone: true, phone: '+237600000014' },
  { employeeId: 'u-ibrahim', name: 'Ibrahim Bello', role: 'Plumber', scheduled: { start: '08:00', end: '17:00' }, status: 'on_leave', hasSmartphone: true, phone: '+237600000015' },
  { employeeId: 'u-koffi', name: 'Koffi Kouassi', role: 'Driver', scheduled: { start: '06:00', end: '09:00' }, status: 'left', checkInAt: '05:52', checkOutAt: '09:02', checkInMethod: 'gps', hasSmartphone: true, phone: '+237600000016' },
  { employeeId: 'u-adjoua', name: 'Adjoua Tano', role: 'Welder', scheduled: { start: '08:00', end: '17:00' }, status: 'absent', hasSmartphone: true, phone: '+237600000017' },
];

/** Badge QR → employee, and 4-digit PINs for employees without a smartphone. */
export const BADGES: Record<string, string> = { 'badge-joseph': 'u-joseph', 'badge-paul': 'u-paul' };
export const PINS: Record<string, string> = { 'u-joseph': '4821', 'u-paul': '1357' };

export const MANAGER_LEAVE: ManagerLeaveItem[] = [
  {
    id: 'ml-1',
    typeId: 'annual',
    start: iso0(14),
    end: iso0(18),
    days: 5,
    reason: 'Wedding abroad',
    status: 'pending',
    approver: 'Karim Mbarga',
    employeeName: 'Paul Nkeng',
    employeeId: 'u-paul',
    role: 'Foreman',
    sentAt: addDays(now, -1).toISOString(),
    timeline: [{ actor: 'Paul Nkeng', action: 'submitted', at: addDays(now, -1).toISOString() }],
    others: [{ name: 'Fatou Sow', start: iso0(16), end: iso0(17), typeId: 'annual' }],
  },
  {
    id: 'ml-2',
    typeId: 'sick',
    start: iso0(1),
    end: iso0(2),
    days: 2,
    reason: 'Doctor appointment',
    attachmentName: 'note.jpg',
    status: 'pending',
    approver: 'Karim Mbarga',
    employeeName: 'Grace Tchamba',
    employeeId: 'u-grace',
    role: 'Welder',
    sentAt: addDays(now, -0.2).toISOString(),
    timeline: [{ actor: 'Grace Tchamba', action: 'submitted', at: addDays(now, -0.2).toISOString() }],
    others: [],
  },
  {
    id: 'ml-3',
    typeId: 'annual',
    start: iso0(-20),
    end: iso0(-18),
    days: 3,
    reason: '',
    status: 'approved',
    approver: 'Karim Mbarga',
    employeeName: 'Fatou Sow',
    employeeId: 'u-fatou',
    role: 'Electrician',
    sentAt: addDays(now, -30).toISOString(),
    recommendation: 'approve',
    recommendationComment: 'Covered by Paul as foreman.',
    timeline: [
      { actor: 'Fatou Sow', action: 'submitted', at: addDays(now, -30).toISOString() },
      { actor: 'Karim Mbarga', action: 'recommended', at: addDays(now, -29).toISOString(), comment: 'Covered by Paul as foreman.' },
      { actor: 'Sandrine Eto', action: 'approved', at: addDays(now, -28).toISOString() },
    ],
    others: [],
  },
  {
    id: 'ml-4',
    typeId: 'annual',
    start: iso0(-40),
    end: iso0(-37),
    days: 4,
    reason: '',
    status: 'rejected',
    approver: 'Karim Mbarga',
    employeeName: 'Koffi Kouassi',
    employeeId: 'u-koffi',
    role: 'Driver',
    sentAt: addDays(now, -50).toISOString(),
    recommendation: 'reject',
    recommendationComment: 'Delivery deadline that week.',
    timeline: [
      { actor: 'Koffi Kouassi', action: 'submitted', at: addDays(now, -50).toISOString() },
      { actor: 'Karim Mbarga', action: 'recommended', at: addDays(now, -49).toISOString(), comment: 'Delivery deadline that week.' },
      { actor: 'Sandrine Eto', action: 'rejected', at: addDays(now, -48).toISOString() },
    ],
    others: [],
  },
];

export const db = {
  assignments: buildAssignments(),
  records: [...buildHistory()],
  corrections: [] as CorrectionRequest[],
  leave: buildLeave(),
  notifications: buildNotifications(),
  roster: ROSTER_SEED.map((r) => ({ ...r })),
  managerLeave: MANAGER_LEAVE.map((r) => ({ ...r })),
  holidays: [iso0(9)],
  pinAttempts: {} as Record<string, number>,
  device: { model: Device.modelName ?? 'This phone', registeredAt: now.toISOString(), lastActiveAt: now.toISOString() },
  signedIn: null as UserProfile | null,
  deviceId: null as string | null,
  /** Server-known device id for the account (set on first registration). */
  boundDevice: null as string | null,
  otpAttempts: 0,
  today,
};
