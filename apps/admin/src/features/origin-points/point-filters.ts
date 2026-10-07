import type { FilterDef } from '@indoor/ui';
import { floorLabel } from '../closures/closure-model';

type Places = Parameters<typeof floorLabel>[0];

/**
 * Filter lantai tabel Titik Asal dan Info Point: hanya lantai yang punya titik, urut seperti
 * daftar lantai venue (per gedung, lantai atas lebih dulu).
 */
export function floorFilter(
  places: Places | undefined,
  points: readonly { floorId: string }[] | undefined,
): FilterDef {
  const used = new Set(points?.map((point) => point.floorId));
  return {
    kind: 'select',
    key: 'lantai',
    label: 'Lantai',
    allLabel: 'Semua lantai',
    options:
      places && points
        ? places.floors
            .filter((floor) => used.has(floor.id))
            .map((floor) => ({ value: floor.id, label: floorLabel(places, floor.id) }))
        : undefined,
  };
}

const PATH = { attached: 'menempel', detached: 'lepas' } as const;

export const PATH_FILTER: FilterDef = {
  kind: 'select',
  key: 'jalur',
  label: 'Jalur',
  allLabel: 'Semua titik',
  options: [
    { value: PATH.attached, label: 'Menempel ke jalur' },
    { value: PATH.detached, label: 'Tidak menempel ke jalur' },
  ],
};

export const pathState = (point: { nodeId: string | null }): string =>
  point.nodeId ? PATH.attached : PATH.detached;
