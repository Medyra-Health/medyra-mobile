import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import pl from './locales/pl.json';
import ru from './locales/ru.json';
import tr from './locales/tr.json';
import uk from './locales/uk.json';

const LANGUAGE_KEY = 'medyra.language';

// Language labels are shown in their own language on purpose.
// Unsupported device languages fall back to English.
export const SUPPORTED_LANGUAGES = [
  { code: 'system', label: 'System' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
] as const;

const LOCALE_CODES = ['en', 'de', 'es', 'fr', 'it', 'pl', 'tr', 'ru', 'uk'];

function deviceLanguage(): string {
  const lang = getLocales()[0]?.languageCode ?? 'en';
  return LOCALE_CODES.includes(lang) ? lang : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    es: { translation: es },
    fr: { translation: fr },
    it: { translation: it },
    pl: { translation: pl },
    tr: { translation: tr },
    ru: { translation: ru },
    uk: { translation: uk },
  },
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
