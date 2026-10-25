export type AlertTab = "flagged" | "miss" | "uns" | "unc";
export type AlertReason = "geo" | "mock" | "acc" | "tamper" | "unas" | "dev" | "miss" | "uns" | "unc";
export type Severity = "high" | "med" | "low";
export type AlertStatus = "open" | "approved" | "rejected";
export type RejectOutcome = "absent" | "invalid";

/** Translation key under `Alerts.roles`. */
export type AlertRole =
  | "machinist" | "forkliftOperator" | "cleaner" | "technician" | "electrician" | "driver" | "loader" | "welder"
  | "inspector" | "warehouseAgent" | "intervention";

export interface PreviousCheckIn {
  /** Days before today. */
  daysAgo: number;
  range: string;
  ok: boolean;
  note?: { kind: "outside"; meters: number } | { kind: "mock" };
}

export interface AlertNote {
  who: string;
  /** Free text such as "just now" or an ISO-like label. */
  when: string;
  text: string;
}

export interface AlertItem {
  id: string;
  tab: AlertTab;
  reason: AlertReason;
  /** Employee name; for uncovered interventions see `Alerts.items.<id>.title`. */
  name: string;
  role: AlertRole;
  site: string;
  /** Days before today (drives the date filter and the label). */
  days: number;
  time: string;
  /** "in 07:52" style label for missing check-outs. */
  isCheckInTime?: boolean;
  severity: Severity;
  status: AlertStatus;
  /** Distance from the site centre in meters. */
  distance: number;
  /** GPS accuracy in meters. */
  accuracy: number;
  device: string;
  registered: boolean;
  selfie: boolean;
  flagCount: number;
  phone: string;
  previous: PreviousCheckIn[];
  notes: AlertNote[];
  /** Who resolved it and the outcome, once resolved. */
  resolution?: { by: string; outcome?: RejectOutcome };
  /** Overrides the default iPhone device label. */
  deviceLabel?: string;
  /** Set on alerts that come from the API; the texts below replace the per-id demo translations. */
  real?: true;
  employeeId?: string;
  title?: string;
  slot?: string;
  description?: string;
  resolutionNote?: string;
}

/** Geofence radius used to decide whether a check-in was outside (meters, per site). */
export const FENCE_RADIUS: Record<string, number> = { pd: 150, cf: 180, sd: 200, rl: 200, pv: 160 };

const DEVICE = "iPhone 14 · iOS 17.5 · app 3.8.2";
const DEFAULT_PREVIOUS: PreviousCheckIn[] = [
  { daysAgo: 1, range: "07:58 → 16:03", ok: true },
  { daysAgo: 1, range: "07:55 → 16:10", ok: true },
  { daysAgo: 6, range: "08:02 → 16:00", ok: true },
];

function alert(
  id: string, tab: AlertTab, reason: AlertReason, name: string, role: AlertRole, site: string, time: string, days: number, severity: Severity,
  extra: Partial<AlertItem> = {},
): AlertItem {
  return {
    id, tab, reason, name, role, site, time, days, severity, status: "open", distance: 0, accuracy: 12, device: DEVICE, registered: true,
    selfie: true, flagCount: 0, phone: `+33 6 ${10 + id.length * 7 + days} 42 ${30 + days} 18`, previous: DEFAULT_PREVIOUS, notes: [], ...extra,
  };
}

export const ALERTS: AlertItem[] = [
  alert("a1", "flagged", "geo", "Amélie Fontaine", "machinist", "sd", "08:12", 0, "high", {
    distance: 620, accuracy: 14, flagCount: 3,
    previous: [{ daysAgo: 1, range: "07:58 → 16:03", ok: true }, { daysAgo: 1, range: "07:55 → 16:10", ok: true }, { daysAgo: 6, range: "08:40 → 16:00", ok: false, note: { kind: "outside", meters: 180 } }],
  }),
  alert("a2", "flagged", "mock", "Karim Benali", "forkliftOperator", "rl", "07:49", 0, "high", {
    distance: 40, accuracy: 2, flagCount: 5, device: "Pixel 7 · Android 14 · developer options on",
    previous: [{ daysAgo: 1, range: "07:45 → 15:58", ok: false, note: { kind: "mock" } }, { daysAgo: 1, range: "07:50 → 16:02", ok: false, note: { kind: "mock" } }, { daysAgo: 2, range: "07:44 → 16:00", ok: true }],
  }),
  alert("a3", "flagged", "acc", "Léa Moreau", "cleaner", "pd", "06:31", 0, "med", { distance: 90, accuracy: 180, flagCount: 1, selfie: false }),
  alert("a4", "flagged", "tamper", "Thomas Girard", "technician", "cf", "07:20", 1, "high", { distance: 60, flagCount: 2 }),
  alert("a5", "flagged", "unas", "Inès Haddad", "electrician", "pv", "09:05", 1, "med", { distance: 30 }),
  alert("a6", "flagged", "dev", "Paul Lambert", "driver", "sd", "06:58", 2, "low", { distance: 70, flagCount: 1, registered: false, device: "Galaxy A54 · Android 14 · app 3.8.0" }),
  alert("a7", "flagged", "geo", "Sofia Rossi", "loader", "rl", "14:02", 3, "med", { distance: 460, accuracy: 22, flagCount: 2 }),
  alert("a8", "flagged", "geo", "Hugo Petit", "welder", "sd", "07:41", 7, "med", { distance: 510, flagCount: 4 }),
  alert("a9", "flagged", "acc", "Nora Diallo", "inspector", "cf", "08:15", 16, "low", { distance: 120, accuracy: 95 }),
  alert("m1", "miss", "miss", "Yanis Boucher", "machinist", "sd", "07:52", 0, "med", { distance: 55, isCheckInTime: true }),
  alert("m2", "miss", "miss", "Camille Roux", "warehouseAgent", "rl", "08:01", 1, "low", { distance: 80, isCheckInTime: true }),
  alert("m3", "miss", "miss", "Mehdi Cherif", "technician", "pd", "06:02", 3, "med", { distance: 20, isCheckInTime: true }),
  alert("u1", "uns", "uns", "Elena Marchand", "cleaner", "cf", "10:02", 0, "low", { distance: 45 }),
  alert("u2", "uns", "uns", "Bastien Leroy", "driver", "pv", "13:30", 1, "med", { distance: 100 }),
  alert("u3", "uns", "uns", "Zoé Martin", "loader", "rl", "05:45", 4, "low", { distance: 30 }),
  alert("i1", "unc", "unc", "Lucas Fabre", "intervention", "pd", "14:00", 0, "high", { selfie: false }),
  alert("i2", "unc", "unc", "Rémi Colin", "intervention", "sd", "22:00", 1, "high", { selfie: false }),
  alert("i3", "unc", "unc", "Maya Perrin", "intervention", "pv", "09:00", 4, "med", { selfie: false }),
  alert("r1", "flagged", "geo", "Damien Lopez", "cleaner", "pd", "07:30", 6, "med", { status: "approved", distance: 310, flagCount: 1, resolution: { by: "Claire Vasseur" } }),
  alert("r2", "flagged", "mock", "Chloé Garnier", "technician", "cf", "08:00", 8, "high", { status: "rejected", distance: 30, accuracy: 1, flagCount: 4, resolution: { by: "Nadia Koné", outcome: "absent" } }),
  alert("r3", "miss", "miss", "Olivier Bernard", "driver", "sd", "07:44", 10, "low", { status: "approved", isCheckInTime: true, resolution: { by: "Marc Olivier" } }),
  alert("r4", "uns", "uns", "Sarah Fabre", "loader", "rl", "13:02", 14, "low", { status: "rejected", resolution: { by: "Julien Roche", outcome: "invalid" } }),
];

export const ESCALATION_ADMINS = ["Nadia Koné", "Julien Roche", "Marc Olivier"];
