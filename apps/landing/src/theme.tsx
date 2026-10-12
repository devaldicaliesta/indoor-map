import { Button } from '@indoor/ui';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from './language';

type Theme = 'light' | 'dark';

// Disimpan di perangkat bersama pilihan bahasa (kebijakan privasi). Nilai awal sudah dipasang
// skrip kecil di <head> setiap halaman HTML sebelum halaman digambar, agar tidak berkedip.
const STORAGE_KEY = 'panduarah-landing.theme';

function saved(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)');

function apply(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  // Bilah peramban HP mengikuti warna kepala halaman.
  const surface = getComputedStyle(root).getPropertyValue('--surface').trim();
  if (surface) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', surface);
}

/** Sakelar mode gelap. Tanpa pilihan tersimpan, tema mengikuti pengaturan sistem. */
export function ThemeToggle() {
  const { copy } = useLanguage();
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );
  useEffect(() => apply(theme), [theme]);
  useEffect(() => {
    const query = systemDark();
    const follow = () => {
      if (!saved()) setTheme(query.matches ? 'dark' : 'light');
    };
    query.addEventListener('change', follow);
    return () => query.removeEventListener('change', follow);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Penyimpanan diblokir: tema tetap berganti untuk sesi ini.
    }
  }

  const dark = theme === 'dark';
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={dark}
      aria-label={copy.nav.theme}
      title={copy.nav.theme}
      onClick={toggle}
    >
      {dark ? <SunIcon strokeWidth={1.75} /> : <MoonIcon strokeWidth={1.75} />}
    </Button>
  );
}
