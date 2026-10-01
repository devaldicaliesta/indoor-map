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
  removeEntrancesOf,
  type VenueId,
} from '@indoor/domain';
import { boundsCenter, type LngLat, rotateGeometry, translateGeometry } from '@indoor/map-core';
import { useCallback, useMemo } from 'react';
import { data } from '../../app/data-client';
import { useFacilityTypes } from '../facilities/queries';
import { useGraphActions } from './graph/use-graph-actions';
import {
  editorQueues,
  type PropertiesPatch,
  pickFacilityTypeId,
  SHAPE_OF,
  UNIT_CODE_MESSAGES,
  unitCodePrefix,
  unitCodesOf,
} from './session-helpers';
import { featureList, useEditorStore } from './store/editor-store';
import type { Change } from './store/history';
import { useEditorPersistence } from './use-editor-persistence';

const NO_FACILITY_TYPES: FacilityType[] = [];

/**
 * Menghubungkan store editor dengan database untuk satu lantai: memuat fitur dan graf jalur,
 * lalu setiap perubahan masuk antrean simpan (debounce ±800 ms).
 */
export function useEditorSession(
  venueId: VenueId,
  floor: Floor | undefined,
  building: Building | undefined,
) {
  const floorId = floor?.id ?? null;
  const facilityTypes = useFacilityTypes(venueId).data ?? NO_FACILITY_TYPES;
  const { loaded, error, commit, commitGraph, undo, redo } = useEditorPersistence(venueId, floor);
  const graph = useGraphActions(floorId, commitGraph);

  /**
   * Perubahan untuk beberapa fitur yang ada; fitur yang tidak ditemukan dilewati. Fitur yang
   * dihapus ikut menghapus titik masuknya di graf dalam langkah undo yang sama.
   */
  const changeEach = useCallback(
    (ids: readonly string[], fn: (feature: FloorFeature) => FloorFeature | null) => {
      const { features, graph } = useEditorStore.getState();
      const patch: Change<FloorFeature>[] = [];
      for (const id of ids) {
        const before = features[id];
        if (before) patch.push({ id, before, after: fn(before) });
      }
      const removed = patch.flatMap((change) => (change.after ? [] : [change.id]));
      commit(patch, removed.length ? removeEntrancesOf(graph, removed) : undefined);
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
      error,
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
      graph,
      retry: () => {
        for (const queue of editorQueues()) queue.retry();
      },
    }),
    [
      loaded,
      error,
      floor?.isOutdoor,
      facilityTypes,
      draw,
      editGeometry,
      update,
      changeKind,
      setUnitCode,
      remove,
      graph,
    ],
  );
}

export type EditorSession = ReturnType<typeof useEditorSession>;
