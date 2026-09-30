import type { FloorFeature } from '@indoor/data';
import {
  type Building,
  changeFeatureKind,
  checkUnitCode,
  type DrawKind,
  type FacilityType,
  type Floor,
  type Geometry,
  KIND_SHAPE,
  type MapFeatureProperties,
  nextUnitCode,
  normalizeUnitCode,
  type VenueId,
} from '@indoor/domain';
import { boundsCenter, type LngLat, rotateGeometry, translateGeometry } from '@indoor/map-core';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { data } from '../../app/data-client';
import { useFacilityTypes } from '../facilities/queries';
import {
  type PropertiesPatch,
  pickFacilityTypeId,
  SHAPE_OF,
  saveQueue,
  UNIT_CODE_MESSAGES,
  unitCodePrefix,
  unitCodesOf,
} from './session-helpers';
import { type FeaturePatch, featureList, useEditorStore } from './store/editor-store';

const NO_FACILITY_TYPES: FacilityType[] = [];

import { type Change, type Direction, valueAfter } from './store/history';

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
  const facilityTypes = useFacilityTypes(venueId).data ?? NO_FACILITY_TYPES;
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

  /** Satu aksi editor: diterapkan ke store, dicatat di riwayat, lalu tiap fitur masuk antrean simpan. */
  const persist = useCallback(
    (patch: FeaturePatch, direction: Direction) => {
      for (const change of patch) {
        const value = valueAfter(change, direction);
        saveQueue().enqueue(
          change.id,
          value ? { type: 'save', value: { venueId, feature: value } } : { type: 'remove' },
        );
      }
    },
    [venueId],
  );

  const commit = useCallback(
    (patch: FeaturePatch) => {
      useEditorStore.getState().commit(patch);
      persist(patch, 'do');
    },
    [persist],
  );

  /** Undo/redo ikut memicu simpan otomatis. */
  const undo = useCallback(() => {
    const step = useEditorStore.getState().undo();
    if (step) persist(step.patch, step.direction);
  }, [persist]);

  const redo = useCallback(() => {
    const step = useEditorStore.getState().redo();
    if (step) persist(step.patch, step.direction);
  }, [persist]);

  /** Perubahan untuk beberapa fitur yang ada; fitur yang tidak ditemukan dilewati. */
  const changeEach = useCallback(
    (ids: readonly string[], fn: (feature: FloorFeature) => FloorFeature | null) => {
      const features = useEditorStore.getState().features;
      const patch: Change<FloorFeature>[] = [];
      for (const id of ids) {
        const before = features[id];
        if (before) patch.push({ id, before, after: fn(before) });
      }
      commit(patch);
    },
    [commit],
  );

  const newUnitCode = useCallback(() => {
    if (!floor) return '';
    return nextUnitCode(
      unitCodePrefix(floor, building),
      unitCodesOf(useEditorStore.getState().features),
    );
  }, [floor, building]);

  /** Fasilitas selalu punya jenis yang masih ada; `null` bila venue belum punya jenis. */
  const withFacilityType = useCallback(
    (drawKind: DrawKind): DrawKind | null => {
      if (drawKind.kind !== 'facility') return drawKind;
      const facilityTypeId = pickFacilityTypeId(drawKind.facilityTypeId, facilityTypes);
      return facilityTypeId ? { ...drawKind, facilityTypeId } : null;
    },
    [facilityTypes],
  );

  const draw = useCallback(
    (geometry: Geometry) => {
      if (!floor) return;
      const drawKind = withFacilityType(
        useEditorStore.getState().drawKinds[SHAPE_OF[geometry.type]],
      );
      if (!drawKind) return;
      const id = crypto.randomUUID();
      const base: MapFeatureProperties = { id, kind: 'corridor', floorId: floor.id };
      const properties = changeFeatureKind(base, drawKind, newUnitCode);
      commit([{ id, before: null, after: { type: 'Feature', id, geometry, properties } }]);
    },
    [floor, commit, newUnitCode, withFacilityType],
  );

  const update = useCallback(
    (id: string, patch: PropertiesPatch) =>
      changeEach([id], (current) => {
        const properties = { ...current.properties } as Record<string, unknown>;
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined) delete properties[key];
          else properties[key] = value;
        }
        return { ...current, properties: properties as unknown as MapFeatureProperties };
      }),
    [changeEach],
  );

  const changeKind = useCallback(
    (id: string, requested: DrawKind) => {
      const store = useEditorStore.getState();
      const current = store.features[id]?.properties;
      // Fitur yang sudah fasilitas mempertahankan jenisnya; lainnya memakai pilihan alat Titik.
      const preferred =
        requested.facilityTypeId ??
        (current?.kind === 'facility' ? current.facilityTypeId : undefined) ??
        store.drawKinds.point.facilityTypeId;
      const drawKind = withFacilityType(
        preferred ? { ...requested, facilityTypeId: preferred } : requested,
      );
      if (!drawKind) return;
      changeEach([id], (feature) =>
        KIND_SHAPE[drawKind.kind] === KIND_SHAPE[feature.properties.kind]
          ? {
              ...feature,
              properties: changeFeatureKind(feature.properties, drawKind, newUnitCode),
            }
          : feature,
      );
    },
    [changeEach, newUnitCode, withFacilityType],
  );

  /** Kode unit unik per venue; pesan menyebut unit yang bentrok. */
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
    (id: string, geometry: Geometry) => changeEach([id], (current) => ({ ...current, geometry })),
    [changeEach],
  );

  const removeMany = useCallback(
    (ids: readonly string[]) => changeEach(ids, () => null),
    [changeEach],
  );
  const remove = useCallback((id: string) => removeMany([id]), [removeMany]);

  /** Aksi massal = satu langkah riwayat; tiap fitur tetap disimpan sendiri. */
  const transformMany = useCallback(
    (ids: readonly string[], fn: (geometry: Geometry) => Geometry) =>
      changeEach(ids, (current) => ({ ...current, geometry: fn(current.geometry) })),
    [changeEach],
  );

  const moveMany = useCallback(
    (ids: readonly string[], from: LngLat, to: LngLat) =>
      transformMany(ids, (g) => translateGeometry(g, from, to)),
    [transformMany],
  );

  /** Putar terhadap pusat kotak batas seluruh fitur terpilih, searah jarum jam. */
  const rotateMany = useCallback(
    (ids: readonly string[], degrees: number) => {
      const features = useEditorStore.getState().features;
      const origin = boundsCenter(
        ids.flatMap((id) => (features[id] ? [features[id].geometry] : [])),
      );
      if (origin) transformMany(ids, (g) => rotateGeometry(g, degrees, origin));
    },
    [transformMany],
  );

  return useMemo(
    () => ({
      ready: loaded,
      error: query.error,
      isOutdoor: floor?.isOutdoor ?? false,
      facilityTypes,
      draw,
      editGeometry,
      update,
      changeKind,
      setUnitCode,
      remove,
      removeMany,
      moveMany,
      rotateMany,
      undo,
      redo,
      retry: () => saveQueue().retry(),
    }),
    [
      loaded,
      query.error,
      floor?.isOutdoor,
      facilityTypes,
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
