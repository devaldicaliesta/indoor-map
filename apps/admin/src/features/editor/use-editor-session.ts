import type { FloorFeature } from '@indoor/data';
import {
  type Building,
  defaultFeatureKind,
  type Floor,
  type Geometry,
  type MapFeatureProperties,
  nextUnitCode,
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
    if (floorId && query.data && !loaded) useEditorStore.getState().load(floorId, query.data);
  }, [floorId, query.data, loaded]);

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

  const draw = useCallback(
    (geometry: Geometry) => {
      if (!floor) return;
      const store = useEditorStore.getState();
      const kind = defaultFeatureKind(geometry.type, floor.isOutdoor);
      const id = crypto.randomUUID();
      const properties: MapFeatureProperties = { id, kind, floorId: floor.id };
      if (kind === 'unit') {
        const codes = featureList(store.features).flatMap((f) =>
          f.properties.unitCode ? [f.properties.unitCode] : [],
        );
        properties.unitCode = nextUnitCode(unitCodePrefix(floor, building), codes);
      }
      const feature: FloorFeature = { type: 'Feature', id, geometry, properties };
      store.put(feature);
      enqueue(feature);
    },
    [floor, building, enqueue],
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
      draw,
      editGeometry,
      remove,
      retry: () => saveQueue().retry(),
    }),
    [loaded, query.error, draw, editGeometry, remove],
  );
}

export type EditorSession = ReturnType<typeof useEditorSession>;
