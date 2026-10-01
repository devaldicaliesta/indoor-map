import { useEffect, useState } from 'react';

/** Nilai yang baru berubah setelah `delayMs` tanpa perubahan; nilai kosong berlaku langsung. */
export function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    if (value.trim() === '') {
      setDebounced(value);
      return;
    }
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return value.trim() === '' ? value : debounced;
}
