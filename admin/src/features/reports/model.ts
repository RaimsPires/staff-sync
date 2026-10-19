import { SITES, branchOfSite } from "@/data/org";
import type { ExportKind, Frequency, GroupBy, RangeKey, ReportConfig, ReportType } from "@/types/reports";

export const DAY_MS = 864e5;
export type Unit = "h" | "d" | "n" | "min" | "%";
type Gen = (r: () => number, work: number, c: Record<string, number>) => number;
interface Col { key: string; unit: Unit; /** Totals row sums the column (otherwise it averages). */ sum: boolean; gen: Gen }
interface Spec { cols: Col[]; defaults: string[]; icon: string }

const hash = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rnd = (s: string) => (hash(s) % 1000) / 1000;

export const REPORTS: Record<ReportType, Spec> = {
  timesheet: { icon: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z", defaults: ["sch", "wrk", "ot", "days"], cols: [
    { key: "sch", unit: "h", sum: true, gen: (_r, w) => w * 8 }, { key: "wrk", unit: "h", sum: true, gen: (r, w) => w * 8 * (0.9 + r() * 0.15) },
    { key: "brk", unit: "h", sum: true, gen: (_r, w) => w * 0.5 }, { key: "ot", unit: "h", sum: true, gen: (r, w) => w * r() * 0.9 },
    { key: "days", unit: "d", sum: true, gen: (r, w) => w - (r() < 0.15 ? 1 : 0) }] },
  hours: { icon: "M4 20V10M10 20V4M16 20v-8M22 20H2", defaults: ["wrk", "sch", "var"], cols: [
    { key: "wrk", unit: "h", sum: true, gen: (r, w) => w * 8 * (0.88 + r() * 0.2) }, { key: "sch", unit: "h", sum: true, gen: (_r, w) => w * 8 },
    { key: "var", unit: "h", sum: true, gen: (_r, _w, c) => c.wrk - c.sch }, { key: "avg", unit: "h", sum: false, gen: (_r, w, c) => c.wrk / Math.max(1, w) }] },
  lateness: { icon: "M12 3v9l5 3M3 12a9 9 0 1 0 3-6.7L3 8", defaults: ["n", "min", "ot"], cols: [
    { key: "n", unit: "n", sum: true, gen: (r, w) => Math.round(w * r() * 0.35) }, { key: "min", unit: "min", sum: true, gen: (r, _w, c) => Math.round(c.n * (8 + r() * 20)) },
    { key: "avg", unit: "min", sum: false, gen: (_r, _w, c) => (c.n ? c.min / c.n : 0) }, { key: "ot", unit: "%", sum: false, gen: (_r, w, c) => Math.max(0, 100 - (c.n / Math.max(1, w)) * 100) }] },
  absences: { icon: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM18 8l4 4m0-4l-4 4", defaults: ["n", "exc", "unx"], cols: [
    { key: "n", unit: "d", sum: true, gen: (r, w) => Math.round(w * r() * 0.18) }, { key: "exc", unit: "d", sum: true, gen: (r, _w, c) => Math.round(c.n * r()) },
    { key: "unx", unit: "d", sum: true, gen: (_r, _w, c) => c.n - c.exc }, { key: "rate", unit: "%", sum: false, gen: (_r, w, c) => (c.n / Math.max(1, w)) * 100 }] },
  overtime: { icon: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM17 2l3 3", defaults: ["ot", "apr", "pen"], cols: [
    { key: "ot", unit: "h", sum: true, gen: (r, w) => w * r() * 1.1 }, { key: "apr", unit: "h", sum: true, gen: (r, _w, c) => c.ot * (0.6 + r() * 0.4) },
    { key: "pen", unit: "h", sum: true, gen: (_r, _w, c) => c.ot - c.apr }, { key: "sh", unit: "n", sum: true, gen: (r, w) => Math.round(w * r() * 0.5) }] },
  leave: { icon: "M3 6h18M3 12h18M8 3v6M16 3v6M5 21h14a2 2 0 0 0 2-2V8H3v11a2 2 0 0 0 2 2z", defaults: ["an", "rtt", "sick", "tot"], cols: [
    { key: "an", unit: "d", sum: true, gen: (r, w) => Math.round(w * r() * 0.35 * 2) / 2 }, { key: "rtt", unit: "d", sum: true, gen: (r, w) => Math.round(w * r() * 0.1 * 2) / 2 },
    { key: "sick", unit: "d", sum: true, gen: (r, w) => Math.round(w * r() * 0.1) }, { key: "fam", unit: "d", sum: true, gen: (r) => (r() < 0.15 ? 1 : 0) },
    { key: "tot", unit: "d", sum: true, gen: (_r, _w, c) => c.an + c.rtt + c.sick + c.fam }] },
  flagged: { icon: "M5 21V4M5 4h12l-2 4 2 4H5", defaults: ["n", "apr", "rej", "open"], cols: [
    { key: "n", unit: "n", sum: true, gen: (r, w) => Math.round(w * r() * 0.22) }, { key: "apr", unit: "n", sum: true, gen: (r, _w, c) => Math.round(c.n * r() * 0.6) },
    { key: "rej", unit: "n", sum: true, gen: (r, _w, c) => Math.round((c.n - c.apr) * r() * 0.7) }, { key: "open", unit: "n", sum: true, gen: (_r, _w, c) => c.n - c.apr - c.rej }] },
  site: { icon: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6", defaults: ["exp", "pres", "rate", "late"], cols: [
    { key: "exp", unit: "n", sum: true, gen: (r, w) => Math.round(w * (3 + r() * 5)) }, { key: "pres", unit: "n", sum: true, gen: (r, _w, c) => Math.round(c.exp * (0.86 + r() * 0.12)) },
    { key: "rate", unit: "%", sum: false, gen: (_r, _w, c) => (c.pres / Math.max(1, c.exp)) * 100 }, { key: "late", unit: "n", sum: true, gen: (r, _w, c) => Math.round(c.pres * r() * 0.1) },
    { key: "fl", unit: "n", sum: true, gen: (r, _w, c) => Math.round(c.pres * r() * 0.03) }] },
  proxy: { icon: "M16 11a4 4 0 1 0-8 0M12 15c-4 0-7 2-7 5M17 14l2 2 3-3", defaults: ["n", "qr", "man"], cols: [
    { key: "n", unit: "n", sum: true, gen: (r, w) => Math.round(w * r() * 0.3) }, { key: "qr", unit: "n", sum: true, gen: (r, _w, c) => Math.round(c.n * (0.4 + r() * 0.4)) },
    { key: "man", unit: "n", sum: true, gen: (_r, _w, c) => c.n - c.qr }, { key: "dl", unit: "min", sum: false, gen: (r) => 5 + r() * 25 }] },
};

export const CATEGORIES: { id: "time" | "leave" | "sites"; types: ReportType[] }[] = [
  { id: "time", types: ["timesheet", "hours", "lateness", "absences", "overtime"] },
  { id: "leave", types: ["leave"] },
  { id: "sites", types: ["site", "flagged", "proxy"] },
];

export const RANGES: Record<Exclude<RangeKey, "custom">, { from: string; to: string }> = {
  month: { from: "2026-10-01", to: "2026-10-15" }, last: { from: "2026-09-01", to: "2026-09-30" }, "7": { from: "2026-10-09", to: "2026-10-15" }, q: { from: "2026-07-01", to: "2026-09-30" },
};
export const RANGE_KEYS: RangeKey[] = ["month", "last", "7", "q", "custom"];
export const GROUPS: GroupBy[] = ["employee", "site", "branch", "day"];
export const FREQUENCIES: Frequency[] = ["daily", "weekly", "monthly"];
export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export const MONTH_DAYS = ["1", "5", "15", "last"] as const;
export const EXPORT_KINDS: ExportKind[] = ["csv", "xlsx", "pdf"];

/** People the demo reports can include, with their primary site. */
export const REPORT_PEOPLE: [string, string][] = [
  ["Amélie Fontaine", "sd"], ["Karim Benali", "rl"], ["Léa Moreau", "pd"], ["Thomas Girard", "cf"], ["Inès Haddad", "pv"], ["Paul Lambert", "sd"], ["Sofia Rossi", "rl"],
  ["Hugo Petit", "sd"], ["Nora Diallo", "cf"], ["Elena Marchand", "cf"], ["Bastien Leroy", "pv"], ["Georges Aubert", "pd"], ["Monique Vidal", "pv"], ["Marc Olivier", "sd"],
];

export const parseDay = (s: string) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };

export const defaultConfig = (type: ReportType): ReportConfig => ({
  type, range: "month", from: RANGES.month.from, to: RANGES.month.to, branches: [], sites: [], emps: [], group: "employee", cols: [...REPORTS[type].defaults],
});

export const rangeOf = (c: Pick<ReportConfig, "range" | "from" | "to">): [string, string] => (c.range === "custom" ? [c.from, c.to] : [RANGES[c.range].from, RANGES[c.range].to]);

export interface ReportData { rows: { key: string; vals: number[] }[]; cols: Col[]; days: number }

/** Builds the (sample) report rows for a configuration. */
export function computeReport(c: ReportConfig, dayLabel: (ms: number) => string, siteLabel: (id: string) => string, branchLabel: (id: string) => string): ReportData {
  const spec = REPORTS[c.type];
  const [from, to] = rangeOf(c);
  const days = from && to ? Math.max(0, Math.round((parseDay(to) - parseDay(from)) / DAY_MS) + 1) : 0;
  const cols = spec.cols.filter((x) => c.cols.includes(x.key));
  if (!days || !cols.length) return { rows: [], cols, days };

  const inSite = (id: string) => (!c.branches.length || c.branches.includes(branchOfSite(id).id)) && (!c.sites.length || c.sites.includes(id));
  let keys: [string, string][] = [];
  if (c.group === "employee") keys = REPORT_PEOPLE.filter(([n, s]) => inSite(s) && (!c.emps.length || c.emps.includes(n))).map(([n]) => [n, n]);
  else if (c.group === "site") keys = SITES.filter((s) => inSite(s.id)).map((s) => [siteLabel(s.id), s.id]);
  else if (c.group === "branch") {
    const ids = [...new Set(SITES.filter((s) => inSite(s.id)).map((s) => s.branchId))];
    keys = ids.map((id) => [branchLabel(id), id]);
  } else for (let i = 0; i < Math.min(days, 31); i++) { const d = parseDay(from) + i * DAY_MS; keys.push([dayLabel(d), String(d)]); }

  const weekdays = Math.max(1, Math.round((days * 5) / 7));
  const size = (id: string) =>
    c.group === "employee" ? 1 : c.group === "site" ? REPORT_PEOPLE.filter(([, s]) => s === id).length || 1
    : c.group === "branch" ? REPORT_PEOPLE.filter(([, s]) => branchOfSite(s).id === id).length : REPORT_PEOPLE.filter(([, s]) => inSite(s)).length;

  const rows = keys.map(([label, id]) => {
    const work = c.group === "day" ? (new Date(Number(id)).getUTCDay() % 6 === 0 ? 0 : 1) : weekdays;
    const ctx: Record<string, number> = {};
    spec.cols.forEach((col) => { ctx[col.key] = col.gen(() => rnd(c.type + id + col.key + from), work * size(id), ctx); });
    return { key: label, vals: cols.map((col) => ctx[col.key]) };
  });
  return { rows, cols, days };
}

export const formatValue = (v: number, unit: Unit) => (unit === "%" ? `${Math.round(v)}%` : String(Math.round(v * 10) / 10));
export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
