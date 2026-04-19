import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import tr from './tr.json';
import en from './en.json';
import { storage } from '../stores/mmkv';

// Read the persisted language choice synchronously from MMKV. We do this
// before useSettingsStore rehydrates so the first paint is in the right
// language — otherwise the user sees a flash of device-locale copy.
function readPersistedLanguage(): 'tr' | 'en' | null {
  try {
    const raw = storage.getString('settings');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const lang = parsed?.state?.language;
    return lang === 'tr' || lang === 'en' ? lang : null;
  } catch {
    return null;
  }
}

const persisted = readPersistedLanguage();
const locales = RNLocalize.getLocales();
const deviceLang = locales[0]?.languageCode ?? 'tr';
const deviceFallback = deviceLang === 'tr' || deviceLang === 'en' ? deviceLang : 'tr';
const initialLang = persisted ?? deviceFallback;

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'tr',
  compatibilityJSON: 'v4',
  interpolation: { escapeValue: false },
});

export default i18n;
