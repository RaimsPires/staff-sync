import { create } from "zustand";
import { initialShifts, INITIAL_INTERVENTIONS, type OpenIntervention, type Shift } from "@/features/schedules/model";

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
    return added.map((x) => x.id);
  },
  updateShift: (id, patch) => set((s) => ({ shifts: s.shifts.map((x) => (x.id === id ? { ...x, ...patch } : x)), dirty: { ...s.dirty, [id]: true } })),
  removeShift: (id) =>
    set((s) => {
      const { [id]: wasDirty, ...dirty } = s.dirty;
      return { shifts: s.shifts.filter((x) => x.id !== id), dirty, deleted: wasDirty ? s.deleted : s.deleted + 1 };
    }),
  scheduleIntervention: (interventionId, shift) => {
    const id = get().addShift(shift);
    set((s) => ({ interventions: s.interventions.filter((i) => i.id !== interventionId) }));
    return id;
  },
  publish: () => set({ dirty: {}, deleted: 0 }),
}));
