import type { SearchHit } from '@indoor/domain';
import { type KeyboardEvent, useEffect, useState } from 'react';
import type { StoreApi } from 'zustand';
import { SearchField } from '../../components/search-field';
import { useExplore } from './explore-context';
import type { ExploreState } from './explore-store';
import { useDebouncedValue } from './use-debounced-value';

/** Hasil muncul saat mengetik, setelah jeda singkat agar daftar tidak berkedip tiap huruf. */
export const SEARCH_DEBOUNCE_MS = 150;
export const SEARCH_RESULTS_ID = 'search-results';

/** Kategori dan jenis fasilitas membuka daftar anggotanya; lokasi dan unit membuka detailnya. */
export function openHit(hit: SearchHit, store: StoreApi<ExploreState>) {
  const state = store.getState();
  if (hit.kind === 'category' || hit.kind === 'facility_type') {
    state.openList({ kind: hit.kind, id: hit.id });
  } else {
    state.openDetail({ kind: hit.kind, id: hit.id });
  }
}

/** Kolom cari venue: hasil dicari di perangkat dari indeks snapshot, tanpa server. */
export function VenueSearch({ className }: { className?: string }) {
  const { store, search } = useExplore();
  const [text, setText] = useState(() => store.getState().query);
  const debounced = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);
  // Menghapus isi kolom langsung menutup hasil, tanpa menunggu jeda.
  const query = text.trim() ? debounced : '';

  useEffect(() => {
    if (query !== store.getState().query) store.getState().search(query);
  }, [query, store]);

  // Memilih chip atau daftar mengosongkan kueri di store; kolom ikut dikosongkan.
  useEffect(
    () =>
      store.subscribe((state, previous) => {
        if (!state.query && previous.query) setText('');
      }),
    [store],
  );

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setText('');
    } else if (event.key === 'Enter') {
      const value = text.trim();
      const [first] = search(value);
      if (!first) return;
      // Kueri dicatat dulu agar hasil jeda ketik tidak menutup detail yang baru dibuka.
      store.getState().search(value);
      openHit(first, store);
      event.currentTarget.blur();
    }
  }

  return (
    <SearchField
      className={className}
      value={text}
      onValueChange={setText}
      onKeyDown={onKeyDown}
      controls={SEARCH_RESULTS_ID}
    />
  );
}
