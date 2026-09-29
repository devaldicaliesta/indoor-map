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
}

/** Pemilih lantai vertikal di tepi kanan peta (Admin dan Visitor). */
function FloorSwitcher({
  floors,
  value,
  onChange,
  label,
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
        return (
          <button
            key={floor.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(floor.id)}
            className={cn(
              'h-(--control-height) min-w-(--control-height) cursor-pointer border-line border-b px-2 font-bold font-mono last:border-b-0',
              active ? 'bg-ink text-surface' : 'text-ink hover:bg-canvas',
            )}
          >
            {floor.label}
          </button>
        );
      })}
    </fieldset>
  );
}

export { FloorSwitcher };
