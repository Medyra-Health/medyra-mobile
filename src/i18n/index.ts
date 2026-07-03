import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './locales/de.json';
import en from './locales/en.json';

const LANGUAGE_KEY = 'medyra.language';

// English and German ship first. The remaining Medyra web locales follow;
// unsupported device languages fall back to English.
export const SUPPORTED_LANGUAGES = [
  { code: 'system', label: 'System' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
] as const;

function deviceLanguage(): string {
  const lang = getLocales()[0]?.languageCode ?? 'en';
  return ['en', 'de'].includes(lang) ? lang : 'en';
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnObjects: true,
});

/** Loads a stored language override, if any. Call once at startup. */
export async function loadStoredLanguage() {
  try {
    const stored = await SecureStore.getItemAsync(LANGUAGE_KEY);
    if (stored && stored !== 'system' && stored !== i18n.language) {
      await i18n.changeLanguage(stored);
    }
  } catch {
    // device language stays active
  }
}

export async function setLanguage(code: string) {
  try {
    await SecureStore.setItemAsync(LANGUAGE_KEY, code);
  } catch {
    // preference simply not persisted
  }
  await i18n.changeLanguage(code === 'system' ? deviceLanguage() : code);
}

export async function getStoredLanguage(): Promise<string> {
  try {
    return (await SecureStore.getItemAsync(LANGUAGE_KEY)) ?? 'system';
  } catch {
    return 'system';
  }
}

export default i18n;
