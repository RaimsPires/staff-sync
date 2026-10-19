import * as SecureStore from 'expo-secure-store';

/**
 * Thin wrapper over Keychain (iOS) / Keystore (Android).
 * Anything sensitive (tokens, device id) must go through here, never AsyncStorage.
 */
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key, OPTIONS);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): Promise<void> {
    return SecureStore.setItemAsync(key, value, OPTIONS);
  },
  remove(key: string): Promise<void> {
    return SecureStore.deleteItemAsync(key, OPTIONS);
  },
};

export const SecureKeys = {
  session: 'staffsync.session',
  deviceId: 'staffsync.device-id',
} as const;
