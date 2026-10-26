import type { Org } from "@/lib/org";
import type { AttendanceRecord, Site } from "@/types/domain";

export type Tone = "ok" | "warn" | "bad";

/** One site's headcount for a given day of the sample month. */
export interface SiteDay {
  id: string;
  name: string;
  branchId: string;
  address: string;
  expected: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  flagged: number;
}

/** One site's figures for a day, counted from that day's attendance records. */
export function siteDay(site: Site, records: AttendanceRecord[]): SiteDay {
  const mine = records.filter((r) => r.site === site.id && r.status !== "holiday");
  return {
    id: site.id,
    name: site.name,
    branchId: site.branchId,
    address: site.address,
    expected: mine.length,
    present: mine.filter((r) => r.in).length,
    late: mine.filter((r) => r.status === "late").length,
    absent: mine.filter((r) => r.status === "absent").length,
    leave: mine.filter((r) => r.status === "leave").length,
    flagged: mine.filter((r) => r.flag && !r.cleared).length,
  };
}

export const sumBy = (rows: SiteDay[], key: "expected" | "present" | "late" | "absent" | "leave" | "flagged"): number =>
  rows.reduce((total, r) => total + r[key], 0);

/** Whether a rising value is good news. "neutral" never turns red or green. */
export type Polarity = "up" | "down" | "neutral";

export interface KpiDelta {
  value: number;
  direction: "up" | "down" | "flat";
  tone: "ok" | "bad" | "neutral";
}

/** Change against `previous` (yesterday); no comparison available means a flat, neutral delta. */
export function kpiDelta(value: number, previous: number | undefined, polarity: Polarity): KpiDelta {
  const delta = previous === undefined ? 0 : value - previous;
  const up = delta > 0;
  const neutral = delta === 0 || polarity === "neutral";
  const good = polarity === "up" ? up : !up;
  return { value: delta, direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat", tone: neutral ? "neutral" : good ? "ok" : "bad" };
}

/** 0 = on track, 1 = watch, 2 = at risk. */
export function siteHealth(s: Pick<SiteDay, "present" | "expected" | "flagged">): 0 | 1 | 2 {
  const p = s.present / s.expected;
  let h: 0 | 1 | 2 = p >= 0.85 ? 0 : p >= 0.8 ? 1 : 2;
  if (s.flagged && h === 0) h = 1;
  return h;
}

export interface TrendPoint {
  index: number;
  /** Day of month, kept for the chart's fallback labels. */
  day: number;
  /** `YYYY-MM-DD`. */
  iso: string;
  rate: number;
}

export interface MethodShare {
  self: number;
  proxy: number;
  qr: number;
  total: number;
}

/** Check-ins by how they were made, from the day's records. */
export function methodCounts(records: AttendanceRecord[]): MethodShare {
  let self = 0;
  let proxy = 0;
  let qr = 0;
  for (const r of records) {
    if (!r.in) continue;
    if (r.method === "behalf" || r.method === "admin") proxy++;
    else if (r.method === "qr") qr++;
    else self++;
  }
  return { self, proxy, qr, total: self + proxy + qr };
}

export interface PunctualityRow {
  key: string;
  name: string;
  branchName?: string;
  siteCount: number;
  present: number;
  late: number;
  onTimePct: number;
  latePct: number;
}

export function punctuality(rows: SiteDay[], by: "branch" | "site", org: Org): PunctualityRow[] {
  const groups =
    by === "branch"
      ? org.branches.map((b) => {
          const vs = rows.filter((r) => b.siteIds.includes(r.id));
          return { key: b.id, name: b.name, siteCount: vs.length, present: sumBy(vs, "present"), late: sumBy(vs, "late") };
        }).filter((g) => g.siteCount > 0)
      : rows.map((r) => ({
          key: r.id, name: r.name, siteCount: 1, present: r.present, late: r.late,
          branchName: org.branches.find((b) => b.id === r.branchId)?.name,
        }));
  return groups
    .map((g) => ({ ...g, onTimePct: ((g.present - g.late) / g.present) * 100, latePct: (g.late / g.present) * 100 }))
    .sort((a, b) => b.onTimePct - a.onTimePct);
}

export const punctualityTone = (onTimePct: number): Tone => (onTimePct >= 92 ? "ok" : onTimePct >= 88 ? "warn" : "bad");
