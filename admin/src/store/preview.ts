import { create } from "zustand";

/** Access role the signed-in demo user is currently previewing, or null for their own permissions. */
export const usePreview = create<{ roleId: string | null; set: (id: string | null) => void }>((set) => ({
  roleId: null,
  set: (roleId) => set({ roleId }),
}));
