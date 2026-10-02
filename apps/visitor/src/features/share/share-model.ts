import {
  DEEP_LINK_COORDINATE_DECIMALS,
  type DeepLink,
  type ExploreTarget,
  type FloorId,
  type LanguageCode,
  type LocationId,
  type RouteEnd,
  type Snapshot,
  type SnapshotIndex,
  targetOfFeature,
  type VenueId,
} from '@indoor/domain';
import type { RoutePlace } from '@indoor/routing';
import { featurePosition, originView, placeOfTarget } from '../origin/origin-model';

/** Keadaan Visitor yang dibagikan dan dipulihkan dari tautan. */
export interface SharedState {
  detail: ExploreTarget | null;
  origin: RoutePlace | null;
  destination: ExploreTarget | null;
  accessible: boolean;
  language: LanguageCode | null;
}

const SCALE = 10 ** DEEP_LINK_COORDINATE_DECIMALS;
const round = (value: number) => Math.round(value * SCALE) / SCALE;

/** Ujung rute di tautan; unit dan fasilitas menjadi titik wakilnya (deep link hanya kenal lokasi). */
function placeEnd(snapshot: Snapshot, index: SnapshotIndex, place: RoutePlace): RouteEnd | null {
  if (place.kind === 'location') {
    return { kind: 'location', locationId: place.locationId as LocationId };
  }
  const view = originView(snapshot, index, place);
  if (!view) return null;
  const [lng, lat] = view.position;
  return { kind: 'point', lng: round(lng), lat: round(lat), floorId: view.floorId as FloorId };
}

/** Tautan untuk keadaan sekarang: lokasi yang dibuka, atau rute (asal, tujuan, mode). */
export function shareLink(snapshot: Snapshot, index: SnapshotIndex, state: SharedState): DeepLink {
  const link: DeepLink = { venueId: snapshot.venue.id as VenueId };
  if (state.language) link.language = state.language;
  if (state.destination && state.origin) {
    const to = placeEnd(snapshot, index, placeOfTarget(state.destination));
    if (to) link.to = to;
    const { origin } = state;
    if (origin.kind === 'origin_point') link.originCode = origin.code;
    else if (origin.kind === 'info_point') link.infoPointCode = origin.code;
    else {
      const from = placeEnd(snapshot, index, origin);
      if (from) link.from = from;
    }
    if (state.accessible) link.accessible = true;
    return link;
  }
  if (state.detail?.kind === 'location') link.locationId = state.detail.id as LocationId;
  return link;
}

/** Fitur (unit atau fasilitas) yang titik wakilnya tepat di titik tautan. */
function featureAt(snapshot: Snapshot, end: Extract<RouteEnd, { kind: 'point' }>) {
  return snapshot.features.features.find((feature) => {
    if (feature.properties.floorId !== end.floorId) return false;
    const kind = feature.properties.kind;
    if (kind !== 'unit' && kind !== 'facility') return false;
    const position = featurePosition(feature);
    return position !== null && round(position[0]) === end.lng && round(position[1]) === end.lat;
  });
}

function endPlace(snapshot: Snapshot, index: SnapshotIndex, end: RouteEnd): RoutePlace | null {
  if (end.kind === 'location') {
    return index.locations.has(end.locationId)
      ? { kind: 'location', locationId: end.locationId }
      : null;
  }
  const feature = featureAt(snapshot, end);
  if (feature) return { kind: 'feature', featureId: feature.id };
  return index.floors.has(end.floorId)
    ? { kind: 'point', lng: end.lng, lat: end.lat, floorId: end.floorId }
    : null;
}

function endTarget(snapshot: Snapshot, index: SnapshotIndex, end: RouteEnd): ExploreTarget | null {
  if (end.kind === 'location') {
    return index.locations.has(end.locationId) ? { kind: 'location', id: end.locationId } : null;
  }
  const feature = featureAt(snapshot, end);
  return feature ? targetOfFeature(index, feature.id) : null;
}

/**
 * Keadaan dari tautan. Bagian yang tidak ada lagi di snapshot (QR dihapus, lokasi belum dipublish)
 * diabaikan, sehingga tautan lama tetap membuka Visitor.
 */
export function sharedState(
  snapshot: Snapshot,
  index: SnapshotIndex,
  link: DeepLink | null,
): SharedState {
  const state: SharedState = {
    detail: null,
    origin: null,
    destination: null,
    accessible: link?.accessible ?? false,
    language: link?.language ?? null,
  };
  if (!link) return state;
  if (link.originCode && snapshot.originPoints.some((p) => p.code === link.originCode)) {
    state.origin = { kind: 'origin_point', code: link.originCode };
  } else if (link.infoPointCode && snapshot.infoPoints.some((p) => p.code === link.infoPointCode)) {
    state.origin = { kind: 'info_point', code: link.infoPointCode };
  } else if (link.from) {
    state.origin = endPlace(snapshot, index, link.from);
  }
  if (link.to) state.destination = endTarget(snapshot, index, link.to);
  if (link.locationId && index.locations.has(link.locationId)) {
    state.detail = { kind: 'location', id: link.locationId };
  }
  return state;
}
