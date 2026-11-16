import {
  deepLinkUrl,
  encodeQr,
  type FeatureKind,
  type LocationId,
  type OriginPoint,
  originPointUrl,
  type Snapshot,
  type VenueId,
} from '@indoor/domain';
import {
  BOARD_TEXTS,
  type BoardLanguage,
  buildBoardLayout,
  buildStickerSheets,
  type FloorFeatureCollection,
  layoutsToPdf,
  type PaperSize,
} from '@indoor/map-core';
import { FEATURE_KIND_LABELS } from '../editor/labels';

const KIND_LABELS_EN: Partial<Record<FeatureKind, string>> = {
  unit: 'Unit',
  corridor: 'Corridor',
  elevator: 'Lift',
  stairs: 'Stairs',
  exit: 'Exit',
  facility: 'Facility',
};

export const MAX_BOARD_LOCATIONS = 24;

const languageOf = (snapshot: Snapshot): BoardLanguage =>
  snapshot.venue.defaultLanguage === 'en' ? 'en' : 'id';

export const venueTitle = (snapshot: Snapshot) =>
  snapshot.venue.branding?.displayName ?? snapshot.venue.name;

export function floorFeatures(snapshot: Snapshot, floorId: string): FloorFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: snapshot.features.features.filter((f) => f.properties.floorId === floorId),
  } as unknown as FloorFeatureCollection;
}

export function mainLocations(snapshot: Snapshot, floorId: string): string[] {
  const onFloor = new Set(
    snapshot.features.features
      .filter((f) => f.properties.floorId === floorId)
      .map((f) => f.properties.id),
  );
  const names = snapshot.locations
    .filter((location) => location.unitIds.some((id) => onFloor.has(id)))
    .map((location) => location.name.trim())
    .filter(Boolean);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'id')).slice(0, MAX_BOARD_LOCATIONS);
}

export function boardsPdf(input: {
  snapshot: Snapshot;
  points: readonly OriginPoint[];
  paper: PaperSize;
  publicUrl: string;
  venueId: VenueId;
  floorName: (floorId: string) => string;
}): Uint8Array {
  const { snapshot } = input;
  const language = languageOf(snapshot);
  const layouts = input.points.map((point) => {
    const url = originPointUrl(input.publicUrl, input.venueId, point.code);
    return buildBoardLayout(floorFeatures(snapshot, point.floorId), {
      paper: input.paper,
      venueName: venueTitle(snapshot),
      place: `${point.name} · ${input.floorName(point.floorId)}`,
      here: point.coordinates,
      headingDeg: point.headingDeg,
      qr: encodeQr(url),
      url,
      locations: mainLocations(snapshot, point.floorId),
      texts: BOARD_TEXTS[language],
      kindLabels: language === 'en' ? KIND_LABELS_EN : FEATURE_KIND_LABELS,
      ...(snapshot.venue.branding?.primaryColor
        ? { accent: snapshot.venue.branding.primaryColor }
        : {}),
      colors: snapshot.venue.display.colors,
    });
  });
  return layoutsToPdf(layouts, `${venueTitle(snapshot)} — ${BOARD_TEXTS[language].here}`);
}

export const locationStickerUrl = (publicUrl: string, venueId: VenueId, locationId: string) =>
  deepLinkUrl(publicUrl, {
    venueId,
    to: { kind: 'location', locationId: locationId as LocationId },
  });

export function stickersPdf(input: {
  snapshot: Snapshot;
  locations: readonly { id: string; name: string }[];
  publicUrl: string;
  venueId: VenueId;
}): Uint8Array {
  const language = languageOf(input.snapshot);
  const pages = buildStickerSheets(
    input.locations.map((location) => ({
      name: location.name,
      qr: encodeQr(locationStickerUrl(input.publicUrl, input.venueId, location.id)),
    })),
    { caption: BOARD_TEXTS[language].sticker, venueName: venueTitle(input.snapshot) },
  );
  return layoutsToPdf(pages, `${venueTitle(input.snapshot)} — QR`);
}

export function savePdf(bytes: Uint8Array, filename: string) {
  const href = URL.createObjectURL(
    new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
  );
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
