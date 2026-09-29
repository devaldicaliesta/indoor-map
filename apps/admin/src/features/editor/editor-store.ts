import type { FloorFeature, FloorFeatures } from '@indoor/data';
import {
  type DrawKind,
  drawKindsFor,
  type FeatureShape,
  type FloorId,
  type Geometry,
} from '@indoor/domain';
import type { EditorTool } from '@indoor/map-core';
import { create } from 'zustand';
import type { SaveStatus } from './save-queue';

interface EditorState {
  floorId: FloorId | null;
  /** Sumber kebenaran geometri lantai yang sedang disunting, berkunci id fitur. */
  features: Record<string, FloorFeature>;
  /** Seleksi; satu fitur = sunting bentuk, lebih dari satu = geser/putar/hapus bersama. */
  selectedIds: string[];
  /** FR-MAP-04: sakelar snapping di bilah status. */
  snapEnabled: boolean;
  tool: EditorTool;
  saveStatus: SaveStatus;
  saveError: string | null;
  /** Jenis yang dipakai tiap alat gambar (FR-MAP-01). */
  drawKinds: Record<FeatureShape, DrawKind>;

  load(floorId: FloorId, collection: FloorFeatures, isOutdoor: boolean): void;
  setDrawKind(shape: FeatureShape, kind: DrawKind): void;
  put(feature: FloorFeature): void;
  setGeometry(id: string, geometry: Geometry): FloorFeature | null;
  remove(id: string): void;
  select(id: string | null): void;
  /** Shift+klik: menambah atau mengurangi satu fitur dari seleksi. */
  toggleSelect(id: string): void;
  selectMany(ids: string[]): void;
  setSnapEnabled(enabled: boolean): void;
  setTool(tool: EditorTool): void;
  setSaveStatus(status: SaveStatus, error: string | null): void;
}

function defaultDrawKinds(isOutdoor: boolean): Record<FeatureShape, DrawKind> {
  const first = (shape: FeatureShape) => drawKindsFor(shape, isOutdoor)[0] ?? { kind: 'wall' };
  return { polygon: first('polygon'), linestring: first('linestring'), point: first('point') };
}

/** Store editor per lantai (03-arsitektur.md): memuat lantai lain mengganti seluruh isinya. */
export const useEditorStore = create<EditorState>()((set, get) => ({
  floorId: null,
  features: {},
  selectedIds: [],
  snapEnabled: true,
  tool: 'select',
  saveStatus: 'idle',
  saveError: null,
  drawKinds: defaultDrawKinds(false),

  load(floorId, collection, isOutdoor) {
    const features: Record<string, FloorFeature> = {};
    for (const f of collection.features) features[f.properties.id] = f;
    set({
      floorId,
      features,
      selectedIds: [],
      saveStatus: 'idle',
      saveError: null,
      drawKinds: defaultDrawKinds(isOutdoor),
    });
  },
  setDrawKind(shape, kind) {
    set((s) => ({ drawKinds: { ...s.drawKinds, [shape]: kind } }));
  },
  put(feature) {
    set((s) => ({ features: { ...s.features, [feature.properties.id]: feature } }));
  },
  setGeometry(id, geometry) {
    const current = get().features[id];
    if (!current) return null;
    const next = { ...current, geometry };
    set((s) => ({ features: { ...s.features, [id]: next } }));
    return next;
  },
  remove(id) {
    set((s) => {
      const { [id]: _removed, ...rest } = s.features;
      return { features: rest, selectedIds: s.selectedIds.filter((x) => x !== id) };
    });
  },
  select(id) {
    set({ selectedIds: id ? [id] : [] });
  },
  toggleSelect(id) {
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    }));
  },
  selectMany(ids) {
    set((s) => ({ selectedIds: [...new Set([...s.selectedIds, ...ids])] }));
  },
  setSnapEnabled(snapEnabled) {
    set({ snapEnabled });
  },
  setTool(tool) {
    set((s) => ({ tool, selectedIds: tool === 'select' ? s.selectedIds : [] }));
  },
  setSaveStatus(saveStatus, saveError) {
    set({ saveStatus, saveError });
  },
}));

export const featureList = (features: Record<string, FloorFeature>) => Object.values(features);

/** Fitur tunggal yang terpilih (bentuknya bisa disunting), atau `undefined`. */
export const singleSelected = (s: Pick<EditorState, 'selectedIds' | 'features'>) =>
  s.selectedIds.length === 1 ? s.features[s.selectedIds[0] as string] : undefined;
