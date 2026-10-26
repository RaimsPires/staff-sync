import type { LeaveRequest } from "@/types/leave";

export const DAY_MS = 86_400_000;
/** Today as `YYYY-MM-DD` (local date). */
export const TODAY_ISO = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())).toISOString().slice(0, 10);

export const parseIso = (s: string): number => {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
export const toIso = (t: number): string => new Date(t).toISOString().slice(0, 10);
/** 0 = Monday … 6 = Sunday */
export const weekdayOf = (t: number): number => (new Date(t).getUTCDay() + 6) % 7;

export const STATUS_STYLE = {
  pending: "bg-warn-bg text-warn",
  approved: "bg-ok-bg text-ok",
  rejected: "bg-bad-bg text-bad",
  cancelled: "bg-neutral-bg text-neutral",
} as const;

/** Other pending or approved requests at the same site that overlap this one. */
export function overlapping(r: LeaveRequest, all: LeaveRequest[]): LeaveRequest[] {
  const f = parseIso(r.from);
  const t = parseIso(r.to);
  return all.filter((o) => o.id !== r.id && o.site === r.site && (o.status === "pending" || o.status === "approved") && parseIso(o.from) <= t && parseIso(o.to) >= f);
}

export const initialsOf = (name: string): string => name.split(" ").map((w) => w[0]).join("").slice(0, 2);
