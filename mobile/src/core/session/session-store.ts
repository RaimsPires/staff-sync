import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import { repos, type Session } from '@/data';
import type { Company, UserProfile } from '@/domain';
import { SecureKeys, secureStorage } from '@/core/security/secure-storage';

type Status = 'restoring' | 'signed_out' | 'needs_company' | 'needs_setup' | 'signed_in';

type SessionState = {
  status: Status;
  user: UserProfile | null;
  companies: Company[];
  restore: () => Promise<void>;
  /** Called after OTP verification. */
  begin: (session: Session, companies: Company[]) => Promise<void>;
  chooseCompany: (companyId: string) => Promise<void>;
  completeSetup: () => void;
  signOut: () => Promise<void>;
};

const SETUP_FLAG = 'staffsync.setup-done';

async function persist(session: Session) {
  // Only tokens go to the Keychain/Keystore; the profile is re-fetched on restore.
  await secureStorage.set(SecureKeys.session, JSON.stringify({ a: session.accessToken, r: session.refreshToken }));
}

/** Stable, random per-install id used to bind the account to this phone. */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await secureStorage.get(SecureKeys.deviceId);
  if (existing) return existing;
  const id = Crypto.randomUUID();
  await secureStorage.set(SecureKeys.deviceId, id);
  return id;
}

export const useSession = create<SessionState>()((set) => ({
  status: 'restoring',
  user: null,
  companies: [],

  async restore() {
    const tokens = await secureStorage.get(SecureKeys.session);
    if (!tokens) return set({ status: 'signed_out' });
    try {
      const user = await repos.profile.get();
      const setupDone = (await secureStorage.get(SETUP_FLAG)) === '1';
      set({ user, status: setupDone ? 'signed_in' : 'needs_setup' });
    } catch {
      await secureStorage.remove(SecureKeys.session);
      set({ status: 'signed_out', user: null });
    }
  },

  async begin(session, companies) {
    await persist(session);
    set({ user: session.user, companies, status: companies.length > 1 ? 'needs_company' : 'needs_setup' });
    if (companies.length <= 1 && (await secureStorage.get(SETUP_FLAG)) === '1') set({ status: 'signed_in' });
  },

  async chooseCompany(companyId) {
    const session = await repos.auth.selectCompany(companyId);
    await persist(session);
    const setupDone = (await secureStorage.get(SETUP_FLAG)) === '1';
    set({ user: session.user, status: setupDone ? 'signed_in' : 'needs_setup' });
  },

  completeSetup() {
    void secureStorage.set(SETUP_FLAG, '1');
    set({ status: 'signed_in' });
  },

  async signOut() {
    await repos.auth.logout().catch(() => undefined);
    // Keep the device id: the account stays bound to this phone.
    await secureStorage.remove(SecureKeys.session);
    await secureStorage.remove(SETUP_FLAG);
    set({ status: 'signed_out', user: null, companies: [] });
  },
}));
