import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

export interface FloorOption {
  id: string;
  /** Nama tampilan singkat: B1, GF, L1. */
  label: string;
}

interface FloorSwitcherProps extends Omit<ComponentProps<'fieldset'>, 'onChange'> {
  /** Urut dari atas ke bawah (lantai tertinggi pertama). */
  floors: readonly FloorOption[];
  value: string | null;
  onChange: (floorId: string) => void;
  /** Label akses, misalnya "Lantai". */
  label: string;
  /** Lantai yang memuat hasil pilihan pengunjung (misalnya anggota kategori), diberi penanda. */
  marked?: readonly string[];
  /** Teks pembaca layar untuk penanda, misalnya "ada hasil". */
  markedLabel?: string;
}

/** Pemilih lantai vertikal di tepi kanan peta (Admin dan Visitor). */
function FloorSwitcher({
  floors,
  value,
  onChange,
  label,
  marked = [],
  markedLabel,
  className,
  ...props
}: FloorSwitcherProps) {
  return (
    <fieldset
      data-slot="floor-switcher"
      aria-label={label}
      className={cn(
        'm-0 flex min-w-0 flex-col overflow-hidden rounded-sm border border-line bg-surface p-0 shadow-float',
        className,
      )}
      {...props}
    >
      {floors.map((floor) => {
        const active = floor.id === value;
        const isMarked = marked.includes(floor.id);
        return (
          <button
            key={floor.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(floor.id)}
            className={cn(
              'relative h-(--control-height) min-w-(--control-height) cursor-pointer border-line border-b px-2 font-bold font-mono last:border-b-0',
              active ? 'bg-ink text-surface' : 'text-ink hover:bg-canvas',
            )}
          >
            {floor.label}
            {isMarked ? (
              <>
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-1 size-2 rounded-full bg-signal ring-1 ring-ink"
                />
                {markedLabel ? <span className="sr-only">, {markedLabel}</span> : null}
              </>
            ) : null}
          </button>
        );
      })}
    </fieldset>
  );
}

export { FloorSwitcher };
