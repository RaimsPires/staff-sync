import type { AuditActor, AuditActorId, AuditEntry, AuditAction, AuditTargetType } from "@/types/audit";

export const AUDIT_ACTORS: AuditActor[] = [
  { id: "cv", name: "Claire Vasseur", role: "admin", ip: "92.184.61.14", device: "Chrome · macOS" },
  { id: "mo", name: "Marc Olivier", role: "branch", ip: "86.241.9.203", device: "Safari · iPhone" },
  { id: "nk", name: "Nadia Koné", role: "branch", ip: "90.12.75.118", device: "Chrome · Windows" },
  { id: "jr", name: "Julien Roche", role: "admin", ip: "88.164.30.71", device: "Edge · Windows" },
  { id: "sb", name: "Sarah Benoît", role: "site", ip: "82.65.140.9", device: "Chrome · Android" },
  { id: "hm", name: "Hugo Martel", role: "site", ip: "78.192.4.55", device: "Firefox · Linux" },
  { id: "lp", name: "Lucie Perrin", role: "payroll", ip: "92.184.61.40", device: "Chrome · Windows" },
];

/** Pill classes for each action (written out so Tailwind can see them). */
const TONE = {
  info: "bg-info-bg text-info", violet: "bg-violet-bg text-violet", ok: "bg-ok-bg text-ok", bad: "bg-bad-bg text-bad",
  orange: "bg-orange-bg text-orange", warn: "bg-warn-bg text-warn", neutral: "bg-neutral-bg text-neutral",
} as const;
export const ACTION_TONES: Record<AuditAction, string> = {
  rec: TONE.info, proxy: TONE.violet, flag: TONE.ok, flagr: TONE.bad, lvok: TONE.ok, lvno: TONE.bad, role: TONE.orange,
  set: TONE.warn, deact: TONE.bad, emp: TONE.info, site: TONE.info, login: TONE.neutral, sched: TONE.violet, exp: TONE.neutral,
};
export const AUDIT_ACTIONS = Object.keys(ACTION_TONES) as AuditAction[];
export const AUDIT_TARGET_TYPES: AuditTargetType[] = ["rec", "emp", "lv", "role", "set", "site", "user", "sched", "rep", "flag"];

const e = (daysAgo: number, time: string, actor: AuditActorId, action: AuditAction, targetType: AuditTargetType, target: string, site: string, reason = "", diff: [string, string, string][] = []): Omit<AuditEntry, "id"> =>
  ({ daysAgo, time, actor, action, targetType, target, site, reason, diff: diff.map(([field, before, after]) => ({ field, before, after })) });

const SEEDS = [
  e(0, "09:41", "jr", "rec", "rec", "Amélie Fontaine · 15 Oct", "sd", "Employee forgot to check out; confirmed by site manager.", [["Check-out", "—", "16:04"], ["Status", "Missing check-out", "Present"]]),
  e(0, "09:12", "mo", "proxy", "rec", "Karim Benali · 15 Oct", "rl", "Phone battery dead on arrival.", [["Check-in", "—", "07:52 (proxy)"]]),
  e(0, "08:30", "cv", "role", "role", "Payroll officer", "", "Added export permission for monthly payroll.", [["Export", "No", "Yes"], ["Scope", "Selected branches", "Whole company"]]),
  e(0, "08:05", "nk", "flag", "flag", "Outside geofence · Léa Moreau", "pd", "Employee was at a supplier delivery next door.", [["Status", "Open", "Approved"], ["Distance", "420 m", "420 m (accepted)"]]),
  e(1, "17:48", "sb", "lvok", "lv", "L-2045 · Inès Haddad", "pv", "", [["Status", "Pending", "Approved"]]),
  e(1, "16:20", "cv", "set", "set", "Default geofence radius", "", "Align with updated insurance requirements.", [["Radius", "150 m", "200 m"]]),
  e(1, "14:02", "jr", "deact", "emp", "Damien Lopez", "pd", "Contract ended on 30 Sept.", [["Status", "Active", "Deactivated"], ["Device binding", "iPhone 12", "Reset"]]),
  e(1, "11:37", "hm", "rec", "rec", "Thomas Girard · 14 Oct", "cf", "Corrected start time after clock sync issue.", [["Check-in", "07:20", "07:41"], ["Flag", "Time tampering", "None"]]),
  e(2, "18:15", "mo", "sched", "sched", "Week 43 · Saint-Denis Hub", "sd", "", [["Shifts", "41", "44"]]),
  e(2, "15:09", "cv", "flagr", "flag", "Mock location · Chloé Garnier", "cf", "Device audit confirmed location spoofing.", [["Status", "Open", "Rejected"], ["Outcome", "—", "Marked absent"]]),
  e(2, "10:44", "nk", "lvno", "lv", "L-2021 · Yanis Boucher", "sd", "Two machinists already off that day.", [["Status", "Pending", "Rejected"]]),
  e(3, "09:02", "cv", "site", "site", "Roissy Logistics", "rl", "", [["Selfie required", "No", "Yes"], ["Min GPS accuracy", "100 m", "50 m"]]),
  e(3, "08:45", "lp", "exp", "rep", "Monthly timesheets – all sites", "", ""),
  e(4, "17:03", "jr", "role", "role", "Site manager", "", "Remove ability to approve leave.", [["Leave approval", "Approve", "—"]]),
  e(4, "13:26", "mo", "emp", "emp", "Paul Lambert", "sd", "Moved to a different primary site.", [["Default site", "Saint-Denis Hub", "Roissy Logistics"]]),
  e(4, "09:10", "sb", "proxy", "rec", "Monique Vidal · 11 Oct", "pv", "No smartphone — badge QR scanned at entrance.", [["Check-in", "—", "06:58 (proxy)"]]),
  e(5, "16:55", "cv", "set", "set", "Lateness grace period", "", "Union agreement update.", [["Grace period", "5 min", "10 min"]]),
  e(5, "08:21", "hm", "login", "user", "Hugo Martel", ""),
  e(6, "11:12", "nk", "flag", "flag", "Low GPS accuracy · Nora Diallo", "cf", "Underground car park, accuracy expected.", [["Status", "Open", "Approved"]]),
  e(7, "10:30", "jr", "deact", "emp", "Chloé Garnier", "cf", "Terminated after mock location confirmation.", [["Status", "Active", "Deactivated"]]),
  e(8, "15:40", "cv", "rec", "rec", "Elena Marchand · 8 Oct", "cf", "Duplicate check-in removed.", [["Records", "2", "1"]]),
  e(9, "09:05", "mo", "lvok", "lv", "L-2032 · Amélie Fontaine", "sd", "", [["Status", "Pending", "Approved"]]),
  e(10, "14:18", "cv", "role", "role", "Read-only viewer", "", "", [["Reports", "No", "View"]]),
  e(12, "12:00", "jr", "emp", "emp", "Sofia Rossi", "rl", "Phone number changed.", [["Phone", "06 55 41 09 26", "06 55 41 22 80"]]),
  e(14, "08:58", "nk", "proxy", "rec", "Georges Aubert · 1 Oct", "pd", "Badge scan.", [["Check-in", "—", "07:03 (proxy)"]]),
  e(18, "16:34", "cv", "set", "set", "Company timezone", "", "", [["Timezone", "Europe/London", "Europe/Paris"]]),
  e(21, "10:10", "jr", "site", "site", "Part-Dieu Tower", "pd", "", [["Geofence radius", "120 m", "150 m"]]),
  e(26, "09:25", "cv", "role", "role", "Branch manager", "", "New default permissions.", [["Fraud alerts", "View", "View, Approve"]]),
];

export const AUDIT_ENTRIES: AuditEntry[] = SEEDS.map((s, i) => ({ id: `AL-${48210 - i}`, ...s }));
