export type AuditAction = "rec" | "proxy" | "flag" | "flagr" | "lvok" | "lvno" | "role" | "set" | "deact" | "emp" | "site" | "login" | "sched" | "exp";
export type AuditTargetType = "rec" | "emp" | "lv" | "role" | "set" | "site" | "user" | "sched" | "rep" | "flag";
export type AuditActorId = "cv" | "mo" | "nk" | "jr" | "sb" | "hm" | "lp";

export interface AuditActor { id: AuditActorId; name: string; role: "admin" | "branch" | "site" | "payroll"; ip: string; device: string }

export interface AuditEntry {
  id: string;
  /** Days before the demo "today". */
  daysAgo: number;
  time: string;
  actor: AuditActorId;
  action: AuditAction;
  targetType: AuditTargetType;
  target: string;
  /** Site the change applies to; empty for company-wide changes. */
  site: string;
  reason: string;
  diff: { field: string; before: string; after: string }[];
}
