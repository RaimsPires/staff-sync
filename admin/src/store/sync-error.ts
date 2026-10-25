import { create } from "zustand";

/** Last failed background save. `SyncErrorToaster` shows it; stores set it after rolling back. */
export const useSyncError = create<{ message: string | null; report: (message: string) => void; clear: () => void }>()((set) => ({
  message: null,
  report: (message) => set({ message }),
  clear: () => set({ message: null }),
}));
