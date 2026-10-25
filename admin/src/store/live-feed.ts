import { create } from "zustand";

/** Which rows just changed (record id -> timestamp) and whether the board is paused. */
export const useLiveFeed = create<{ freshAt: Record<number, number>; loadedAt: number; paused: boolean; markFresh: (ids: number[]) => void; setPaused: (paused: boolean) => void }>()((set) => ({
  freshAt: {},
  loadedAt: 0,
  paused: false,
  markFresh: (ids) => set((s) => ({ freshAt: { ...s.freshAt, ...Object.fromEntries(ids.map((id) => [id, Date.now()])) } })),
  setPaused: (paused) => set({ paused }),
}));
