import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MapIcon } from '../../components/map-icon';
import { iconSource } from '../map/facility-icons';
import { useVenue } from '../venue/venue-context';
import { type BrowseScreen, useBrowseStore } from './browse-store';

function Chip({ icon, label, onClick }: { icon?: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-(--control-height) max-w-full cursor-pointer items-center gap-2 rounded-sm border border-line bg-surface px-3 font-bold hover:bg-canvas"
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

/**
 * Beranda panel: chip kategori lalu jenis fasilitas (urutan Admin), dan "A–Z" di akhir.
 * Kategori dan jenis tanpa anggota di peta tidak ditampilkan.
 */
export function BrowseHome() {
  const { t } = useTranslation();
  const { snapshot, lookup } = useVenue();
  const open = useBrowseStore((state) => state.open);
  const icon = (path: string | null, isSafety = false) => {
    const source = iconSource(path);
    return source ? <MapIcon source={source} isSafety={isSafety} /> : undefined;
  };
  const chip = (screen: BrowseScreen) => () => open(screen);

  return (
    <nav aria-label={t('browse.explore')} className="flex flex-wrap gap-2">
      {snapshot.categories
        .filter((category) => (lookup.categoryLocations.get(category.id)?.length ?? 0) > 0)
        .map((category) => (
          <Chip
            key={category.id}
            icon={icon(category.icon)}
            label={category.name}
            onClick={chip({ kind: 'category', id: category.id })}
          />
        ))}
      {snapshot.facilityTypes
        .filter((type) => (lookup.typeFacilities.get(type.id)?.length ?? 0) > 0)
        .map((type) => (
          <Chip
            key={type.id}
            icon={icon(type.icon, type.isSafety)}
            label={type.name}
            onClick={chip({ kind: 'facility_type', id: type.id })}
          />
        ))}
      <Chip label={t('browse.directory')} onClick={chip({ kind: 'directory' })} />
    </nav>
  );
}
