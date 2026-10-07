import {
  type FilterDef,
  type TableChange,
  type TableController,
  tableController,
} from '@indoor/ui';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';
import {
  pendingAfterRender,
  readTableState,
  type TableUrlOptions,
  writeTableState,
} from './table-url';

/** Identitas filter yang memengaruhi pembacaan URL (kunci, jenis, dan nilai pilihan). */
const signature = (filters: readonly FilterDef[]) =>
  JSON.stringify(
    filters.map((def) => [
      def.key,
      def.kind,
      'options' in def ? def.options?.map((o) => o.value) : null,
    ]),
  );

/**
 * Cari, filter, halaman, dan ukuran halaman tabel disimpan di URL (`?q=…&status=a,b&page=2`)
 * agar bisa dibagikan dan bertahan saat dimuat ulang. Setiap perubahan cari/filter/ukuran
 * kembali ke halaman 1. URL yang rusak ditulis ulang ke nilai sahnya.
 */
export function useTableState(options: TableUrlOptions): TableController {
  const [params, setParams] = useSearchParams();
  const latest = useRef(options);
  latest.current = options;
  const key = signature(options.filters);
  const search = params.toString();

  // Dibaca ulang hanya bila URL atau pilihan filter berubah, bukan setiap render.
  const state = useMemo(
    () => readTableState(new URLSearchParams(search), latest.current),
    [search, key, options.prefix, options.defaultSize],
  );

  // `setSearchParams(fn)` memberi `fn` URL dari render terakhir, sehingga dua perubahan sebelum
  // render berikutnya (dua centang cepat di menu filter) saling menimpa. URL yang sudah ditulis
  // tetapi belum dirender menjadi dasar perubahan berikutnya.
  const pending = useRef<string[]>([]);
  useEffect(() => {
    pending.current = pendingAfterRender(pending.current, search);
  }, [search]);

  const update = useCallback(
    (change: TableChange) =>
      setParams(
        (rendered) => {
          const base = new URLSearchParams(pending.current.at(-1) ?? rendered);
          const next = writeTableState(
            base,
            change(readTableState(base, latest.current)),
            latest.current,
          );
          pending.current = [...pending.current, next.toString()];
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  // Normalisasi: URL rusak (`size=7`, nilai filter asing) diganti dengan bentuk sahnya.
  useEffect(() => {
    const current = new URLSearchParams(search);
    const normalized = writeTableState(current, state, latest.current);
    if (normalized.toString() !== current.toString()) setParams(normalized, { replace: true });
  }, [search, state, setParams]);

  return useMemo(() => tableController(state, update), [state, update]);
}
