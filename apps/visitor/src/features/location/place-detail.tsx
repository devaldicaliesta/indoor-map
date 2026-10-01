import { targetTitle } from '@indoor/domain';
import { useTranslation } from 'react-i18next';
import { MapIcon } from '../../components/map-icon';
import { iconSource } from '../map/facility-icons';
import { ScreenHeader } from '../search/screen-header';
import { useVenue } from '../venue/venue-context';
import { floorText } from './place';
import { RouteButton } from './route-button';

/** Unit yang tidak ditempati lokasi: hanya kode unit dan tempatnya. */
export function UnitDetail({ id }: { id: string }) {
  const { t } = useTranslation();
  const { lookup } = useVenue();
  const unit = lookup.features.get(id);
  const code = targetTitle(lookup, { kind: 'unit', id });
  if (!unit || code === null) return null;
  return (
    <article className="grid gap-4">
      <ScreenHeader
        title={code}
        titleClassName="font-mono"
        subtitle={`${t('browse.kindUnit')} · ${floorText(lookup, unit.properties.floorId)}`}
      />
      <RouteButton />
    </article>
  );
}

/** Satu titik fasilitas: nama (atau jenisnya), ikon seperti di peta, dan tempatnya. */
export function FacilityDetail({ id }: { id: string }) {
  const { t } = useTranslation();
  const { lookup } = useVenue();
  const feature = lookup.features.get(id);
  const title = targetTitle(lookup, { kind: 'facility', id });
  if (!feature || title === null) return null;
  const type = lookup.facilityTypes.get(feature.properties.facilityTypeId ?? '');
  const source = iconSource(type?.icon ?? null);
  const kind = type && type.name !== title ? type.name : t('browse.kindFacility');
  return (
    <article className="grid gap-4">
      <ScreenHeader
        title={title}
        icon={source ? <MapIcon source={source} isSafety={type?.isSafety ?? false} /> : undefined}
        subtitle={`${kind} · ${floorText(lookup, feature.properties.floorId)}`}
      />
      <RouteButton />
    </article>
  );
}
