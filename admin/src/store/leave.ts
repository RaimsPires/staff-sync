import { create } from "zustand";
import { LEAVE_REQUESTS } from "@/data/leave";
import { useSyncError } from "@/store/sync-error";
import type { LeaveLogEntry, LeaveRequest, LeaveStatus } from "@/types/leave";

export type Decision = "approve" | "reject" | "changes" | "cancel";

/** One employee's balance for one leave type and year. */
export interface BalanceRow {
  /** API balance id, needed to adjust it. */
  id: string;
  entitled: number;
  adjusted: number;
  used: number;
  pending: number;
  remaining: number;
}

/** Persistence behind the store, installed once the user is signed in (see `services/leave`). */
export interface LeaveRemote {
  decide: (ids: string[], decision: Decision, comment: string) => Promise<void>;
  reload: () => Promise<void>;
}
export const leaveRemote: { current: LeaveRemote | null } = { current: null };

interface LeaveState {
  requests: LeaveRequest[];
  /** Balances keyed by `${employee name}|${leave type id}|${year}`. */
  balances: Record<string, BalanceRow>;
  /** Public holidays by `YYYY-MM-DD` with their names. */
  holidays: Record<string, string>;
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
  balances: {},
  holidays: {},
  decide: (ids, decision, actor, comment = "") => {
    const remote = leaveRemote.current;
    remote?.decide(ids, decision, comment).catch((e: unknown) => {
      useSyncError.getState().report(e instanceof Error ? e.message : "Couldn’t save the decision");
      void remote.reload();
    });
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
    }));
  },
}));

/** Pending requests inside a set of sites. */
export const pendingIn = (requests: LeaveRequest[], siteIds: string[]): LeaveRequest[] => requests.filter((r) => r.status === "pending" && siteIds.includes(r.site));
