import type { UncoveredIntervention, UnscheduledCheckIn } from "@/types/domain";

/** "Today" for every screen. The screens still work on a day-of-month number inside this month. */
const NOW = new Date();
export const DEMO_TODAY = NOW.getDate();
export const DEMO_YEAR = NOW.getFullYear();
export const DEMO_MONTH = NOW.getMonth(); // zero-based

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

/** Geofence health shown on each site header of the live board. */
export const FENCE_HEALTH: Record<string, "ok" | "warn" | "bad"> = { pd: "ok", cf: "ok", sd: "bad", rl: "ok", pv: "warn" };
