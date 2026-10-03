import type { SearchHit } from '@indoor/domain';
import { type KeyboardEvent, useEffect, useState } from 'react';
import type { StoreApi } from 'zustand';
import { SearchField } from '../../components/search-field';
import { useInfoPointMode } from '../../infopoint/info-point-mode';
import { OnScreenKeyboard } from '../../infopoint/on-screen-keyboard';
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
export function VenueSearch({
  className,
  placeholder,
}: {
  className?: string;
  placeholder?: string | undefined;
}) {
  const { store, search } = useExplore();
  const infoPoint = useInfoPointMode();
  const [keyboard, setKeyboard] = useState(false);
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

  /** Membuka hasil pertama; `true` bila ada. */
  function submit(): boolean {
    const value = text.trim();
    const [first] = search(value);
    if (!first) return false;
    // Kueri dicatat dulu agar hasil jeda ketik tidak menutup detail yang baru dibuka.
    store.getState().search(value);
    openHit(first, store);
    return true;
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setText('');
    } else if (event.key === 'Enter' && submit()) {
      event.currentTarget.blur();
    }
  }

  const field = (
    <SearchField
      className={className}
      placeholder={placeholder}
      value={text}
      onValueChange={setText}
      onKeyDown={onKeyDown}
      controls={SEARCH_RESULTS_ID}
      virtualKeyboard={infoPoint !== null}
      onFocus={() => setKeyboard(true)}
    />
  );
  if (!infoPoint) return field;
  return (
    <div className="grid gap-2">
      {field}
      {keyboard ? (
        <OnScreenKeyboard
          onInput={(letter) => setText((t) => t + letter)}
          onBackspace={() => setText((t) => t.slice(0, -1))}
          onEnter={() => {
            if (submit()) setKeyboard(false);
          }}
        />
      ) : null}
    </div>
  );
}
