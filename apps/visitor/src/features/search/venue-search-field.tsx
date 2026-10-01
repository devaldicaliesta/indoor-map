import type { KeyboardEvent } from 'react';
import { SearchField } from '../../components/search-field';
import { useBrowseStore } from './browse-store';

/**
 * Kolom cari venue: Escape mengosongkan, panah bawah pindah ke hasil pertama, Enter menutup
 * keyboard HP (hasil sudah tampil saat mengetik).
 */
export function VenueSearchField() {
  const query = useBrowseStore((state) => state.query);
  const setQuery = useBrowseStore((state) => state.setQuery);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && query) {
      event.preventDefault();
      setQuery('');
    } else if (event.key === 'ArrowDown') {
      const first = document.querySelector<HTMLElement>('[data-result-index="0"]');
      if (first) {
        event.preventDefault();
        first.focus();
      }
    } else if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }

  return <SearchField value={query} onValueChange={setQuery} onKeyDown={onKeyDown} />;
}
