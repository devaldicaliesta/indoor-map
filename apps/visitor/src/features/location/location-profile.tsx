import {
  categoryName,
  type DisplayField,
  displayFields,
  externalUrl,
  type LocationPlace,
  locationDescription,
  locationPlaces,
} from '@indoor/domain';
import { useTranslation } from 'react-i18next';
import { PanelMessage } from '../../app/panel-message';
import { data } from '../../data/client';
import { intlLocale } from '../../i18n';
import { LocationEvents } from '../events/event-views';
import { useExplore } from '../search/explore-context';
import { ShareButton } from '../share/share-button';
import { LocationStatus } from './location-status';
import { placeText } from './location-text';
import { RouteAction } from './route-action';

function Places({ places }: { places: LocationPlace[] }) {
  const { t } = useTranslation();
  if (!places.length) return <p className="text-ink-muted">{t('location.notOnMap')}</p>;
  return (
    <ul className="grid gap-1">
      {places.map((place) => (
        <li key={place.floor.id}>
          {placeText(place)} ·{' '}
          <span className="font-mono">
            {place.units.map((u) => u.properties.unitCode ?? '').join(', ')}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FieldValue({ field }: { field: DisplayField }) {
  const { t, i18n } = useTranslation();
  const { value } = field;
  const href = field.type === 'link' ? externalUrl(value) : null;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="break-all underline">
        {href}
      </a>
    );
  }
  if (field.type === 'image' && typeof value === 'string') {
    return (
      <img
        src={data.snapshots.assetUrl(value)}
        alt={field.label}
        loading="lazy"
        className="max-h-40 rounded-sm border border-line"
      />
    );
  }
  if (typeof value === 'number') {
    return new Intl.NumberFormat(intlLocale(i18n.resolvedLanguage)).format(value);
  }
  if (typeof value === 'boolean') return value ? t('location.yes') : t('location.no');
  return Array.isArray(value) ? value.join(', ') : value;
}

/**
 * Profil lokasi (05-desain-ui.md "Profil lokasi"): nama, tipe · kategori, gedung · lantai · kode
 * unit, status, aksi rute, lalu deskripsi, foto, dan field yang ditandai tampil.
 */
export function LocationProfile({ id }: { id: string }) {
  const { t, i18n } = useTranslation();
  const { index } = useExplore();
  const location = index.locations.get(id);
  if (!location) {
    return (
      <PanelMessage
        title={t('location.missingTitle')}
        description={t('location.missingDescription')}
      />
    );
  }
  const type = index.locationTypes.get(location.locationTypeId);
  const categories = location.categoryIds.flatMap((c) => {
    const category = index.categories.get(c);
    return category ? categoryName(category, i18n.resolvedLanguage) : [];
  });
  const description = locationDescription(location, i18n.resolvedLanguage);
  const fields = displayFields(location, type);

  return (
    <article className="grid gap-4" aria-label={location.name}>
      <header className="flex items-start gap-3">
        {location.logoPath ? (
          <img
            src={data.snapshots.assetUrl(location.logoPath)}
            alt=""
            className="size-12 shrink-0 rounded-sm border border-line bg-surface object-contain"
          />
        ) : null}
        <div className="grid min-w-0 gap-1">
          <h2 className="font-bold text-lg">{location.name}</h2>
          <p className="text-ink-muted">
            {[type?.name, categories.join(', ')].filter(Boolean).join(' · ')}
          </p>
        </div>
      </header>
      <Places places={locationPlaces(index, location)} />
      <LocationStatus location={location} />
      <LocationEvents locationId={location.id} />
      <RouteAction target={{ kind: 'location', id: location.id }} />
      <ShareButton title={location.name} />
      {description ? (
        <p
          className="whitespace-pre-line"
          lang={description === location.description ? undefined : 'en'}
        >
          {description}
        </p>
      ) : null}
      {location.photoPaths.length ? (
        <ul className="-mx-(--panel-padding) flex gap-2 overflow-x-auto px-(--panel-padding)">
          {location.photoPaths.map((path, i) => (
            <li key={path} className="shrink-0">
              <img
                src={data.snapshots.assetUrl(path)}
                alt={t('location.photo', { name: location.name, number: i + 1 })}
                loading="lazy"
                className="h-32 w-44 rounded-sm border border-line object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}
      {fields.length ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          {fields.map((field) => (
            <div key={field.key} className="contents">
              <dt className="text-ink-muted">{field.label}</dt>
              <dd className="min-w-0">
                <FieldValue field={field} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}
