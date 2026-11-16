import { type MapFeatureProperties, MODEL_LIBRARY } from '@indoor/domain';
import type { Feature, Geometry } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { Box3, Mesh } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FloorFeatureCollection } from '../src/map';
import {
  type ModelsLayerController,
  modelsLoaded,
  placedModels,
  setModelsLayerFactory,
  syncModels,
} from '../src/models';
import { libraryModel } from '../src/models-library';

const point = (
  id: string,
  properties: Partial<MapFeatureProperties>,
  coordinates: [number, number] = [106.8, -6.1],
): Feature<Geometry, MapFeatureProperties> => ({
  type: 'Feature',
  id,
  geometry: { type: 'Point', coordinates },
  properties: { id, kind: 'model3d', floorId: 'f', ...properties },
});

const collection = (
  ...features: Feature<Geometry, MapFeatureProperties>[]
): FloorFeatureCollection => ({
  type: 'FeatureCollection',
  features,
});

describe('placedModels', () => {
  it('hanya fitur model3d dengan model sah; nilai bawaan skala 1, rotasi 0, tinggi dasar 0', () => {
    const features = collection(
      point('a', { model: 'builtin:tree' }),
      point(
        'b',
        {
          model: 'models/0b9f3c2e-1d4a-4c6b-8e7f-123456789abc/patung.glb',
          modelScale: 2,
          modelRotation: 90,
          baseHeight: 3,
        },
        [106.81, -6.11],
      ),
      point('c', { model: 'https://luar.id/x.glb' }),
      point('d', { kind: 'landmark', model: 'builtin:tree' }),
    );
    expect(placedModels(features)).toEqual([
      {
        id: 'a',
        model: 'builtin:tree',
        lngLat: [106.8, -6.1],
        scale: 1,
        rotation: 0,
        baseHeight: 0,
      },
      {
        id: 'b',
        model: 'models/0b9f3c2e-1d4a-4c6b-8e7f-123456789abc/patung.glb',
        lngLat: [106.81, -6.11],
        scale: 2,
        rotation: 90,
        baseHeight: 3,
      },
    ]);
  });
});

describe('syncModels', () => {
  afterEach(() => setModelsLayerFactory(null));

  function fakeFactory() {
    const setModels = vi.fn();
    const controller: ModelsLayerController = { setModels, remove: vi.fn() };
    const loader = vi.fn(async () => () => controller);
    setModelsLayerFactory(loader);
    return { loader, setModels };
  }

  it('lapisan Three.js tidak dimuat di 2D atau bila lantai tanpa objek 3D', async () => {
    const { loader } = fakeFactory();
    const map = {} as MapLibreMap;
    await syncModels(map, collection(point('a', { model: 'builtin:tree' })), '2d');
    await syncModels(map, collection(), '3d');
    expect(loader).not.toHaveBeenCalled();
    expect(modelsLoaded(map)).toBe(false);
  });

  it('dimuat sekali saat 3D dibuka, lalu dikosongkan saat kembali ke 2D', async () => {
    const { loader, setModels } = fakeFactory();
    const map = {} as MapLibreMap;
    const features = collection(point('a', { model: 'builtin:bench' }));
    await Promise.all([syncModels(map, features, '3d'), syncModels(map, features, '3d')]);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(modelsLoaded(map)).toBe(true);
    expect(setModels).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'a' })]);
    await syncModels(map, features, '2d');
    expect(setModels).toHaveBeenLastCalledWith([]);
  });
});

describe('pustaka objek bawaan', () => {
  it.each(MODEL_LIBRARY)('%s: low-poly, berdiri di lantai, ukuran wajar dalam meter', (key) => {
    const group = libraryModel(key);
    let triangles = 0;
    group.traverse((object) => {
      if (object instanceof Mesh) {
        const geometry = object.geometry;
        triangles += (geometry.index?.count ?? geometry.attributes.position?.count ?? 0) / 3;
      }
    });
    const bounds = new Box3().setFromObject(group);
    expect(triangles).toBeGreaterThan(0);
    expect(triangles).toBeLessThan(2000);
    expect(bounds.min.y).toBeCloseTo(0, 1);
    expect(bounds.max.y).toBeGreaterThan(0.5);
    expect(bounds.max.y).toBeLessThan(6);
  });
});
