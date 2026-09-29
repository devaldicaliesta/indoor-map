import type { FloorFeature } from '@indoor/data';
import type {
  Building,
  Floor,
  Geometry,
  MapFeatureProperties,
  UnitCodeProblem,
  VenueId,
} from '@indoor/domain';
import { data } from '../../app/data-client';
import { type EditorState, featureList, useEditorStore } from './store/editor-store';
import { SaveQueue } from './store/save-queue';

/** Satu antrean untuk seluruh sesi Admin: pindah lantai tidak membatalkan simpanan yang tertunda. */
let sharedQueue: SaveQueue<{ venueId: VenueId; feature: FloorFeature }> | null = null;
export function saveQueue() {
  sharedQueue ??= new SaveQueue({
    run: (id, op) =>
      op.type === 'save'
        ? data.features.save(op.value.venueId, op.value.feature)
        : data.features.remove(id),
    onStatus: (status, error) =>
      useEditorStore.getState().setSaveStatus(status, error?.message ?? null),
  });
  return sharedQueue;
}

export function unitCodePrefix(floor: Floor, building: Building | undefined) {
  return building ? `${building.code}-${floor.name}` : floor.name.toUpperCase();
}

export const SHAPE_OF: Record<Geometry['type'], keyof EditorState['drawKinds']> = {
  Point: 'point',
  LineString: 'linestring',
  Polygon: 'polygon',
  MultiPolygon: 'polygon',
};

/** `undefined` menghapus properti (misalnya kembali ke luas otomatis). */
export type PropertiesPatch = {
  [K in Exclude<keyof MapFeatureProperties, 'id' | 'floorId'>]?:
    | MapFeatureProperties[K]
    | undefined;
};

export const UNIT_CODE_MESSAGES: Record<UnitCodeProblem, string> = {
  required: 'Kode unit wajib diisi.',
  too_long: 'Kode unit maksimal 32 karakter.',
  format: 'Kode unit hanya boleh huruf, angka, dan . _ / -, diawali huruf atau angka.',
};

export function unitCodesOf(features: EditorState['features']) {
  return featureList(features).flatMap((f) =>
    f.properties.unitCode ? [f.properties.unitCode] : [],
  );
}
