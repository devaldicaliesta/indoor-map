import type { FacilityType, FeatureKind, ValidationIssue } from '@indoor/domain';
import { cn, Input } from '@indoor/ui';
import { ChevronRightIcon, TriangleAlertIcon } from 'lucide-react';
import {
  type KeyboardEvent,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  buildRows,
  firstMatch,
  type ListRow,
  revealScrollTop,
  rowHeight,
  rowOffsets,
  toListItem,
  visibleRange,
} from './feature-list-model';
import { FEATURE_KIND_LABELS } from './labels';
import { featureList, useEditorStore } from './store/editor-store';

const count = new Intl.NumberFormat('id-ID');
const fallbackLabel = (kind: FeatureKind) => `${FEATURE_KIND_LABELS[kind]} tanpa nama`;

/** Tinggi area gulir, diikuti lewat ResizeObserver (panel bisa berubah tinggi). */
function useViewportHeight(element: HTMLElement | null) {
  const [height, setHeight] = useState(600);
  useLayoutEffect(() => {
    if (!element) return;
    setHeight(element.clientHeight);
    const observer = new ResizeObserver(() => setHeight(element.clientHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return height;
}

function GroupRow({
  row,
  onToggle,
}: {
  row: Extract<ListRow, { type: 'group' }>;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={row.expanded}
      onClick={onToggle}
      className="flex size-full cursor-pointer items-center gap-1 rounded-sm px-1 text-left hover:bg-canvas"
    >
      <ChevronRightIcon
        className={cn('size-4 transition-transform', row.expanded && 'rotate-90')}
      />
      {FEATURE_KIND_LABELS[row.kind]}
      <span className="ml-auto font-mono text-ink-muted tabular-nums">
        {count.format(row.count)}
      </span>
    </button>
  );
}

function ItemRow({
  row,
  selected,
  issues,
}: {
  row: Extract<ListRow, { type: 'item' }>;
  selected: boolean;
  issues: readonly ValidationIssue[] | undefined;
}) {
  const focus = useEditorStore((s) => s.focus);
  const toggleSelect = useEditorStore((s) => s.toggleSelect);
  const setHovered = useEditorStore((s) => s.setHovered);
  return (
    <button
      type="button"
      aria-current={selected}
      data-feature-id={row.id}
      onClick={(e) => (e.shiftKey ? toggleSelect(row.id) : focus(row.id))}
      onMouseEnter={() => setHovered(row.id)}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered(row.id)}
      onBlur={() => setHovered(null)}
      className="flex size-full cursor-pointer items-baseline gap-2 truncate rounded-sm pr-1 pl-6 text-left text-sm hover:bg-canvas aria-[current=true]:bg-signal-soft aria-[current=true]:font-bold"
    >
      <span className={cn('truncate', row.isCode && 'font-mono')}>{row.label}</span>
      {row.detail ? (
        <span className="truncate font-normal text-ink-muted">{row.detail}</span>
      ) : null}
      {issues?.length ? (
        // Pesan temuan ada di tooltip dan panel properti.
        <span title={issues.map((i) => i.message).join('\n')} className="ml-auto self-center">
          <TriangleAlertIcon aria-hidden="true" className="size-4 text-danger" strokeWidth={1.75} />
          <span className="sr-only">{`, ${issues.length} temuan validasi`}</span>
        </span>
      ) : null}
    </button>
  );
}

/**
 * Panel daftar fitur lantai aktif: dikelompokkan per jenis dengan jumlah,
 * dicari berdasarkan kode/nama/jenis fasilitas, dan tervirtualisasi sehingga lantai
 * dengan ribuan fitur hanya merender baris yang terlihat. Seleksi tetap di store editor.
 */
export function FeatureList({
  floorName,
  facilityTypes,
  issues,
  canEdit,
}: {
  floorName: string;
  canEdit: boolean;
  facilityTypes: readonly FacilityType[];
  issues: ReadonlyMap<string, ValidationIssue[]>;
}) {
  const features = useEditorStore((s) => s.features);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const focus = useEditorStore((s) => s.focus);
  const [open, setOpen] = useState<ReadonlySet<FeatureKind>>(new Set());
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const viewportHeight = useViewportHeight(scroller);

  const items = useMemo(() => {
    const typeNames = new Map(facilityTypes.map((t) => [t.id as string, t.name]));
    return featureList(features).map((f) =>
      toListItem(f, (id) => typeNames.get(id), fallbackLabel),
    );
  }, [features, facilityTypes]);

  // Grup yang memuat fitur terpilih ikut terbuka.
  const selectedKinds = useMemo(
    () => new Set(selectedIds.map((id) => features[id]?.properties.kind)),
    [selectedIds, features],
  );
  const rows = useMemo(
    () =>
      buildRows(items, {
        query: deferredQuery,
        isExpanded: (kind) => open.has(kind) || selectedKinds.has(kind),
      }),
    [items, deferredQuery, open, selectedKinds],
  );
  const offsets = useMemo(() => rowOffsets(rows), [rows]);
  // Saat daftar menyusut (mencari, menutup grup), posisi gulir lama bisa melewati ujung
  // daftar sebelum browser mengirim event scroll; jepit agar baris teratas tetap dirender.
  const maxScrollTop = Math.max(0, (offsets.at(-1) ?? 0) - viewportHeight);
  const { start, end } = visibleRange(offsets, Math.min(scrollTop, maxScrollTop), viewportHeight);

  const selectedId = selectedIds.at(-1);
  const lastRevealed = useRef<string | undefined>(undefined);

  // Hasil pencarian baru dimulai dari atas; fitur terpilih dimunculkan lagi bila ada.
  useEffect(() => {
    if (!scroller) return;
    scroller.scrollTop = 0;
    setScrollTop(0);
    lastRevealed.current = undefined;
  }, [scroller, deferredQuery]);

  // Gulir seperlunya setiap kali seleksi berganti (juga saat dipilih dari peta).
  useEffect(() => {
    if (!scroller || !selectedId || lastRevealed.current === selectedId) return;
    const index = rows.findIndex((r) => r.type === 'item' && r.id === selectedId);
    if (index < 0) return;
    lastRevealed.current = selectedId;
    const next = revealScrollTop(offsets, index, scroller.scrollTop, scroller.clientHeight);
    if (next !== null) scroller.scrollTop = next;
  }, [scroller, selectedId, rows, offsets]);

  function toggle(kind: FeatureKind) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && query) {
      event.stopPropagation();
      setQuery('');
    } else if (event.key === 'Enter') {
      // Enter memilih hasil pertama, berguna saat mencari kode unit yang persis. Disaring dari
      // teks saat ini, bukan daftar tampil (`useDeferredValue`) yang bisa tertinggal saat tempel + Enter.
      const first = firstMatch(items, query);
      if (first) focus(first.id);
    }
  }

  const total = items.length;
  return (
    <nav
      aria-label={`Fitur lantai ${floorName}`}
      className="grid h-full min-h-0 grid-rows-[auto_1fr]"
    >
      <div className="grid gap-2 p-3 pb-2">
        <h2 className="px-1 font-bold">Fitur {floorName}</h2>
        {total > 0 ? (
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
            placeholder="Cari kode, nama, atau jenis"
            aria-label={`Cari fitur di lantai ${floorName}`}
          />
        ) : null}
      </div>
      <div
        ref={setScroller}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="min-h-0 overflow-y-auto px-3 pb-3"
      >
        {total === 0 ? (
          <p className="px-1 text-ink-muted text-sm">
            {canEdit
              ? 'Belum ada fitur. Pilih alat Poligon, Garis, atau Titik di sebelah kiri.'
              : 'Belum ada fitur di lantai ini.'}
          </p>
        ) : rows.length === 0 ? (
          <p className="px-1 text-ink-muted text-sm" role="status">
            Tidak ada fitur yang cocok dengan “{deferredQuery.trim()}”.
          </p>
        ) : (
          <div className="relative" style={{ height: offsets.at(-1) }}>
            {rows.slice(start, end).map((row, i) => {
              const index = start + i;
              return (
                <div
                  key={row.type === 'group' ? `group-${row.kind}` : row.id}
                  className="absolute inset-x-0"
                  style={{ top: offsets[index], height: rowHeight(row) }}
                >
                  {row.type === 'group' ? (
                    <GroupRow row={row} onToggle={() => toggle(row.kind)} />
                  ) : (
                    <ItemRow
                      row={row}
                      selected={selectedIds.includes(row.id)}
                      issues={issues.get(row.id)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
