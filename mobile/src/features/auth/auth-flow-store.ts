import { create } from 'zustand';

import type { Session } from '@/data/repositories/types';
import type { Company } from '@/domain';

type Mode = 'phone' | 'email';

/**
 * Holds the login identifier, the typed password and a half-finished sign-in between screens in memory
 * only, so none of it appears in route URLs or persisted storage.
 */
type AuthFlow = {
  identifier: string;
  /** Kept only so "resend code" can repeat the password check; cleared as soon as the code is accepted. */
  password: string;
  /** Masked form shown on the code screen, e.g. `+225 07 •• •• 78`. */
  display: string;
  mode: Mode;
  /** The account has no password yet, so the app asks for one after the code. */
  passwordSetupRequired: boolean;
  /** Signed in with the code but waiting for the new password before entering the app. */
  pending: { session: Session; companies: Company[] } | null;
  set: (value: { identifier: string; password: string; display: string; mode: Mode; passwordSetupRequired?: boolean }) => void;
  setPending: (pending: AuthFlow['pending']) => void;
  clear: () => void;
};

export const useAuthFlow = create<AuthFlow>()((set) => ({
  identifier: '',
  password: '',
  display: '',
  mode: 'phone',
  passwordSetupRequired: false,
  pending: null,
  set: (value) => set({ passwordSetupRequired: false, ...value }),
  setPending: (pending) => set({ pending }),
  clear: () => set({ identifier: '', password: '', display: '', passwordSetupRequired: false, pending: null }),
}));
