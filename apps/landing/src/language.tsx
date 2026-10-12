import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { COPY, type Copy, type Language } from './copy';

// Data yang disimpan landing di perangkat hanya pilihan bahasa dan tema (theme.tsx).
const STORAGE_KEY = 'panduarah-landing.language';

function stored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** `?lang=` lebih dulu (tautan berbahasa), lalu pilihan tersimpan, lalu bahasa peramban. */
export function initialLanguage(): Language {
  const query = new URLSearchParams(window.location.search).get('lang');
  if (query === 'id' || query === 'en') return query;
  const saved = stored();
  if (saved === 'id' || saved === 'en') return saved;
  const browser = navigator.languages?.[0] ?? navigator.language ?? 'id';
  return browser.toLowerCase().startsWith('id') || !browser.toLowerCase().startsWith('en')
    ? 'id'
    : 'en';
}

interface LanguageState {
  language: Language;
  copy: Copy;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setState] = useState<Language>(initialLanguage);
  const copy = COPY[language];
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  function setLanguage(next: Language) {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Penyimpanan diblokir: bahasa tetap berganti untuk sesi ini.
    }
  }
  return <LanguageContext value={{ language, copy, setLanguage }}>{children}</LanguageContext>;
}

export function useLanguage(): LanguageState {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage di luar LanguageProvider');
  return value;
}

/** Judul dokumen dan deskripsi meta mengikuti bahasa. */
export function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description]);
}
