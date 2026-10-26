import { SearchIcon, XIcon } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Button } from '../button';
import { Input } from '../input';
import { FilterControl } from './filter-controls';
import {
  dateRangeOf,
  type FilterDef,
  filterValues,
  hasActiveFilters,
  isFilterActive,
  type TableController,
} from './table-state';

/** Jeda mengetik sebelum kata kunci dipakai (dan tabel server meminta data baru). */
const SEARCH_DELAY_MS = 250;

const shortDate = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const formatDay = (iso: string) => shortDate.format(new Date(`${iso}T00:00:00Z`));

function SearchBox({
  table,
  label,
  placeholder,
}: {
  table: TableController;
  label: string;
  placeholder: string;
}) {
  const { q } = table.state;
  const [text, setText] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const setQuery = table.setQuery;
  // Kata kunci dari luar (muat ulang, "Hapus filter", tombol Back) menggantikan isian.
  useEffect(() => setText(q), [q]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="relative min-w-64 flex-1">
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
        strokeWidth={1.75}
      />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        className="pl-9"
        value={text}
        onChange={(event) => {
          const value = event.target.value;
          setText(value);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setQuery(value), SEARCH_DELAY_MS);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          clearTimeout(timer.current);
          setQuery(text);
        }}
      />
    </div>
  );
}

function chipText(def: FilterDef, values: readonly string[]): string {
  if (def.kind === 'dateRange') {
    const { from, to } = dateRangeOf(values);
    const range =
      from && to
        ? `${formatDay(from)} – ${formatDay(to)}`
        : from
          ? `sejak ${formatDay(from)}`
          : `sampai ${formatDay(to)}`;
    return `${def.label}: ${range}`;
  }
  const names = values.map(
    (value) => def.options?.find((option) => option.value === value)?.label ?? value,
  );
  return `${def.label}: ${names.join(', ')}`;
}

function Chip({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <li className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface py-0.5 pr-1 pl-2 text-sm">
      {text}
      <button
        type="button"
        aria-label={`Hapus filter ${text}`}
        onClick={onRemove}
        className="inline-flex size-6 cursor-pointer items-center justify-center rounded-sm text-ink-muted hover:bg-canvas hover:text-ink"
      >
        <XIcon aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
      </button>
    </li>
  );
}

/** Kolom cari, filter, aksi tabel, dan daftar filter aktif yang bisa dihapus satu per satu. */
export function TableToolbar({
  table,
  label,
  search,
  filters,
  actions,
}: {
  table: TableController;
  label: string;
  search: { placeholder: string } | false;
  filters: readonly FilterDef[];
  actions?: ReactNode;
}) {
  const { state } = table;
  const active = filters.flatMap((def) => {
    const values = filterValues(state, def.key);
    return isFilterActive(values) ? [{ def, text: chipText(def, values) }] : [];
  });
  return (
    <div className="grid gap-2">
      {/* Sasaran tur halaman (T-599): cari, filter, dan aksi tabel dalam satu baris. */}
      <div className="flex flex-wrap items-center gap-2" data-tour="table-toolbar">
        {search ? (
          <SearchBox
            table={table}
            label={`Cari ${label.toLowerCase()}`}
            placeholder={search.placeholder}
          />
        ) : null}
        {filters.map((def) => (
          <FilterControl
            key={def.key}
            def={def}
            values={filterValues(state, def.key)}
            onChange={(update) => table.setFilter(def.key, update)}
          />
        ))}
        {actions ? <div className="ml-auto flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {hasActiveFilters(state) ? (
        <div className="flex flex-wrap items-center gap-2">
          <ul aria-label="Filter aktif" className="flex flex-wrap gap-2">
            {state.q.trim() ? (
              <Chip text={`Kata kunci: “${state.q.trim()}”`} onRemove={() => table.setQuery('')} />
            ) : null}
            {active.map(({ def, text }) => (
              <Chip key={def.key} text={text} onRemove={() => table.setFilter(def.key, [])} />
            ))}
          </ul>
          <Button size="sm" variant="link" onClick={table.clearFilters}>
            Hapus semua filter
          </Button>
        </div>
      ) : null}
    </div>
  );
}
