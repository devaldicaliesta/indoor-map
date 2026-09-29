import type { FloorFeature, FloorFeatures } from '@indoor/data';
import type { FloorId, Geometry } from '@indoor/domain';
import type { EditorTool } from '@indoor/map-core';
import { create } from 'zustand';
import type { SaveStatus } from './save-queue';

interface EditorState {
  floorId: FloorId | null;
  /** Sumber kebenaran geometri lantai yang sedang disunting, berkunci id fitur. */
  features: Record<string, FloorFeature>;
  selectedId: string | null;
  tool: EditorTool;
  saveStatus: SaveStatus;
  saveError: string | null;

  load(floorId: FloorId, collection: FloorFeatures): void;
  put(feature: FloorFeature): void;
  setGeometry(id: string, geometry: Geometry): FloorFeature | null;
  remove(id: string): void;
  select(id: string | null): void;
  setTool(tool: EditorTool): void;
  setSaveStatus(status: SaveStatus, error: string | null): void;
}

/** Store editor per lantai (03-arsitektur.md): memuat lantai lain mengganti seluruh isinya. */
export const useEditorStore = create<EditorState>()((set, get) => ({
  floorId: null,
  features: {},
  selectedId: null,
  tool: 'select',
  saveStatus: 'idle',
  saveError: null,

  load(floorId, collection) {
    const features: Record<string, FloorFeature> = {};
    for (const f of collection.features) features[f.properties.id] = f;
    set({ floorId, features, selectedId: null, saveStatus: 'idle', saveError: null });
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
      return { features: rest, selectedId: s.selectedId === id ? null : s.selectedId };
    });
  },
  select(id) {
    set({ selectedId: id });
  },
  setTool(tool) {
    set((s) => ({ tool, selectedId: tool === 'select' ? s.selectedId : null }));
  },
  setSaveStatus(saveStatus, saveError) {
    set({ saveStatus, saveError });
  },
}));

export const featureList = (features: Record<string, FloorFeature>) => Object.values(features);
