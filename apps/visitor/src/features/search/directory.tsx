import {
  buildingFloors,
  directoryFilterOptions,
  directoryGroups,
  directoryLocations,
  OUTDOOR_FILTER,
} from '@indoor/domain';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@indoor/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ListRow } from '../../components/list-row';
import { LocationStatus } from '../location/location-status';
import { locationSubtitle } from '../location/location-text';
import { useExplore, useExploreStore } from './explore-context';
import { ListHeader } from './member-lists';

// Radix Select tidak menerima nilai kosong; "semua" diberi nilai sendiri.
const ALL = 'all';

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (value: string | null) => void;
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? null : v)}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Direktori A–Z dengan filter gedung, lantai, dan tipe; filter yang tidak berguna disembunyikan. */
export function Directory() {
  const { t, i18n } = useTranslation();
  const { snapshot, index } = useExplore();
  const filter = useExploreStore((s) => s.directoryFilter);
  const setFilter = useExploreStore((s) => s.setDirectoryFilter);
  const openDetail = useExploreStore((s) => s.openDetail);

  const options = useMemo(() => directoryFilterOptions(snapshot, index), [snapshot, index]);
  const locations = useMemo(
    () => directoryLocations(snapshot, index, filter, i18n.resolvedLanguage),
    [snapshot, index, filter, i18n.resolvedLanguage],
  );
  const groups = useMemo(() => directoryGroups(locations), [locations]);

  const buildingChoices = [
    ...options.buildingIds.map((id) => ({ value: id, label: index.buildings.get(id)?.name ?? id })),
    ...(options.hasOutdoor ? [{ value: OUTDOOR_FILTER, label: t('explore.outdoorArea') }] : []),
  ];
  // Venue satu gedung tanpa Area Luar tidak perlu memilih gedung sebelum memilih lantai.
  const floorBuildingId =
    filter.buildingId ?? (buildingChoices.length === 1 ? (options.buildingIds[0] ?? null) : null);
  const floors =
    floorBuildingId && floorBuildingId !== OUTDOOR_FILTER
      ? buildingFloors(snapshot, floorBuildingId)
      : [];

  return (
    <section className="grid gap-2" aria-label={t('explore.directoryTitle')}>
      <ListHeader
        title={t('explore.directoryTitle')}
        count={t('explore.locationCount', { count: locations.length })}
      >
        <div className="grid grid-cols-2 gap-2">
          {buildingChoices.length > 1 ? (
            <FilterSelect
              label={t('explore.filterBuilding')}
              value={filter.buildingId}
              options={[{ value: ALL, label: t('explore.allBuildings') }, ...buildingChoices]}
              onChange={(buildingId) => setFilter({ ...filter, buildingId, floorId: null })}
            />
          ) : null}
          {floors.length > 1 ? (
            <FilterSelect
              label={t('explore.filterFloor')}
              value={filter.floorId}
              options={[
                { value: ALL, label: t('explore.allFloors') },
                ...floors.map((f) => ({ value: f.id, label: f.name })),
              ]}
              onChange={(floorId) =>
                setFilter({
                  ...filter,
                  buildingId: floorId ? floorBuildingId : filter.buildingId,
                  floorId,
                })
              }
            />
          ) : null}
          {options.locationTypeIds.length > 1 ? (
            <FilterSelect
              label={t('explore.filterType')}
              value={filter.locationTypeId}
              options={[
                { value: ALL, label: t('explore.allTypes') },
                ...options.locationTypeIds.map((id) => ({
                  value: id,
                  label: index.locationTypes.get(id)?.name ?? id,
                })),
              ]}
              onChange={(locationTypeId) => setFilter({ ...filter, locationTypeId })}
            />
          ) : null}
        </div>
      </ListHeader>
      {groups.length ? (
        groups.map((group) => (
          <section key={group.letter} aria-label={group.letter}>
            <h3 className="sticky top-0 z-1 bg-surface py-1 font-bold text-ink-muted text-sm">
              {group.letter}
            </h3>
            <ul className="divide-y divide-line">
              {group.locations.map((location) => (
                <li key={location.id}>
                  <ListRow
                    title={location.name}
                    subtitle={locationSubtitle(index, location, t('location.notOnMap'))}
                    status={<LocationStatus location={location} className="text-sm" />}
                    onClick={() => openDetail({ kind: 'location', id: location.id })}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p className="text-ink-muted">{t('explore.directoryEmpty')}</p>
      )}
    </section>
  );
}
