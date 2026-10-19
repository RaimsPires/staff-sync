import { hashOf } from "@/features/employees/profile/profile-model";
import type { JobTitle } from "@/types/employee";
import type { ManagedSite } from "@/types/site";

export type RosterStatus = "in" | "late" | "out" | "absent" | "expected" | "flagged";

export interface RosterEntry {
  id: string;
  name: string;
  title: JobTitle;
  /** Shift start and end, minutes since midnight. */
  shiftStart: number;
  shiftEnd: number;
  status: RosterStatus;
  inMin: number | null;
  outMin: number | null;
  method: "app" | "qr" | "proxy";
  proxyBy?: string;
  /** Bearing in radians and distance as a fraction of the geofence radius. */
  angle: number;
  distance: number;
}

export const POOL: [string, JobTitle][] = [
  ["Amélie Fontaine", "machinist"], ["Karim Benali", "forkliftOperator"], ["Léa Moreau", "cleaner"], ["Thomas Girard", "technician"], ["Inès Haddad", "electrician"],
  ["Paul Lambert", "driver"], ["Sofia Rossi", "loader"], ["Hugo Petit", "machinist"], ["Nora Diallo", "inspector"], ["Yanis Boucher", "machinist"],
  ["Camille Roux", "loader"], ["Mehdi Cherif", "technician"], ["Elena Marchand", "cleaner"], ["Bastien Leroy", "driver"], ["Georges Aubert", "cleaner"], ["Monique Vidal", "cleaner"],
];

const rngOf = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** The board clock of the sample day (10:30). */
export const NOW_MINUTES = 630;

export function rosterFor(site: ManagedSite): RosterEntry[] {
  const count = Math.min(10, site.employees ? Math.max(4, Math.round(site.employees / 5)) : 0);
  const R = rngOf(hashOf(site.id));
  const start = hashOf(site.id) % POOL.length;
  const out: RosterEntry[] = [];
  for (let i = 0; i < count; i++) {
    const [name, title] = POOL[(start + i) % POOL.length];
    const kind = i % 5 === 4 ? "early" : i % 5 === 3 ? "late" : "std";
    const shiftStart = kind === "early" ? 360 : kind === "late" ? 660 : 480;
    const shiftEnd = kind === "early" ? 600 : kind === "late" ? 1140 : 960;
    let status: RosterStatus;
    let inMin: number | null = null;
    let outMin: number | null = null;
    let distance = R() * 0.7;
    const angle = R() * 6.28;
    if (shiftStart > NOW_MINUTES) status = "expected";
    else {
      const x = R();
      if (kind === "early") { status = "out"; inMin = shiftStart - 4; outMin = shiftEnd + 2; }
      else if (x < 0.7) { status = "in"; inMin = shiftStart - Math.round(R() * 10) + 3; }
      else if (x < 0.82) { status = "late"; inMin = shiftStart + 10 + Math.round(R() * 25); }
      else if (x < 0.9) { status = "flagged"; inMin = shiftStart + 2; distance = 1.5 + R() * 0.4; }
      else status = "absent";
    }
    const method = status !== "absent" && status !== "expected" && R() < 0.12 ? "qr" : "app";
    out.push({ id: `t${i}`, name, title, shiftStart, shiftEnd, status, inMin, outMin, method, angle, distance });
  }
  return out;
}

export interface HistoryRow {
  day: number;
  name: string;
  status: "in" | "late" | "absent" | "flagged";
  inMin: number | null;
  outMin: number | null;
}

export function historyFor(site: ManagedSite, roster: RosterEntry[]): HistoryRow[] {
  const R = rngOf(hashOf(`${site.id}hist`));
  const rows: HistoryRow[] = [];
  roster.slice(0, 6).forEach((t) => {
    for (let day = 15; day >= 2; day--) {
      const w = (day + 3) % 7;
      if (w === 0 || w === 6) continue;
      const x = R();
      let status: HistoryRow["status"];
      let inMin: number | null = 480 + Math.round(R() * 8) - 5;
      let outMin: number | null = 960 + Math.round(R() * 20 - 5);
      if (x < 0.78) status = "in";
      else if (x < 0.88) { status = "late"; inMin = 480 + 10 + Math.round(R() * 25); }
      else if (x < 0.94) { status = "absent"; inMin = outMin = null; }
      else status = "flagged";
      if (R() < 0.45) rows.push({ day, name: t.name, status, inMin, outMin });
    }
  });
  return rows.sort((a, b) => b.day - a.day);
}

export interface WeekCell {
  kind: "shift" | "off" | "leave" | "half";
  from?: string;
  to?: string;
}

/** One row per team member, Monday to Sunday. */
export function weekFor(site: ManagedSite, team: { name: string }[], roster: RosterEntry[]): { name: string; cells: WeekCell[] }[] {
  const R = rngOf(hashOf(`${site.id}w`));
  return team.slice(0, 10).map((m, i) => ({
    name: m.name,
    cells: Array.from({ length: 7 }, (_, d): WeekCell => {
      const x = R();
      if (d >= 5) return x < 0.2 ? { kind: "half", from: "08", to: "12" } : { kind: "off" };
      if (x < 0.07) return { kind: "leave" };
      const mins = (n: number | undefined, fb: string) => (n === undefined ? fb : String(Math.floor(n / 60)).padStart(2, "0"));
      return { kind: "shift", from: mins(roster[i]?.shiftStart, "08"), to: mins(roster[i]?.shiftEnd, "16") };
    }),
  }));
}
