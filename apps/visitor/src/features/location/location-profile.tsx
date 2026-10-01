import { useTranslation } from 'react-i18next';
import { data } from '../../data/client';
import { ScreenHeader } from '../search/screen-header';
import { useVenue } from '../venue/venue-context';
import { PhotoStrip } from './photo-strip';
import { floorText, locationKindText } from './place';
import { RouteButton } from './route-button';

/**
 * Profil lokasi (urutan 05-desain-ui.md): nama, tipe · kategori, gedung · lantai · kode unit,
 * tombol rute, lalu deskripsi dan foto. Status buka/tutup ditambahkan di T-304.
 */
export function LocationProfile({ id }: { id: string }) {
  const { t } = useTranslation();
  const { lookup } = useVenue();
  const location = lookup.locations.get(id);
  if (!location) return null;
  const places = lookup.locationPlaces.get(id) ?? [];

  return (
    <article className="grid gap-4">
      <ScreenHeader
        title={location.name}
        subtitle={locationKindText(lookup, location)}
        icon={
          location.logoPath ? (
            <img
              src={data.snapshots.assetUrl(location.logoPath)}
              alt=""
              className="size-12 rounded-sm border border-line bg-surface object-contain"
            />
          ) : undefined
        }
      />
      {places.length > 0 ? (
        <ul className="grid gap-1">
          {places.map((place) => (
            <li key={place.floorId}>
              {floorText(lookup, place.floorId)}
              {' · '}
              <span className="font-mono">
                {place.units.map((unit) => unit.properties.unitCode).join(', ')}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-muted">{t('location.notOnMap')}</p>
      )}
      <RouteButton />
      {location.description ? <p className="whitespace-pre-line">{location.description}</p> : null}
      <PhotoStrip name={location.name} paths={location.photoPaths} />
    </article>
  );
}
