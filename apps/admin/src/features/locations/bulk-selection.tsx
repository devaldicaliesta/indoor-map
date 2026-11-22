import type { CategoryWithUsage, LocationPageFilters } from '@indoor/data';
import {
  BULK_EDIT_MAX,
  describeStoredBulkChange,
  type LocationId,
  type LocationType,
  type VenueId,
} from '@indoor/domain';
import { Button, toast } from '@indoor/ui';
import { useEffect, useRef, useState } from 'react';
import { inVenueTime } from '../../app/format';
import { useVenueTimezone } from '../closures/queries';
import { LOCATION_STATUS_LABELS } from './labels';
import { fetchLocationIds, useBulkEditMutations, useLatestBulkEdit } from './queries';

const count = new Intl.NumberFormat('id-ID');

/** Pilihan baris tabel Lokasi; bertahan saat pindah halaman, dikosongkan saat filter berubah. */
export function useLocationSelection(filterKey: string) {
  const [ids, setIds] = useState<ReadonlySet<LocationId>>(new Set());
  const previous = useRef(filterKey);
  useEffect(() => {
    if (previous.current !== filterKey) {
      previous.current = filterKey;
      setIds(new Set());
    }
  }, [filterKey]);
  return {
    ids,
    has: (id: LocationId) => ids.has(id),
    toggle: (id: LocationId) =>
      setIds((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    setMany: (list: readonly LocationId[], selected: boolean) =>
      setIds((current) => {
        const next = new Set(current);
        for (const id of list) {
          if (selected) next.add(id);
          else next.delete(id);
        }
        return next;
      }),
    replace: (list: readonly LocationId[]) => setIds(new Set(list)),
    clear: () => setIds(new Set()),
  };
}

export type LocationSelection = ReturnType<typeof useLocationSelection>;

export function SelectCheckbox({
  checked,
  indeterminate = false,
  label,
  onChange,
  tour,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  tour?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      data-tour={tour}
      className="size-4 cursor-pointer accent-ink"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

/** Jumlah terpilih, "pilih semua hasil", dan tombol Edit massal di atas tabel. */
export function SelectionBar({
  venueId,
  selection,
  total,
  q,
  filters,
  onEdit,
}: {
  venueId: VenueId;
  selection: LocationSelection;
  total: number;
  q: string;
  filters: LocationPageFilters;
  onEdit: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const size = selection.ids.size;
  if (size === 0) return null;
  const selectAll = async () => {
    setLoading(true);
    try {
      selection.replace(await fetchLocationIds(venueId, q, filters));
    } catch (error) {
      toast.error('Lokasi tidak bisa dipilih', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };
  const tooMany = size > BULK_EDIT_MAX;
  return (
    <section
      aria-label="Lokasi terpilih"
      className="flex flex-wrap items-center gap-3 rounded-md border border-ink bg-surface px-4 py-2"
    >
      <p className="font-bold" data-testid="selection-count">
        {count.format(size)} lokasi dipilih
      </p>
      {size < total && total <= BULK_EDIT_MAX ? (
        <Button size="sm" disabled={loading} onClick={() => void selectAll()}>
          {loading ? 'Memilih…' : `Pilih semua ${count.format(total)} hasil`}
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" onClick={selection.clear}>
        Batalkan pilihan
      </Button>
      {tooMany ? (
        <p className="text-danger text-sm">
          Edit massal paling banyak {count.format(BULK_EDIT_MAX)} lokasi sekaligus.
        </p>
      ) : null}
      <Button
        variant="primary"
        className="ml-auto"
        disabled={tooMany}
        onClick={onEdit}
        data-tour="locations-bulk"
      >
        Edit massal
      </Button>
    </section>
  );
}

/** Edit massal terakhir yang belum diurungkan, dengan tombol Urungkan. */
export function BulkUndoBanner({
  venueId,
  types,
  categories,
  canEdit,
}: {
  venueId: VenueId;
  types: readonly LocationType[];
  categories: readonly CategoryWithUsage[];
  canEdit: boolean;
}) {
  const latest = useLatestBulkEdit(venueId);
  const { undo } = useBulkEditMutations(venueId);
  const timezone = useVenueTimezone(venueId);
  const edit = latest.data;
  if (!edit || edit.undoneAt) return null;
  const summary = describeStoredBulkChange(edit.change, {
    statusLabel: (status) => LOCATION_STATUS_LABELS[status],
    types,
    categories,
  });
  return (
    <section
      aria-label="Edit massal terakhir"
      className="flex flex-wrap items-center gap-3 border-signal border-l-4 bg-signal-soft px-4 py-2"
    >
      <p>
        <span className="font-bold">Edit massal terakhir:</span> {summary} ·{' '}
        {count.format(edit.locationCount)} lokasi · {inVenueTime(edit.createdAt, timezone)}
      </p>
      {canEdit ? (
        <Button
          size="sm"
          className="ml-auto"
          disabled={undo.isPending}
          onClick={() =>
            undo.mutate(edit.id, {
              onSuccess: (restored) =>
                toast.success('Edit massal diurungkan', {
                  description: `${count.format(restored)} lokasi kembali ke nilai sebelumnya.`,
                }),
              onError: (error) =>
                toast.error('Edit massal tidak diurungkan', { description: error.message }),
            })
          }
        >
          {undo.isPending ? 'Mengurungkan…' : 'Urungkan'}
        </Button>
      ) : null}
    </section>
  );
}
