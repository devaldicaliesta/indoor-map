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
import { GraphSaveQueue } from './graph/graph-save-queue';
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
      useEditorStore.getState().setSaveStatus('features', status, error?.message ?? null),
  });
  return sharedQueue;
}

let sharedGraphQueue: GraphSaveQueue | null = null;
export function graphSaveQueue() {
  sharedGraphQueue ??= new GraphSaveQueue({
    run: async (venueId, changes) => {
      // Titik masuk merujuk fitur; unit yang baru digambar harus tersimpan lebih dulu.
      if (changes.saveNodes.some((node) => node.featureId)) await saveQueue().flush();
      await data.navGraph.apply(venueId, changes);
    },
    onStatus: (status, error) =>
      useEditorStore.getState().setSaveStatus('graph', status, error?.message ?? null),
  });
  return sharedGraphQueue;
}

/** Semua antrean simpan editor (fitur dan graf). */
export const editorQueues = () => [saveQueue(), graphSaveQueue()];

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

/**
 * Jenis fasilitas untuk fitur baru atau fitur yang diubah menjadi fasilitas: pilihan
 * terakhir bila masih ada, selain itu jenis pertama; `null` bila venue belum punya jenis.
 */
export function pickFacilityTypeId(
  preferred: string | undefined,
  types: readonly { id: string }[],
): string | null {
  if (preferred && types.some((t) => t.id === preferred)) return preferred;
  return types[0]?.id ?? null;
}
