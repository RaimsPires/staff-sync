export type AuditAction = "rec" | "proxy" | "flag" | "flagr" | "lvok" | "lvno" | "role" | "set" | "deact" | "emp" | "site" | "login" | "sched" | "exp";
export type AuditTargetType = "rec" | "emp" | "lv" | "role" | "set" | "site" | "user" | "sched" | "rep" | "flag";

export interface AuditEntry {
  id: string;
  /** ISO instant the change was made. */
  at: string;
  actorId: string;
  actorName: string;
  /** Role names as the server reports them. */
  actorRole: string;
  ip: string;
  device: string;
  /** The screens' category for the server action, or null when it has none (the raw text is shown then). */
  action: AuditAction | null;
  /** Readable form of the server's action, e.g. "Attendance edited". */
  actionText: string;
  targetType: AuditTargetType | null;
  /** What the change applies to (the server's target type and short id). */
  target: string;
  reason: string;
  diff: { field: string; before: string; after: string }[];
}
