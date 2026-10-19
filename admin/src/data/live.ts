import type { AttendanceRecord, UncoveredIntervention, UnscheduledCheckIn } from "@/types/domain";

/** The sample "today" for every screen: Thursday 15 October 2026. */
export const DEMO_TODAY = 15;
export const DEMO_YEAR = 2026;
export const DEMO_MONTH = 9; // October, zero-based

export const UNSCHEDULED: UnscheduledCheckIn[] = [
  { id: 1, name: "Paul Mercier", site: "rl", time: "09:12" },
  { id: 2, name: "Bastien Leroy", site: "pd", time: "07:40" },
  { id: 3, name: "Zoé Fabre", site: "pv", time: "08:05" },
];

export const UNCOVERED: UncoveredIntervention[] = [
  { id: 1, site: "cf", kind: "nightSecurity", time: "09:30" },
  { id: 2, site: "sd", kind: "inventory", time: "yesterday" },
  { id: 3, site: "pd", kind: "liftInspection", time: "yesterday" },
];

/** People who check in while the dashboard stream is open (cycled). */
export const STREAM_POOL: [name: string, site: string, act: "in" | "out", method: "self" | "proxy" | "qr", status: "ontime" | "late" | "early" | "overtime"][] = [
  ["Élodie Marchand", "cf", "in", "qr", "ontime"],
  ["Nathan Petit", "sd", "in", "self", "late"],
  ["Julie Lambert", "pd", "out", "self", "overtime"],
  ["Omar Benali", "rl", "in", "self", "ontime"],
  ["Théo Garnier", "pv", "in", "proxy", "late"],
  ["Sarah Lemoine", "sd", "out", "self", "early"],
  ["Lina Chevalier", "rl", "in", "qr", "ontime"],
  ["Maxime Roche", "cf", "in", "self", "late"],
  ["Antoine Girard", "pd", "in", "self", "ontime"],
];

/** Scripted arrivals for the live board; each fires once while the board is open. */
export interface BoardEvent {
  id: number;
  site: string;
  patch: Partial<AttendanceRecord>;
  /** Raises a flag toast when present. */
  flag?: { name: string; distance: string; siteName: string };
}

export const BOARD_EVENTS: BoardEvent[] = [
  { id: 19, site: "pv", patch: { in: "10:44", method: "app", status: "late", lateBy: 14 } },
  { id: 16, site: "cf", patch: { in: "10:47", method: "qr", status: "ontime" } },
  {
    id: 17, site: "sd",
    patch: { in: "10:51", method: "app", status: "flagged", flag: "dist", dist: "286 m" },
    flag: { name: "Nathan Petit", distance: "286 m", siteName: "Saint-Denis Hub" },
  },
  { id: 18, site: "rl", patch: { in: "10:55", method: "app", status: "ontime" } },
];

/** Share of check-ins by method per site: [self, proxy, qr]. */
export const METHOD_SPLIT: Record<string, [number, number, number]> = {
  pd: [0.7, 0.14, 0.16],
  cf: [0.82, 0.06, 0.12],
  sd: [0.74, 0.08, 0.18],
  rl: [0.8, 0.05, 0.15],
  pv: [0.72, 0.16, 0.12],
};

/** Record ids shown as QR-kiosk check-ins in the stream. */
export const QR_RECORD_IDS = [5, 11];

/** Geofence health shown on each site header of the live board. */
export const FENCE_HEALTH: Record<string, "ok" | "warn" | "bad"> = { pd: "ok", cf: "ok", sd: "bad", rl: "ok", pv: "warn" };
