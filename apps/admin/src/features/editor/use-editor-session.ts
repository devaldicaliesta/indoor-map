import type { FloorFeature } from '@indoor/data';
import {
  type Building,
  changeFeatureKind,
  checkUnitCode,
  type DrawKind,
  type Floor,
  type Geometry,
  KIND_SHAPE,
  type MapFeatureProperties,
  nextUnitCode,
  normalizeUnitCode,
  type UnitCodeProblem,
  type VenueId,
} from '@indoor/domain';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { data } from '../../app/data-client';
import { featureList, useEditorStore } from './editor-store';
import { SaveQueue } from './save-queue';

/** Satu antrean untuk seluruh sesi Admin: pindah lantai tidak membatalkan simpanan yang tertunda. */
let sharedQueue: SaveQueue<{ venueId: VenueId; feature: FloorFeature }> | null = null;
function saveQueue() {
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

function unitCodePrefix(floor: Floor, building: Building | undefined) {
  return building ? `${building.code}-${floor.name}` : floor.name.toUpperCase();
}

const SHAPE_OF: Record<
  Geometry['type'],
  keyof ReturnType<typeof useEditorStore.getState>['drawKinds']
> = {
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

const UNIT_CODE_MESSAGES: Record<UnitCodeProblem, string> = {
  required: 'Kode unit wajib diisi.',
  too_long: 'Kode unit maksimal 32 karakter.',
  format: 'Kode unit hanya boleh huruf, angka, dan . _ / -, diawali huruf atau angka.',
};

function unitCodesOf(features: ReturnType<typeof useEditorStore.getState>['features']) {
  return featureList(features).flatMap((f) =>
    f.properties.unitCode ? [f.properties.unitCode] : [],
  );
}

/**
 * Menghubungkan store editor dengan database untuk satu lantai: memuat fitur,
 * lalu setiap perubahan masuk antrean simpan (debounce ±800 ms).
 */
export function useEditorSession(
  venueId: VenueId,
  floor: Floor | undefined,
  building: Building | undefined,
) {
  const floorId = floor?.id ?? null;
  const loaded = useEditorStore((s) => s.floorId === floorId && floorId !== null);
  const query = useQuery({
    queryKey: ['features', floorId],
    queryFn: async () => {
      // Tulis yang tertunda lebih dulu agar yang dimuat adalah draft terbaru.
      await saveQueue().flush();
      return data.features.listByFloor(floorId as NonNullable<typeof floorId>);
    },
    enabled: floorId !== null,
    // Store adalah sumber kebenaran selama menyunting; jangan timpa dengan data server.
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (floorId && query.data && !loaded) {
      useEditorStore.getState().load(floorId, query.data, floor?.isOutdoor ?? false);
    }
  }, [floorId, query.data, loaded, floor?.isOutdoor]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (saveQueue().hasUnsaved()) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const enqueue = useCallback(
    (feature: FloorFeature) =>
      saveQueue().enqueue(feature.properties.id, { type: 'save', value: { venueId, feature } }),
    [venueId],
  );

  const newUnitCode = useCallback(() => {
    if (!floor) return '';
    return nextUnitCode(
      unitCodePrefix(floor, building),
      unitCodesOf(useEditorStore.getState().features),
    );
  }, [floor, building]);

  const draw = useCallback(
    (geometry: Geometry) => {
      if (!floor) return;
      const store = useEditorStore.getState();
      const drawKind = store.drawKinds[SHAPE_OF[geometry.type]];
      const id = crypto.randomUUID();
      const base: MapFeatureProperties = { id, kind: 'corridor', floorId: floor.id };
      const properties = changeFeatureKind(base, drawKind, newUnitCode);
      const feature: FloorFeature = { type: 'Feature', id, geometry, properties };
      store.put(feature);
      enqueue(feature);
    },
    [floor, enqueue, newUnitCode],
  );

  const update = useCallback(
    (id: string, patch: PropertiesPatch) => {
      const store = useEditorStore.getState();
      const current = store.features[id];
      if (!current) return;
      const properties = { ...current.properties } as Record<string, unknown>;
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) delete properties[key];
        else properties[key] = value;
      }
      const next: FloorFeature = { ...current, properties: properties as unknown as MapFeatureProperties };
      store.put(next);
      enqueue(next);
    },
    [enqueue],
  );

  const changeKind = useCallback(
    (id: string, drawKind: DrawKind) => {
      const store = useEditorStore.getState();
      const current = store.features[id];
      if (!current || KIND_SHAPE[drawKind.kind] !== KIND_SHAPE[current.properties.kind]) return;
      const next: FloorFeature = {
        ...current,
        properties: changeFeatureKind(current.properties, drawKind, newUnitCode),
      };
      store.put(next);
      enqueue(next);
    },
    [enqueue, newUnitCode],
  );

  /** FR-MAP-06: kode unit unik per venue; pesan menyebut unit yang bentrok. */
  const setUnitCode = useCallback(
    async (id: string, input: string): Promise<string | null> => {
      const problem = checkUnitCode(input)[0];
      if (problem) return UNIT_CODE_MESSAGES[problem];
      const code = normalizeUnitCode(input);
      const store = useEditorStore.getState();
      const local = featureList(store.features).find(
        (f) => f.properties.id !== id && f.properties.unitCode?.toUpperCase() === code,
      );
      if (local && floor) return `Kode ${code} sudah dipakai unit lain di lantai ${floor.name}.`;
      const owner = await data.features.findUnitCode(venueId, code, id);
      if (owner) {
        const where = owner.buildingName
          ? `${owner.buildingName} lantai ${owner.floorName}`
          : owner.floorName;
        return `Kode ${owner.unitCode} sudah dipakai unit di ${where}.`;
      }
      update(id, { unitCode: code });
      return null;
    },
    [venueId, floor, update],
  );

  const editGeometry = useCallback(
    (id: string, geometry: Geometry) => {
      const next = useEditorStore.getState().setGeometry(id, geometry);
      if (next) enqueue(next);
    },
    [enqueue],
  );

  const remove = useCallback((id: string) => {
    useEditorStore.getState().remove(id);
    saveQueue().enqueue(id, { type: 'remove' });
  }, []);

  return useMemo(
    () => ({
      ready: loaded,
      error: query.error,
      isOutdoor: floor?.isOutdoor ?? false,
      draw,
      editGeometry,
      update,
      changeKind,
      setUnitCode,
      remove,
      retry: () => saveQueue().retry(),
    }),
    [
      loaded,
      query.error,
      floor?.isOutdoor,
      draw,
      editGeometry,
      update,
      changeKind,
      setUnitCode,
      remove,
    ],
  );
}

export type EditorSession = ReturnType<typeof useEditorSession>;
