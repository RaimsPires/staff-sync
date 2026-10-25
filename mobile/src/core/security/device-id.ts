import * as Crypto from 'expo-crypto';

import { SecureKeys, secureStorage } from './secure-storage';

/** Stable, random per-install id used to bind the account to this phone. */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await secureStorage.get(SecureKeys.deviceId);
  if (existing) return existing;
  const id = Crypto.randomUUID();
  await secureStorage.set(SecureKeys.deviceId, id);
  return id;
}
