import { featurePlace } from '@indoor/domain';
import { useTranslation } from 'react-i18next';
import { PanelMessage } from '../../app/panel-message';
import { EntityIcon } from '../../components/entity-icon';
import { useExplore } from '../search/explore-context';
import { placeText } from './location-text';
import { RouteAction } from './route-action';

function Missing() {
  const { t } = useTranslation();
  return (
    <PanelMessage
      title={t('location.missingTitle')}
      description={t('location.missingDescription')}
    />
  );
}

/** Unit tanpa lokasi: cukup kode unitnya dan tempatnya. */
export function UnitDetail({ id }: { id: string }) {
  const { t } = useTranslation();
  const { index } = useExplore();
  const unit = index.features.get(id);
  if (!unit) return <Missing />;
  return (
    <article className="grid gap-4" aria-label={unit.properties.unitCode ?? t('unit.label')}>
      <header className="grid gap-1">
        <h2 className="font-bold font-mono text-lg">{unit.properties.unitCode}</h2>
        <p className="text-ink-muted">
          {[t('unit.label'), placeText(featurePlace(index, id))].filter(Boolean).join(' · ')}
        </p>
      </header>
      <RouteAction target={{ kind: 'unit', id }} />
    </article>
  );
}

/** Fasilitas: jenisnya (dengan ikon), nama bila ada, dan tempatnya. */
export function FacilityDetail({ id }: { id: string }) {
  const { index } = useExplore();
  const facility = index.features.get(id);
  const typeId = facility?.properties.facilityTypeId;
  const type = typeId ? index.facilityTypes.get(typeId) : undefined;
  if (!facility || !type) return <Missing />;
  const name = facility.properties.name;
  const title = name ?? type.name;
  return (
    <article className="grid gap-4" aria-label={title}>
      <header className="flex items-start gap-3">
        <EntityIcon icon={type.icon} safety={type.isSafety} className="size-10" />
        <div className="grid min-w-0 gap-1">
          <h2 className="font-bold text-lg">{title}</h2>
          <p className="text-ink-muted">
            {[name && name !== type.name ? type.name : null, placeText(featurePlace(index, id))]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </header>
      <RouteAction target={{ kind: 'facility', id }} />
    </article>
  );
}
