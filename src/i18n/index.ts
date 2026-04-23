import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { ar } from './ar';
import { fr } from './fr';

export type AppLang = 'en' | 'ar' | 'fr';

const savedLang: AppLang =
  ((typeof window !== 'undefined' && (localStorage.getItem('speeda-lang') as AppLang)) || 'en');

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    fr: { translation: fr },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

const applyDir = (lang: string) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.style.fontFamily = lang === 'ar'
    ? "'IBM Plex Sans Arabic', 'Poppins', sans-serif"
    : "'Poppins', sans-serif";
};

if (typeof window !== 'undefined') {
  applyDir(savedLang);
}

i18n.on('languageChanged', (lang) => {
  if (typeof window !== 'undefined') localStorage.setItem('speeda-lang', lang);
  applyDir(lang);
});

export default i18n;
