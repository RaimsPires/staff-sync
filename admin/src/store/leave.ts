import { create } from "zustand";
import { LEAVE_REQUESTS } from "@/data/leave";
import type { LeaveLogEntry, LeaveRequest, LeaveStatus } from "@/types/leave";

export type Decision = "approve" | "reject" | "changes" | "cancel";

interface LeaveState {
  requests: LeaveRequest[];
  /** Applies a decision to one or more requests and records it in each approval trail. */
  decide: (ids: string[], decision: Decision, actor: string, comment?: string) => void;
}

const RESULT: Record<Decision, { status?: LeaveStatus; stage: LeaveRequest["stage"] }> = {
  approve: { status: "approved", stage: "done" },
  reject: { status: "rejected", stage: "no" },
  cancel: { status: "cancelled", stage: "can" },
  changes: { stage: "chg" },
};

export const useLeave = create<LeaveState>((set) => ({
  requests: LEAVE_REQUESTS,
  decide: (ids, decision, actor, comment = "") =>
    set((s) => ({
      requests: s.requests.map((r) => {
        if (!ids.includes(r.id)) return r;
        const { status, stage } = RESULT[decision];
        const entry: LeaveLogEntry = { kind: decision, who: actor, comment };
        return {
          ...r,
          status: status ?? r.status,
          stage,
          stageBy: actor,
          waitingOnMe: false,
          rejection: decision === "reject" ? comment : r.rejection,
          log: [...r.log, entry],
        };
      }),
    })),
}));

/** Pending requests inside a set of sites. */
export const pendingIn = (requests: LeaveRequest[], siteIds: string[]): LeaveRequest[] => requests.filter((r) => r.status === "pending" && siteIds.includes(r.site));
