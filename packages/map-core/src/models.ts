import { MODEL_BASE_HEIGHT, MODEL_SCALE, parseModelRef } from '@indoor/domain';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { FloorFeatureCollection, ViewMode } from './map';

export const MODELS_LAYER_ID = 'models-3d';

export interface PlacedModel {
  id: string;
  model: string;
  lngLat: [number, number];
  scale: number;
  rotation: number;
  baseHeight: number;
}

export type ModelUrl = (path: string) => string;

export interface ModelsLayerController {
  setModels(models: readonly PlacedModel[]): void;
  remove(): void;
}

export type ModelsLayerFactory = (
  map: MapLibreMap,
  modelUrl: ModelUrl | undefined,
) => ModelsLayerController;

export function placedModels(features: FloorFeatureCollection): PlacedModel[] {
  const models: PlacedModel[] = [];
  for (const feature of features.features) {
    const p = feature.properties;
    if (p.kind !== 'model3d' || feature.geometry.type !== 'Point') continue;
    if (!p.model || !parseModelRef(p.model)) continue;
    const [lng = 0, lat = 0] = feature.geometry.coordinates;
    models.push({
      id: p.id,
      model: p.model,
      lngLat: [lng, lat],
      scale: p.modelScale ?? MODEL_SCALE.default,
      rotation: p.modelRotation ?? 0,
      baseHeight: p.baseHeight ?? MODEL_BASE_HEIGHT.default,
    });
  }
  return models;
}

interface ModelsState {
  models: PlacedModel[];
  controller: ModelsLayerController | null;
  loading: Promise<void> | null;
  modelUrl: ModelUrl | undefined;
}

const states = new WeakMap<MapLibreMap, ModelsState>();

const loadThreeLayer = async (): Promise<ModelsLayerFactory> =>
  (await import('./models-layer')).createModelsLayer;

let factoryLoader: () => Promise<ModelsLayerFactory> = loadThreeLayer;

export function setModelsLayerFactory(loader: (() => Promise<ModelsLayerFactory>) | null): void {
  factoryLoader = loader ?? loadThreeLayer;
}

function stateOf(map: MapLibreMap): ModelsState {
  let state = states.get(map);
  if (!state) {
    state = { models: [], controller: null, loading: null, modelUrl: undefined };
    states.set(map, state);
  }
  return state;
}

export function setModelUrl(map: MapLibreMap, modelUrl: ModelUrl | undefined): void {
  stateOf(map).modelUrl = modelUrl;
}

export function syncModels(
  map: MapLibreMap,
  features: FloorFeatureCollection,
  mode: ViewMode,
): Promise<void> {
  const state = stateOf(map);
  state.models = mode === '3d' ? placedModels(features) : [];
  if (state.controller) {
    state.controller.setModels(state.models);
    return Promise.resolve();
  }
  if (state.models.length === 0) return state.loading ?? Promise.resolve();
  state.loading ??= factoryLoader()
    .then((create) => {
      if (states.get(map) !== state) return;
      state.controller = create(map, state.modelUrl);
      state.controller.setModels(state.models);
    })
    .catch(() => undefined)
    .finally(() => {
      state.loading = null;
    });
  return state.loading;
}

export function modelsLoaded(map: MapLibreMap): boolean {
  return states.get(map)?.controller != null;
}

export function removeModels(map: MapLibreMap): void {
  states.get(map)?.controller?.remove();
  states.delete(map);
}
