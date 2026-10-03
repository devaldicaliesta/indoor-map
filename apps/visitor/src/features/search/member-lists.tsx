import { categoryMembers, facilityMembers, featurePlace } from '@indoor/domain';
import { Button } from '@indoor/ui';
import { XIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { EntityIcon } from '../../components/entity-icon';
import { ListRow } from '../../components/list-row';
import { LocationStatus } from '../location/location-status';
import { locationSubtitle, placeText } from '../location/location-text';
import { useExplore, useExploreStore } from './explore-context';

/** Judul daftar anggota dengan jumlahnya dan tombol tutup. */
export function ListHeader({
  icon,
  title,
  count,
  children,
}: {
  icon?: ReactNode;
  title: string;
  count: string;
  /** Kontrol tambahan di bawah judul, misalnya filter direktori. */
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const closeList = useExploreStore((s) => s.closeList);
  return (
    <header className="grid gap-3">
      <div className="flex items-center gap-3">
        {icon}
        <div className="grid min-w-0 flex-1">
          <h2 className="truncate font-bold text-lg">{title}</h2>
          <p aria-live="polite" className="text-ink-muted text-sm">
            {count}
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label={t('explore.closeList')} onClick={closeList}>
          <XIcon aria-hidden="true" strokeWidth={1.75} className="size-5" />
        </Button>
      </div>
      {children}
    </header>
  );
}

/** Semua lokasi dalam kategori; anggotanya disorot di peta selama daftar terbuka. */
export function CategoryList({ id }: { id: string }) {
  const { t, i18n } = useTranslation();
  const { snapshot, index } = useExplore();
  const openDetail = useExploreStore((s) => s.openDetail);
  const category = index.categories.get(id);
  if (!category) return null;
  const members = categoryMembers(snapshot, id, i18n.resolvedLanguage);
  return (
    <section className="grid gap-2" aria-label={category.name}>
      <ListHeader
        icon={<EntityIcon icon={category.icon} color={category.color} />}
        title={category.name}
        count={t('explore.locationCount', { count: members.length })}
      />
      <ul className="divide-y divide-line">
        {members.map((location) => (
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
  );
}

/** Semua fasilitas satu jenis, urut gedung dan lantai; semuanya disorot di peta. */
export function FacilityTypeList({ id }: { id: string }) {
  const { t, i18n } = useTranslation();
  const { snapshot, index } = useExplore();
  const openDetail = useExploreStore((s) => s.openDetail);
  const type = index.facilityTypes.get(id);
  if (!type) return null;
  const members = facilityMembers(snapshot, index, id, i18n.resolvedLanguage);
  return (
    <section className="grid gap-2" aria-label={type.name}>
      <ListHeader
        icon={<EntityIcon icon={type.icon} safety={type.isSafety} />}
        title={type.name}
        count={t('explore.facilityCount', { count: members.length })}
      />
      <ul className="divide-y divide-line">
        {members.map((facility) => (
          <li key={facility.id}>
            <ListRow
              title={facility.properties.name ?? type.name}
              subtitle={placeText(featurePlace(index, facility.id))}
              onClick={() => openDetail({ kind: 'facility', id: facility.id })}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
