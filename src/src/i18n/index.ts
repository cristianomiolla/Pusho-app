import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import it from './it.json';
import en from './en.json';

const resources = {
  it: { translation: it },
  en: { translation: en },
};

// Rileva la lingua del dispositivo
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

// Usa italiano se il dispositivo è in italiano, altrimenti usa inglese
const defaultLanguage = deviceLanguage === 'it' ? 'it' : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false, // React già escapa i valori
  },
});

export default i18n;
