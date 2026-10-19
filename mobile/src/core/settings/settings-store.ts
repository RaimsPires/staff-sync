import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Language = 'en' | 'fr';
export type ThemePreference = 'light' | 'dark' | 'system';

export type NotificationPrefs = {
  shiftReminders: boolean;
  /** Minutes before the shift starts. */
  reminderLeadMinutes: 15 | 30 | 60;
  arrivalPrompt: boolean;
  leaveUpdates: boolean;
};

type SettingsState = {
  /** `null` until the user picks one; the device locale is used meanwhile. */
  language: Language | null;
  theme: ThemePreference;
  notifications: NotificationPrefs;
  onboardingDone: boolean;
  hydrated: boolean;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemePreference) => void;
  setNotificationPrefs: (patch: Partial<NotificationPrefs>) => void;
  completeOnboarding: () => void;
};

/**
 * Non-sensitive preferences only. Credentials and tokens live in
 * `core/security/secure-storage` (Keychain / Keystore), never here.
 */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      language: null,
      theme: 'system',
      notifications: {
        shiftReminders: true,
        reminderLeadMinutes: 30,
        arrivalPrompt: true,
        leaveUpdates: true,
      },
      onboardingDone: false,
      hydrated: false,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setNotificationPrefs: (patch) =>
        set((s) => ({ notifications: { ...s.notifications, ...patch } })),
      completeOnboarding: () => set({ onboardingDone: true }),
    }),
    {
      name: 'staffsync.settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ language, theme, notifications, onboardingDone }) => ({
        language,
        theme,
        notifications,
        onboardingDone,
      }),
      onRehydrateStorage: () => () => useSettings.setState({ hydrated: true }),
    },
  ),
);
