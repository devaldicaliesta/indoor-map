import type { BrowseTarget } from '@indoor/domain';
import { useTranslation } from 'react-i18next';
import { MapIcon } from '../../components/map-icon';
import { iconSource } from '../map/facility-icons';
import { useVenue } from '../venue/venue-context';
import { useBrowseStore } from './browse-store';
import { ScreenHeader } from './screen-header';
import { TargetRow } from './target-row';

/** Anggota kategori (lokasi) atau jenis fasilitas (titik fasilitas); semuanya disorot di peta. */
export function Members({
  target,
}: {
  target: Extract<BrowseTarget, { kind: 'category' | 'facility_type' }>;
}) {
  const { t } = useTranslation();
  const { lookup } = useVenue();
  const open = useBrowseStore((state) => state.open);

  const isCategory = target.kind === 'category';
  const group = isCategory ? lookup.categories.get(target.id) : lookup.facilityTypes.get(target.id);
  const members: BrowseTarget[] = isCategory
    ? (lookup.categoryLocations.get(target.id) ?? []).map((l) => ({ kind: 'location', id: l.id }))
    : (lookup.typeFacilities.get(target.id) ?? []).map((f) => ({ kind: 'facility', id: f.id }));
  if (!group) return null;

  const source = iconSource(group.icon);
  const isSafety = 'isSafety' in group && group.isSafety;
  const count = members.length;
  return (
    <section className="grid gap-3">
      <ScreenHeader
        title={group.name}
        icon={source ? <MapIcon source={source} isSafety={isSafety} /> : undefined}
        subtitle={
          isCategory
            ? `${t('browse.kindCategory')} · ${t('browse.locationCount', { count })}`
            : `${t('browse.kindFacility')} · ${t('browse.placeCount', { count })}`
        }
      />
      <ul className="-mx-2 grid">
        {members.map((member) => (
          <TargetRow key={member.id} target={member} onOpen={open} placeOnly />
        ))}
      </ul>
    </section>
  );
}
