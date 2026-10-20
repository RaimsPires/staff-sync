import { create } from 'zustand';

type Mode = 'phone' | 'email';

/**
 * Holds the login identifier between screens in memory only,
 * so phone numbers / emails never appear in route URLs or persisted storage.
 */
type AuthFlow = {
  identifier: string;
  /** Masked form shown on the code screen, e.g. `+225 07 •• •• 78`. */
  display: string;
  mode: Mode;
  set: (value: { identifier: string; display: string; mode: Mode }) => void;
  clear: () => void;
};

export const useAuthFlow = create<AuthFlow>()((set) => ({
  identifier: '',
  display: '',
  mode: 'phone',
  set: (value) => set(value),
  clear: () => set({ identifier: '', display: '' }),
}));
