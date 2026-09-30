import type { Snapshot } from '@indoor/domain';
import { useTranslation } from 'react-i18next';

/** Gedung di venue beserta jumlah lantainya; pemilih gedung dan lantai di peta dibuat di T-118. */
export function BuildingList({ snapshot }: { snapshot: Snapshot }) {
  const { t } = useTranslation();
  if (snapshot.buildings.length === 0) return null;
  return (
    <section aria-labelledby="buildings-heading" className="grid gap-2">
      <h2 id="buildings-heading" className="font-bold">
        {t('venue.buildings')}
      </h2>
      <ul className="grid gap-1">
        {snapshot.buildings.map((building) => (
          <li key={building.id} className="flex items-baseline justify-between gap-3">
            <span>{building.name}</span>
            <span className="text-ink-muted text-sm">
              {t('venue.floorCount', {
                count: snapshot.floors.filter((f) => f.buildingId === building.id).length,
              })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
