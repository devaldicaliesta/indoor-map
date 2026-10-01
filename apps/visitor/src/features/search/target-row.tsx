import { type BrowseTarget, type SnapshotLookup, targetTitle } from '@indoor/domain';
import { cn } from '@indoor/ui';
import { MapPinIcon, SquareDashedIcon, TagIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MapIcon } from '../../components/map-icon';
import { floorText, locationPlaceText, locationSummary } from '../location/place';
import { iconSource } from '../map/facility-icons';
import { useVenue } from '../venue/venue-context';

const ICON = 'size-7 shrink-0 p-1 text-ink-muted';

/** Ikon kategori/jenis fasilitas seperti di peta; `null` bila tidak punya ikon. */
function typeIcon(icon: string | null | undefined, isSafety = false): ReactNode {
  const source = iconSource(icon ?? null);
  return source ? <MapIcon source={source} isSafety={isSafety} /> : null;
}

interface RowContent {
  icon: ReactNode;
  title: string;
  subtitle: string;
  mono?: boolean;
}

function useRowContent(
  lookup: SnapshotLookup,
  target: BrowseTarget,
  placeOnly: boolean,
): RowContent | null {
  const { t } = useTranslation();
  const title = targetTitle(lookup, target);
  if (title === null) return null;
  switch (target.kind) {
    case 'location': {
      const location = lookup.locations.get(target.id);
      const summary = placeOnly
        ? locationPlaceText(lookup, target.id)
        : location && locationSummary(lookup, location);
      return {
        icon: <MapPinIcon className={ICON} strokeWidth={1.75} />,
        title,
        subtitle: summary ?? '',
      };
    }
    case 'category': {
      const category = lookup.categories.get(target.id);
      const count = lookup.categoryLocations.get(target.id)?.length ?? 0;
      return {
        icon: typeIcon(category?.icon),
        title,
        subtitle: `${t('browse.kindCategory')} · ${t('browse.locationCount', { count })}`,
      };
    }
    case 'facility_type': {
      const type = lookup.facilityTypes.get(target.id);
      const count = lookup.typeFacilities.get(target.id)?.length ?? 0;
      return {
        icon: typeIcon(type?.icon, type?.isSafety),
        title,
        subtitle: `${t('browse.kindFacility')} · ${t('browse.placeCount', { count })}`,
      };
    }
    case 'facility': {
      const feature = lookup.features.get(target.id);
      const type = lookup.facilityTypes.get(feature?.properties.facilityTypeId ?? '');
      const place = feature ? floorText(lookup, feature.properties.floorId) : '';
      return {
        icon: typeIcon(type?.icon, type?.isSafety),
        title,
        subtitle: [type && type.name !== title ? type.name : null, place]
          .filter(Boolean)
          .join(' · '),
      };
    }
    case 'unit': {
      const feature = lookup.features.get(target.id);
      const place = feature ? floorText(lookup, feature.properties.floorId) : '';
      return {
        icon: <SquareDashedIcon className={ICON} strokeWidth={1.75} />,
        title,
        subtitle: [t('browse.kindUnit'), place].filter(Boolean).join(' · '),
        mono: true,
      };
    }
  }
}

/** Satu baris daftar (hasil, anggota kategori, direktori) yang membuka targetnya. */
export function TargetRow({
  target,
  onOpen,
  index,
  placeOnly = false,
}: {
  target: BrowseTarget;
  onOpen: (target: BrowseTarget) => void;
  /** Posisi di daftar hasil; panah bawah dari kolom cari memfokuskan baris pertama. */
  index?: number;
  /** Baris lokasi hanya menyebut tempatnya (di daftar kategori, kategorinya sudah jelas). */
  placeOnly?: boolean;
}) {
  const { lookup } = useVenue();
  const content = useRowContent(lookup, target, placeOnly);
  if (!content) return null;
  return (
    <li>
      <button
        type="button"
        data-result-index={index}
        onClick={() => onOpen(target)}
        className="flex min-h-(--control-height) w-full cursor-pointer items-center gap-3 rounded-sm px-2 py-2 text-left hover:bg-canvas"
      >
        <span className="flex size-7 shrink-0 items-center justify-center">
          {content.icon ?? <TagIcon className={ICON} strokeWidth={1.75} />}
        </span>
        <span className="grid min-w-0">
          <span className={cn('truncate font-bold', content.mono && 'font-mono')}>
            {content.title}
          </span>
          {content.subtitle ? (
            <span className="truncate text-ink-muted text-sm">{content.subtitle}</span>
          ) : null}
        </span>
      </button>
    </li>
  );
}
