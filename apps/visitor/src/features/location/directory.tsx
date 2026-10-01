import {
  type DirectoryOption,
  directoryGroups,
  directoryOptions,
  withDirectoryBuilding,
} from '@indoor/domain';
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@indoor/ui';
import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelMessage } from '../../app/panel-message';
import { useBrowseStore } from '../search/browse-store';
import { ScreenHeader } from '../search/screen-header';
import { TargetRow } from '../search/target-row';
import { useVenue } from '../venue/venue-context';

// Radix Select tidak menerima nilai kosong untuk pilihan "semua".
const ALL = '__all__';

function FilterSelect({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  value: string | null;
  options: readonly DirectoryOption[];
  onChange: (value: string | null) => void;
}) {
  const id = useId();
  return (
    <div className="grid min-w-0 gap-1">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Select value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? null : next)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Direktori A–Z: semua lokasi urut abjad per huruf awal. Filter yang tidak bisa mempersempit
 * (satu gedung, satu tipe) tidak ditampilkan; lantai muncul setelah gedung dipilih.
 */
export function Directory() {
  const { t } = useTranslation();
  const { lookup } = useVenue();
  const filter = useBrowseStore((state) => state.directory);
  const setFilter = useBrowseStore((state) => state.setDirectory);
  const open = useBrowseStore((state) => state.open);
  const groups = useMemo(() => directoryGroups(lookup, filter), [lookup, filter]);
  const options = useMemo(() => directoryOptions(lookup, filter), [lookup, filter]);
  const count = groups.reduce((total, group) => total + group.locations.length, 0);

  return (
    <section className="grid gap-3">
      <ScreenHeader title={t('directory.title')} subtitle={t('browse.locationCount', { count })} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
        {options.buildings.length > 1 ? (
          <FilterSelect
            label={t('directory.building')}
            allLabel={t('directory.allBuildings')}
            value={filter.building}
            options={options.buildings}
            onChange={(building) => setFilter(withDirectoryBuilding(filter, building))}
          />
        ) : null}
        {options.floors.length > 1 ? (
          <FilterSelect
            label={t('directory.floor')}
            allLabel={t('directory.allFloors')}
            value={filter.floorId}
            options={options.floors}
            onChange={(floorId) => setFilter({ ...filter, floorId })}
          />
        ) : null}
        {options.locationTypes.length > 1 ? (
          <FilterSelect
            label={t('directory.type')}
            allLabel={t('directory.allTypes')}
            value={filter.locationTypeId}
            options={options.locationTypes}
            onChange={(locationTypeId) => setFilter({ ...filter, locationTypeId })}
          />
        ) : null}
      </div>
      {count === 0 ? (
        <PanelMessage
          title={t('directory.emptyTitle')}
          description={t('directory.emptyDescription')}
        />
      ) : (
        groups.map((group) => (
          <section key={group.letter} aria-label={group.letter}>
            <h3 className="sticky top-0 z-1 border-line border-b bg-surface py-1 font-bold font-mono">
              {group.letter}
            </h3>
            <ul className="-mx-2 grid">
              {group.locations.map((location) => (
                <TargetRow
                  key={location.id}
                  target={{ kind: 'location', id: location.id }}
                  onOpen={open}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  );
}
