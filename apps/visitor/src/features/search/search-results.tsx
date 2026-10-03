import { facilityMembers, featurePlace, type SearchHit } from '@indoor/domain';
import { Button } from '@indoor/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EntityIcon } from '../../components/entity-icon';
import { ListRow } from '../../components/list-row';
import { LocationStatus } from '../location/location-status';
import { locationSubtitle, placeText } from '../location/location-text';
import { useExplore, useExploreStore } from './explore-context';
import { openHit, SEARCH_RESULTS_ID } from './venue-search';

function HitRow({ hit }: { hit: SearchHit }) {
  const { t } = useTranslation();
  const { snapshot, index, store } = useExplore();
  const open = () => openHit(hit, store);

  if (hit.kind === 'location') {
    const location = index.locations.get(hit.id);
    if (!location) return null;
    return (
      <ListRow
        title={location.name}
        subtitle={locationSubtitle(index, location, t('location.notOnMap'))}
        status={<LocationStatus location={location} className="text-sm" />}
        onClick={open}
      />
    );
  }
  if (hit.kind === 'category') {
    const category = index.categories.get(hit.id);
    if (!category) return null;
    const count = snapshot.locations.filter((l) => l.categoryIds.includes(hit.id)).length;
    return (
      <ListRow
        icon={<EntityIcon icon={category.icon} color={category.color} />}
        title={category.name}
        subtitle={t('search.categoryHit', { count })}
        onClick={open}
      />
    );
  }
  if (hit.kind === 'facility_type') {
    const type = index.facilityTypes.get(hit.id);
    if (!type) return null;
    const count = facilityMembers(snapshot, index, hit.id).length;
    return (
      <ListRow
        icon={<EntityIcon icon={type.icon} safety={type.isSafety} />}
        title={type.name}
        subtitle={t('search.facilityTypeHit', { count })}
        onClick={open}
      />
    );
  }
  const unit = index.features.get(hit.id);
  if (!unit) return null;
  return (
    <ListRow
      mono
      title={unit.properties.unitCode ?? unit.properties.name ?? ''}
      subtitle={[t('unit.label'), placeText(featurePlace(index, unit.id))].join(' · ')}
      onClick={open}
    />
  );
}

/** Hasil pencarian yang diperbarui saat mengetik. */
export function SearchResults() {
  const { t } = useTranslation();
  const { search } = useExplore();
  const query = useExploreStore((s) => s.query);
  const openList = useExploreStore((s) => s.openList);
  const hits = useMemo(() => search(query), [search, query]);

  return (
    <section id={SEARCH_RESULTS_ID} aria-label={t('search.results')} className="grid gap-2">
      <p aria-live="polite" className={hits.length ? 'text-ink-muted text-sm' : 'sr-only'}>
        {hits.length
          ? t('search.count', { count: hits.length })
          : t('search.emptyTitle', { query })}
      </p>
      {hits.length ? (
        <ul className="divide-y divide-line">
          {hits.map((hit) => (
            <li key={`${hit.kind}:${hit.id}`}>
              <HitRow hit={hit} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid justify-items-start gap-3">
          <div className="grid gap-1">
            <h2 className="font-bold">{t('search.emptyTitle', { query })}</h2>
            <p className="text-ink-muted">{t('search.emptyDescription')}</p>
          </div>
          <Button onClick={() => openList({ kind: 'directory' })}>
            {t('explore.openDirectory')}
          </Button>
        </div>
      )}
    </section>
  );
}
