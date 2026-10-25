import { create } from 'zustand';

/** Set when the server answers 426: this build is too old to talk to the API. */
export const useUpdateRequired = create<{ required: boolean; flag: () => void }>()((set) => ({
  required: false,
  flag: () => set({ required: true }),
}));
