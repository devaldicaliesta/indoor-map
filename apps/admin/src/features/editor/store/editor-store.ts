import type { FloorFeature, FloorFeatures } from '@indoor/data';
import {
  type DrawKind,
  drawKindsFor,
  type FeatureShape,
  type FloorId,
  type GraphPatch,
  type NavEdge,
  type NavGraph,
  type NavNode,
} from '@indoor/domain';
import type { EditorTool, GraphElement, ViewMode } from '@indoor/map-core';
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

/** Satu aksi editor: perubahan fitur dan graf jalur dicatat bersama sebagai satu langkah undo. */
export interface EditorPatch {
  features: FeaturePatch;
  nodes: Patch<NavNode>;
  edges: Patch<NavEdge>;
}

export type SaveSource = 'features' | 'graph';
interface SaveState {
  status: SaveStatus;
  error: string | null;
}

const EMPTY_GRAPH: NavGraph = { nodes: {}, edges: {} };
const IDLE: SaveState = { status: 'idle', error: null };

export interface EditorState {
  floorId: FloorId | null;
  /** Sumber kebenaran geometri lantai yang sedang disunting, berkunci id fitur. */
  features: Record<string, FloorFeature>;
  /** Graf jalur lantai yang sedang disunting. */
  graph: NavGraph;
  /** Seleksi; satu fitur = sunting bentuk, lebih dari satu = geser/putar/hapus bersama. */
  selectedIds: string[];
  /** Node atau edge graf terpilih; tidak pernah bersamaan dengan seleksi fitur. */
  graphSelection: GraphElement | null;
  snapEnabled: boolean;
  tool: EditorTool;
  saves: Record<SaveSource, SaveState>;
  drawKinds: Record<FeatureShape, DrawKind>;
  /** 3D hanya untuk memeriksa hasil; menggambar dan menyunting bentuk di 2D. */
  viewMode: ViewMode;
  /** Fitur yang disorot sementara dari panel daftar (hover/fokus), bukan seleksi. */
  hoveredId: string | null;
  /** Permintaan kamera dari panel daftar; `seq` naik setiap klik agar klik ulang tetap terbang. */
  focusRequest: { id: string; seq: number } | null;

  load(floorId: FloorId, collection: FloorFeatures, isOutdoor: boolean, graph?: NavGraph): void;
  setDrawKind(shape: FeatureShape, kind: DrawKind): void;
  /** Riwayat undo/redo lantai ini; tidak disimpan ke database. */
  history: History<EditorPatch>;
  /**
   * Menjalankan satu aksi pada fitur (buat/ubah/hapus/massal) dan mencatatnya di riwayat; `graph`
   * untuk perubahan graf yang menyertainya (misalnya titik masuk unit yang dihapus).
   */
  commit(patch: FeaturePatch, graph?: GraphPatch): void;
  /** Menjalankan satu aksi pada graf jalur dan mencatatnya di riwayat yang sama. */
  commitGraph(patch: GraphPatch): void;
  /** Membatalkan/mengulang satu aksi; mengembalikan patch dan arahnya untuk disimpan. */
  undo(): { patch: EditorPatch; direction: Direction } | null;
  redo(): { patch: EditorPatch; direction: Direction } | null;
  select(id: string | null): void;
  /** Shift+klik: menambah atau mengurangi satu fitur dari seleksi. */
  toggleSelect(id: string): void;
  selectMany(ids: string[]): void;
  selectGraph(element: GraphElement | null): void;
  focus(id: string): void;
  setHovered(id: string | null): void;
  setViewMode(mode: ViewMode): void;
  setSnapEnabled(enabled: boolean): void;
  setTool(tool: EditorTool): void;
  setSaveStatus(source: SaveSource, status: SaveStatus, error: string | null): void;
}

const isEmpty = (patch: EditorPatch) =>
  patch.features.length === 0 && patch.nodes.length === 0 && patch.edges.length === 0;

/** Fitur atau elemen graf yang hilang karena patch ikut keluar dari seleksi. */
function withPatch(
  state: Pick<EditorState, 'features' | 'graph' | 'selectedIds' | 'graphSelection'>,
  patch: EditorPatch,
  direction: Direction,
  history: History<EditorPatch>,
) {
  const features = patch.features.length
    ? applyPatch(state.features, patch.features, direction)
    : state.features;
  const graph =
    patch.nodes.length || patch.edges.length
      ? {
          nodes: applyPatch(state.graph.nodes, patch.nodes, direction),
          edges: applyPatch(state.graph.edges, patch.edges, direction),
        }
      : state.graph;
  const selected = state.graphSelection;
  const graphSelection =
    selected && (selected.kind === 'node' ? graph.nodes : graph.edges)[selected.id]
      ? selected
      : null;
  return {
    features,
    graph,
    history,
    graphSelection,
    selectedIds: state.selectedIds.filter((id) => id in features),
  };
}

function defaultDrawKinds(isOutdoor: boolean): Record<FeatureShape, DrawKind> {
  const first = (shape: FeatureShape) => drawKindsFor(shape, isOutdoor)[0] ?? { kind: 'wall' };
  return { polygon: first('polygon'), linestring: first('linestring'), point: first('point') };
}

/** Store editor per lantai (03-arsitektur.md): memuat lantai lain mengganti seluruh isinya. */
export const useEditorStore = create<EditorState>()((set, get) => {
  function apply(patch: EditorPatch) {
    if (isEmpty(patch)) return;
    set((s) => withPatch(s, patch, 'do', record(s.history, patch)));
  }
  return {
    floorId: null,
    features: {},
    graph: EMPTY_GRAPH,
    selectedIds: [],
    graphSelection: null,
    snapEnabled: true,
    tool: 'select',
    saves: { features: IDLE, graph: IDLE },
    drawKinds: defaultDrawKinds(false),
    viewMode: '2d',
    hoveredId: null,
    focusRequest: null,
    history: emptyHistory(),

    load(floorId, collection, isOutdoor, graph = EMPTY_GRAPH) {
      const features: Record<string, FloorFeature> = {};
      for (const f of collection.features) features[f.properties.id] = f;
      set({
        floorId,
        features,
        graph,
        selectedIds: [],
        graphSelection: null,
        saves: { features: IDLE, graph: IDLE },
        drawKinds: defaultDrawKinds(isOutdoor),
        hoveredId: null,
        focusRequest: null,
        history: emptyHistory(),
      });
    },
    setDrawKind(shape, kind) {
      set((s) => ({ drawKinds: { ...s.drawKinds, [shape]: kind } }));
    },
    commit(features, graph) {
      apply({ features, nodes: graph?.nodes ?? [], edges: graph?.edges ?? [] });
    },
    commitGraph(patch) {
      apply({ features: [], nodes: patch.nodes, edges: patch.edges });
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
      set({ selectedIds: id ? [id] : [], graphSelection: null });
    },
    toggleSelect(id) {
      set((s) => ({
        graphSelection: null,
        selectedIds: s.selectedIds.includes(id)
          ? s.selectedIds.filter((x) => x !== id)
          : [...s.selectedIds, id],
      }));
    },
    selectMany(ids) {
      set((s) => ({ graphSelection: null, selectedIds: [...new Set([...s.selectedIds, ...ids])] }));
    },
    selectGraph(graphSelection) {
      set({ graphSelection, selectedIds: [] });
    },
    focus(id) {
      if (!get().features[id]) return;
      // Memilih dari daftar berarti ingin melihat/menyunting fitur itu: kembali ke alat pilih.
      set((s) => ({
        selectedIds: [id],
        graphSelection: null,
        tool: 'select',
        focusRequest: { id, seq: (s.focusRequest?.seq ?? 0) + 1 },
      }));
    },
    setHovered(hoveredId) {
      set({ hoveredId });
    },
    setSnapEnabled(snapEnabled) {
      set({ snapEnabled });
    },
    setTool(tool) {
      // Menggambar selalu di 2D.
      set((s) => ({
        tool,
        selectedIds: tool === 'select' ? s.selectedIds : [],
        graphSelection: tool === 'select' ? s.graphSelection : null,
        viewMode: tool === 'select' ? s.viewMode : '2d',
      }));
    },
    setViewMode(viewMode) {
      set((s) => ({ viewMode, tool: viewMode === '3d' ? 'select' : s.tool }));
    },
    setSaveStatus(source, status, error) {
      set((s) => ({ saves: { ...s.saves, [source]: { status, error } } }));
    },
  };
});

export const featureList = (features: Record<string, FloorFeature>) => Object.values(features);

/** Fitur tunggal yang terpilih (bentuknya bisa disunting), atau `undefined`. */
export const singleSelected = (s: Pick<EditorState, 'selectedIds' | 'features'>) =>
  s.selectedIds.length === 1 ? s.features[s.selectedIds[0] as string] : undefined;

/** Status simpan gabungan fitur dan graf untuk indikator di bilah atas. */
export function combinedSave(s: Pick<EditorState, 'saves'>): SaveState {
  const states = Object.values(s.saves);
  return (
    states.find((x) => x.status === 'error') ??
    states.find((x) => x.status === 'saving') ??
    states.find((x) => x.status === 'saved') ??
    IDLE
  );
}
