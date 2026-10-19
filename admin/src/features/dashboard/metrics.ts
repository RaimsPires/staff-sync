import type { Org } from "@/lib/org";
import { DEMO_TODAY, METHOD_SPLIT } from "@/data/live";
import type { Site } from "@/types/domain";

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

/** Past days vary around today's figures so the date picker has something to show. */
export const dayFactor = (day: number): number => (day === DEMO_TODAY ? 1 : 1 + (((day * 37) % 9) - 4) / 60);

/** `lateShift` is today's change in late arrivals caused by the grace period in Settings. */
export function siteDay(site: Site, day: number, lateShift = 0): SiteDay {
  const today = day === DEMO_TODAY;
  const vf = dayFactor(day);
  const present = today ? site.present : Math.min(site.expected, Math.round(site.present * vf));
  return {
    id: site.id,
    name: site.name,
    branchId: site.branchId,
    address: site.address,
    expected: site.expected,
    present,
    late: Math.min(present, Math.max(0, Math.round((site.late + lateShift) * (today ? 1 : vf)))),
    absent: Math.max(0, site.expected - present - site.leave),
    leave: site.leave,
    flagged: today ? site.flagged : Math.round(site.flagged * vf),
  };
}

export const sumBy = (rows: SiteDay[], key: "expected" | "present" | "late" | "absent" | "leave" | "flagged"): number =>
  rows.reduce((total, r) => total + r[key], 0);

/** Typical day-over-day change, scaled to the size of the scope. */
const KPI_DELTA = { expected: 4, present: -6, late: 3, absent: 2, leave: -1, flagged: 2, pending: 1 } as const;
export type KpiKey = keyof typeof KPI_DELTA;

/** Whether a rising value is good news. "neutral" never turns red or green. */
export type Polarity = "up" | "down" | "neutral";

export interface KpiDelta {
  value: number;
  direction: "up" | "down" | "flat";
  tone: "ok" | "bad" | "neutral";
}

export function kpiDelta(key: KpiKey, value: number, scopeExpected: number, day: number, polarity: Polarity): KpiDelta {
  const scale = scopeExpected / 198;
  let delta = Math.round(KPI_DELTA[key] * scale * dayFactor(day));
  if (delta > 0) delta = Math.min(delta, value);
  const up = delta > 0;
  const neutral = delta === 0 || polarity === "neutral";
  const good = polarity === "up" ? up : !up;
  return {
    value: delta,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    tone: neutral ? "neutral" : good ? "ok" : "bad",
  };
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
  /** Day of October (may be zero or negative for ranges reaching into September). */
  day: number;
  rate: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Smooth, deterministic attendance-rate series ending on `day`. */
export function trendSeries(rows: SiteDay[], day: number, length: number): { points: TrendPoint[]; average: number; delta: number } {
  const meanRatio = rows.reduce((a, r) => a + r.present / r.expected, 0) / Math.max(1, rows.length);
  const offset = (meanRatio - 0.86) * 40;
  const rate = (i: number) =>
    clamp(89.5 + offset + 2.6 * Math.sin((i + day) * 0.73) + 1.4 * Math.sin((i + day) * 2.1) - (i % 13 === 4 ? 3 : 0), 72, 99);
  const values = Array.from({ length }, (_, j) => rate(length - 1 - j));
  const previous = Array.from({ length }, (_, j) => rate(2 * length - 1 - j));
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    points: values.map((v, j) => ({ index: j, day: day - (length - 1 - j), rate: v })),
    average: mean(values),
    delta: mean(values) - mean(previous),
  };
}

export interface MethodShare {
  self: number;
  proxy: number;
  qr: number;
  total: number;
}

export function methodCounts(rows: SiteDay[]): MethodShare {
  const raw = [0, 0, 0];
  for (const r of rows) {
    const split = METHOD_SPLIT[r.id] ?? [1, 0, 0];
    split.forEach((share, i) => (raw[i] += r.present * share));
  }
  const total = rows.reduce((a, r) => a + r.present, 0);
  const proxy = Math.round(raw[1]);
  const qr = Math.round(raw[2]);
  return { self: Math.max(0, total - proxy - qr), proxy, qr, total };
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
