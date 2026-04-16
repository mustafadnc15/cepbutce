import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import tr from './tr.json';
import en from './en.json';

const locales = RNLocalize.getLocales();
const deviceLang = locales[0]?.languageCode ?? 'tr';
const initialLang = deviceLang === 'tr' || deviceLang === 'en' ? deviceLang : 'tr';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
