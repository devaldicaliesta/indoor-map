import { type LanguageCode, resolveLanguage } from '@indoor/domain';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import id from './id.json';

// Satu-satunya data yang disimpan Visitor di perangkat.
const STORAGE_KEY = 'indoor-visitor.language';

function readStoredLanguage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// 'id' dipakai sampai bahasa default venue diketahui dari snapshot (applyVenueLanguage).
const initial = resolveLanguage(readStoredLanguage(), navigator.languages, 'id');

void i18next.use(initReactI18next).init({
  resources: { id: { translation: id }, en: { translation: en } },
  lng: initial,
  fallbackLng: 'id',
  interpolation: { escapeValue: false },
});

document.documentElement.lang = initial;
i18next.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

export function setLanguage(language: LanguageCode) {
  void i18next.changeLanguage(language);
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Penyimpanan diblokir: bahasa tetap berganti untuk sesi ini.
  }
}

export { i18next };

/** Bahasa default venue berlaku bila pengunjung belum memilih dan bahasa perangkat bukan ID/EN. */
export function applyVenueLanguage(venueDefault: LanguageCode) {
  const language = resolveLanguage(readStoredLanguage(), navigator.languages, venueDefault);
  if (language !== i18next.resolvedLanguage) void i18next.changeLanguage(language);
}
