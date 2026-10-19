import type { LeaveRequest, LeaveType } from "@/types/leave";

export const DAY_MS = 86_400_000;
export const TODAY_ISO = "2026-10-15";

export const parseIso = (s: string): number => {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
export const toIso = (t: number): string => new Date(t).toISOString().slice(0, 10);
/** 0 = Monday … 6 = Sunday */
export const weekdayOf = (t: number): number => (new Date(t).getUTCDay() + 6) % 7;
export const dateOfIso = (s: string): Date => new Date(parseIso(s));

export const LEAVE_TYPES: LeaveType[] = ["annual", "rtt", "sick", "family", "unpaid"];

/** Tailwind pill classes and the CSS variable used for bars, per leave type. */
export const TYPE_STYLE: Record<LeaveType, { pill: string; color: string; soft: string }> = {
  annual: { pill: "bg-info-bg text-info", color: "var(--info)", soft: "var(--info-bg)" },
  rtt: { pill: "bg-violet-bg text-violet", color: "var(--violet)", soft: "var(--violet-bg)" },
  sick: { pill: "bg-orange-bg text-orange", color: "var(--orange)", soft: "var(--orange-bg)" },
  family: { pill: "bg-ok-bg text-ok", color: "var(--ok)", soft: "var(--ok-bg)" },
  unpaid: { pill: "bg-neutral-bg text-neutral", color: "var(--neutral)", soft: "var(--neutral-bg)" },
};

export const STATUS_STYLE = {
  pending: "bg-warn-bg text-warn",
  approved: "bg-ok-bg text-ok",
  rejected: "bg-bad-bg text-bad",
  cancelled: "bg-neutral-bg text-neutral",
} as const;

export const HOLIDAY_ISO: Record<string, "allSaints" | "armistice" | "christmas"> = { "2026-11-01": "allSaints", "2026-11-11": "armistice", "2026-12-25": "christmas" };

/** Other pending or approved requests at the same site that overlap this one. */
export function overlapping(r: LeaveRequest, all: LeaveRequest[]): LeaveRequest[] {
  const f = parseIso(r.from);
  const t = parseIso(r.to);
  return all.filter((o) => o.id !== r.id && o.site === r.site && (o.status === "pending" || o.status === "approved") && parseIso(o.from) <= t && parseIso(o.to) >= f);
}

export const initialsOf = (name: string): string => name.split(" ").map((w) => w[0]).join("").slice(0, 2);
