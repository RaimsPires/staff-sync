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

export const ESCALATION_ADMINS = ["Nadia Koné", "Julien Roche", "Marc Olivier"];
