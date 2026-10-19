import { create } from "zustand";
import type { LogEntry } from "@/features/employees/profile/manage-tabs";
import type { LeaveKey, RecurringSchedule } from "@/features/employees/profile/profile-model";

export interface ProfileDoc { name: string; meta: string }
export interface ProfileNote { who: string; when: string; text: string }

/** What an admin changed on one employee's profile. Missing fields mean "still the defaults". */
export interface Workspace {
  schedules?: RecurringSchedule[];
  adjustments: Partial<Record<LeaveKey, number>>;
  unbound: boolean;
  log: LogEntry[];
  docs?: ProfileDoc[];
  notes?: ProfileNote[];
}

export const EMPTY_WORKSPACE: Workspace = { adjustments: {}, unbound: false, log: [] };

interface State {
  byId: Record<string, Workspace>;
  patch: (id: string, change: (w: Workspace) => Partial<Workspace>) => void;
}

/** Kept in a store so the schedule, leave, device, documents, notes and activity tabs survive leaving the page. */
export const useWorkspaces = create<State>((set) => ({
  byId: {},
  patch: (id, change) => set((s) => {
    const current = s.byId[id] ?? EMPTY_WORKSPACE;
    return { byId: { ...s.byId, [id]: { ...current, ...change(current) } } };
  }),
}));

export const useWorkspace = (id: string) => useWorkspaces((s) => s.byId[id] ?? EMPTY_WORKSPACE);
