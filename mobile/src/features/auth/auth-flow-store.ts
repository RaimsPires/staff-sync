import { create } from 'zustand';

/**
 * Holds the identifier between the login and OTP screens in memory only,
 * so phone numbers / emails never appear in route URLs or persisted storage.
 */
type AuthFlow = { identifier: string; set: (identifier: string) => void; clear: () => void };

export const useAuthFlow = create<AuthFlow>()((set) => ({
  identifier: '',
  set: (identifier) => set({ identifier }),
  clear: () => set({ identifier: '' }),
}));
