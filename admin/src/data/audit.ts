import type { AuditAction, AuditTargetType } from "@/types/audit";

/** Pill classes for each action (written out so Tailwind can see them). */
const TONE = {
  info: "bg-info-bg text-info", violet: "bg-violet-bg text-violet", ok: "bg-ok-bg text-ok", bad: "bg-bad-bg text-bad",
  orange: "bg-orange-bg text-orange", warn: "bg-warn-bg text-warn", neutral: "bg-neutral-bg text-neutral",
} as const;
export const ACTION_TONES: Record<AuditAction, string> = {
  rec: TONE.info, proxy: TONE.violet, flag: TONE.ok, flagr: TONE.bad, lvok: TONE.ok, lvno: TONE.bad, role: TONE.orange,
  set: TONE.warn, deact: TONE.bad, emp: TONE.info, site: TONE.info, login: TONE.neutral, sched: TONE.violet, exp: TONE.neutral,
};
export const AUDIT_ACTIONS = Object.keys(ACTION_TONES) as AuditAction[];
export const AUDIT_TARGET_TYPES: AuditTargetType[] = ["rec", "emp", "lv", "role", "set", "site", "user", "sched", "rep", "flag"];
