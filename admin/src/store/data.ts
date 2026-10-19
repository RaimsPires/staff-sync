import { create } from "zustand";
import { HISTORY, RECORDS } from "@/data/records";
import type { AttendanceRecord, HistoryEntry, RecordNote } from "@/types/domain";

interface DataState {
  /** Today's records (Thu 15 Oct). */
  today: AttendanceRecord[];
  /** 1–14 Oct plus manual records. */
  history: AttendanceRecord[];
  /** "Needs attention" items already handled in this session. */
  handled: Record<string, true>;
  /** Edits and notes added during this session, per record id. */
  recordHistory: Record<number, HistoryEntry[]>;
  recordNotes: Record<number, RecordNote[]>;
  addHistory: (id: number, entry: HistoryEntry) => void;
  addNote: (id: number, note: RecordNote) => void;
  updateRecord: (id: number, patch: Partial<AttendanceRecord>) => void;
  addRecord: (record: AttendanceRecord) => void;
  removeRecord: (id: number) => void;
  markHandled: (key: string) => void;
}

const patchIn = (list: AttendanceRecord[], id: number, patch: Partial<AttendanceRecord>) =>
  list.map((r) => (r.id === id ? { ...r, ...patch } : r));

/**
 * Session-wide mock data shared by all screens. Mutations stay in memory; the services layer
 * replaces this with API calls and cache invalidation once the backend is wired.
 */
export const useData = create<DataState>((set) => ({
  today: RECORDS,
  history: HISTORY,
  handled: {},
  recordHistory: {},
  recordNotes: {},
  addHistory: (id, entry) => set((s) => ({ recordHistory: { ...s.recordHistory, [id]: [...(s.recordHistory[id] ?? []), entry] } })),
  addNote: (id, note) => set((s) => ({ recordNotes: { ...s.recordNotes, [id]: [...(s.recordNotes[id] ?? []), note] } })),
  updateRecord: (id, patch) =>
    set((s) => (id >= 1000 ? { history: patchIn(s.history, id, patch) } : { today: patchIn(s.today, id, patch) })),
  addRecord: (record) => set((s) => ({ history: [record, ...s.history] })),
  removeRecord: (id) =>
    set((s) => ({ today: s.today.filter((r) => r.id !== id), history: s.history.filter((r) => r.id !== id) })),
  markHandled: (key) => set((s) => ({ handled: { ...s.handled, [key]: true } })),
}));
