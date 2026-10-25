import { create } from "zustand";
import { useSyncError } from "@/store/sync-error";
import { initialShifts, INITIAL_INTERVENTIONS, type OpenIntervention, type Shift } from "@/features/schedules/model";

/** Persistence behind the store, installed once the user is signed in (see `services/schedule`). */
export interface ScheduleRemote {
  createShifts: (rows: Omit<Shift, "id">[], publish: boolean) => Promise<void>;
  updateShift: (id: string, patch: Partial<Shift>, current: Shift) => Promise<void>;
  removeShift: (id: string) => Promise<void>;
  scheduleIntervention: (interventionId: string, shift: Omit<Shift, "id">) => Promise<void>;
  publish: () => Promise<void>;
  reload: () => Promise<void>;
}
export const scheduleRemote: { current: ScheduleRemote | null } = { current: null };

/** Send a change to the server; when it refuses, say why and reload the real state. */
function sync(send: (r: ScheduleRemote) => Promise<void>) {
  const remote = scheduleRemote.current;
  if (!remote) return;
  send(remote).catch((e: unknown) => {
    useSyncError.getState().report(e instanceof Error ? e.message : "Couldn’t save the change");
    void remote.reload();
  });
}

interface ScheduleState {
  shifts: Shift[];
  interventions: OpenIntervention[];
  /** Shifts changed since the last publish. */
  dirty: Record<string, true>;
  /** Shifts deleted since the last publish. */
  deleted: number;
  nextId: number;
  addShift: (shift: Omit<Shift, "id">) => string;
  addMany: (shifts: Omit<Shift, "id">[], markDirty: boolean) => string[];
  updateShift: (id: string, patch: Partial<Shift>) => void;
  removeShift: (id: string) => void;
  scheduleIntervention: (interventionId: string, shift: Omit<Shift, "id">) => string;
  publish: () => void;
}

const dirtyInitial = (): Record<string, true> => Object.fromEntries(initialShifts().filter((x) => x.type === "int" && x.d >= 14).map((x) => [x.id, true as const]));

export const useSchedule = create<ScheduleState>((set, get) => ({
  shifts: initialShifts(),
  interventions: INITIAL_INTERVENTIONS,
  dirty: dirtyInitial(),
  deleted: 0,
  nextId: 1000,
  addShift: (shift) => get().addMany([shift], true)[0],
  addMany: (list, markDirty) => {
    const start = get().nextId;
    const added = list.map((x, i) => ({ ...x, id: `n${start + i}` }));
    set((s) => ({
      shifts: [...s.shifts, ...added],
      nextId: start + list.length,
      dirty: markDirty ? { ...s.dirty, ...Object.fromEntries(added.map((x) => [x.id, true as const])) } : s.dirty,
    }));
    sync((r) => r.createShifts(list, !markDirty));
    return added.map((x) => x.id);
  },
  updateShift: (id, patch) => {
    const current = get().shifts.find((x) => x.id === id);
    set((s) => ({ shifts: s.shifts.map((x) => (x.id === id ? { ...x, ...patch } : x)), dirty: { ...s.dirty, [id]: true } }));
    if (current) sync((r) => r.updateShift(id, patch, current));
  },
  removeShift: (id) => {
    set((s) => {
      const { [id]: wasDirty, ...dirty } = s.dirty;
      return { shifts: s.shifts.filter((x) => x.id !== id), dirty, deleted: wasDirty ? s.deleted : s.deleted + 1 };
    });
    sync((r) => r.removeShift(id));
  },
  scheduleIntervention: (interventionId, shift) => {
    // With a server the intervention is the schedule itself: update it instead of adding a second one.
    if (scheduleRemote.current) {
      const id = `n${get().nextId}`;
      set((s) => ({ shifts: [...s.shifts, { ...shift, id }], nextId: s.nextId + 1, interventions: s.interventions.filter((i) => i.id !== interventionId) }));
      sync((r) => r.scheduleIntervention(interventionId, shift));
      return id;
    }
    const id = get().addShift(shift);
    set((s) => ({ interventions: s.interventions.filter((i) => i.id !== interventionId) }));
    return id;
  },
  publish: () => {
    set({ dirty: {}, deleted: 0 });
    sync((r) => r.publish());
  },
}));
