import type { CategoryWithUsage } from '@indoor/data';
import {
  type Building,
  type BuildingId,
  type CategoryId,
  type FloorId,
  type LocationFilter,
  OUTDOOR_BUILDING,
} from '@indoor/domain';
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@indoor/ui';
import { SearchIcon } from 'lucide-react';
import { useFloors } from '../venues/floors/queries';

const ALL = 'all';

/** Pencarian dan filter kategori, gedung, lantai, serta lokasi yang belum tertaut ke unit. */
export function LocationFilters({
  value,
  categories,
  buildings,
  outdoorName,
  onChange,
}: {
  value: LocationFilter;
  categories: readonly CategoryWithUsage[];
  buildings: readonly Building[];
  outdoorName: string;
  onChange: (value: LocationFilter) => void;
}) {
  const buildingId =
    value.building && value.building !== OUTDOOR_BUILDING ? (value.building as BuildingId) : null;
  const floors = useFloors(buildingId).data ?? [];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
          strokeWidth={1.75}
        />
        <Input
          type="search"
          aria-label="Cari lokasi"
          placeholder="Cari nama, kode lokasi, atau kode unit"
          className="pl-9"
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
        />
      </div>
      <Select
        value={value.categoryId ?? ALL}
        onValueChange={(v) =>
          onChange({ ...value, categoryId: v === ALL ? null : (v as CategoryId) })
        }
      >
        <SelectTrigger aria-label="Kategori" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Semua kategori</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.building ?? ALL}
        onValueChange={(v) =>
          onChange({
            ...value,
            building: v === ALL ? null : (v as LocationFilter['building']),
            floorId: null,
          })
        }
      >
        <SelectTrigger aria-label="Gedung" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Semua gedung</SelectItem>
          {buildings.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
          <SelectItem value={OUTDOOR_BUILDING}>{outdoorName}</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={value.floorId ?? ALL}
        disabled={!buildingId}
        onValueChange={(v) => onChange({ ...value, floorId: v === ALL ? null : (v as FloorId) })}
      >
        <SelectTrigger aria-label="Lantai" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Semua lantai</SelectItem>
          {floors.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap">
        <input
          type="checkbox"
          className="size-4 accent-ink"
          checked={value.unlinkedOnly}
          onChange={(e) => onChange({ ...value, unlinkedOnly: e.target.checked })}
        />
        Belum tertaut unit
      </label>
    </div>
  );
}
