import type { SnapshotBuilding } from '@indoor/domain';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@indoor/ui';
import { useTranslation } from 'react-i18next';

/** Pemilih gedung, hanya bila venue punya lebih dari satu gedung. */
export function BuildingPicker({
  buildings,
  value,
  onChange,
  className,
}: {
  buildings: readonly SnapshotBuilding[];
  value: string | null;
  onChange: (buildingId: string) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  if (buildings.length < 2 || !value) return null;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={t('map.building')} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {buildings.map((building) => (
          <SelectItem key={building.id} value={building.id}>
            {building.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
