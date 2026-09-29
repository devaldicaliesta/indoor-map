import type { FloorFeature, FloorFeatures } from '@indoor/data';
import { type DrawKind, drawKindsFor, type FeatureShape, type FloorId } from '@indoor/domain';
import type { EditorTool } from '@indoor/map-core';
import { create } from 'zustand';
import {
  applyPatch,
  type Direction,
  emptyHistory,
  type History,
  type Patch,
  record,
  redo,
  undo,
} from './history';
import type { SaveStatus } from './save-queue';

export type FeaturePatch = Patch<FloorFeature>;

export interface EditorState {
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
  /** Riwayat undo/redo lantai ini; tidak disimpan ke database. */
  history: History<FloorFeature>;
  /** Menjalankan satu aksi (buat/ubah/hapus/massal) dan mencatatnya di riwayat. */
  commit(patch: FeaturePatch): void;
  /** Membatalkan/mengulang satu aksi; mengembalikan patch dan arahnya untuk disimpan. */
  undo(): { patch: FeaturePatch; direction: Direction } | null;
  redo(): { patch: FeaturePatch; direction: Direction } | null;
  select(id: string | null): void;
  /** Shift+klik: menambah atau mengurangi satu fitur dari seleksi. */
  toggleSelect(id: string): void;
  selectMany(ids: string[]): void;
  setSnapEnabled(enabled: boolean): void;
  setTool(tool: EditorTool): void;
  setSaveStatus(status: SaveStatus, error: string | null): void;
}

/** Fitur yang hilang karena patch ikut keluar dari seleksi. */
function withPatch(
  state: Pick<EditorState, 'features' | 'selectedIds'>,
  patch: FeaturePatch,
  direction: Direction,
  history: History<FloorFeature>,
) {
  const features = applyPatch(state.features, patch, direction);
  return { features, history, selectedIds: state.selectedIds.filter((id) => id in features) };
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
  history: emptyHistory(),

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
      history: emptyHistory(),
    });
  },
  setDrawKind(shape, kind) {
    set((s) => ({ drawKinds: { ...s.drawKinds, [shape]: kind } }));
  },
  commit(patch) {
    if (patch.length === 0) return;
    set((s) => withPatch(s, patch, 'do', record(s.history, patch)));
  },
  undo() {
    const step = undo(get().history);
    if (!step) return null;
    set((s) => withPatch(s, step.patch, 'undo', step.history));
    return { patch: step.patch, direction: 'undo' };
  },
  redo() {
    const step = redo(get().history);
    if (!step) return null;
    set((s) => withPatch(s, step.patch, 'do', step.history));
    return { patch: step.patch, direction: 'do' };
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
