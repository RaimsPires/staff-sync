import type { AlertRole } from "@/data/alerts";

/** Id of a leave type defined in Settings (built-ins: annual, rtt, sick, family, unpaid). */
export type LeaveType = string;
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

/**
 * Where a request is in the approval chain.
 * chg = changes requested, site = awaiting site manager, rec = recommended by the site manager,
 * hr = awaiting HR, done/no = decided, can = cancelled by the employee.
 */
export type LeaveStage = "chg" | "site" | "rec" | "hr" | "done" | "no" | "can";

/** What the second line under the stage shows. */
export type StageNote = "certificate" | "recommended" | "insufficient" | "shortNotice";

export interface LeaveLogEntry {
  /** done | reject | changes | cancel */
  kind: "approve" | "reject" | "changes" | "cancel";
  who: string;
  comment: string;
}

export interface LeaveRequest {
  /** "L-2041" */
  id: string;
  name: string;
  role: AlertRole;
  site: string;
  type: LeaveType;
  from: string;
  to: string;
  /** Working days requested. */
  days: number;
  /** Balance left after approval; negative when it exceeds the balance. */
  balance: number;
  attachment: boolean;
  stage: LeaveStage;
  stageBy?: string;
  /** ISO date the stage was reached or the request was cancelled. */
  stageOn?: string;
  note?: StageNote;
  /** ISO date the employee submitted the request. */
  submitted: string;
  status: LeaveStatus;
  half?: "AM" | "PM";
  /** Waiting for the current user's decision. */
  waitingOnMe: boolean;
  rejection?: string;
  /** The site manager's opinion, when one was given. */
  recommendation?: { decision: "approve" | "reject"; comment: string };
  log: LeaveLogEntry[];
}
