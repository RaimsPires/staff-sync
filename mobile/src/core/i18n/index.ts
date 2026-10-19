import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { useSettings, type Language } from '@/core/settings/settings-store';

import { en } from './en';
import { fr } from './fr';

export const SUPPORTED_LANGUAGES: readonly Language[] = ['en', 'fr'];

export function detectDeviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return code === 'fr' ? 'fr' : 'en';
}

void i18next.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: useSettings.getState().language ?? detectDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

// Keep i18next in sync with the persisted preference (also fires after rehydration).
useSettings.subscribe((state, prev) => {
  if (state.language !== prev.language || state.hydrated !== prev.hydrated) {
    void i18next.changeLanguage(state.language ?? detectDeviceLanguage());
  }
});

export default i18next;
