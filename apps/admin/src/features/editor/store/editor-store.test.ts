import type { FloorFeature } from '@indoor/data';
import { addPath, type FloorId, type NavGraph } from '@indoor/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import { combinedSave, useEditorStore } from './editor-store';

const floorId = '30000000-0000-4000-8000-000000000001' as FloorId;
const unit = (id: string, x: number): FloorFeature => ({
  type: 'Feature',
  id,
  geometry: { type: 'Point', coordinates: [x, 0] },
  properties: {
    id,
    kind: 'unit',
    floorId,
    unitCode: `U-${id}`,
    unitStatus: 'renovation',
    areaM2: 12.5,
  },
});

describe('store editor: command dan riwayat', () => {
  beforeEach(() => {
    useEditorStore
      .getState()
      .load(floorId, { type: 'FeatureCollection', features: [unit('a', 1)] }, false);
  });

  it('undo penghapusan memulihkan fitur beserta propertinya; redo menghapus lagi', () => {
    const store = useEditorStore.getState();
    const before = store.features.a as FloorFeature;
    store.select('a');
    store.commit([{ id: 'a', before, after: null }]);
    expect(useEditorStore.getState().features).toEqual({});
    expect(useEditorStore.getState().selectedIds).toEqual([]);

    const undone = useEditorStore.getState().undo();
    expect(undone?.direction).toBe('undo');
    expect(useEditorStore.getState().features.a).toEqual(before);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().features.a).toBeUndefined();
  });

  it('riwayat dibersihkan saat lantai dimuat ulang', () => {
    const store = useEditorStore.getState();
    store.commit([{ id: 'b', before: null, after: unit('b', 2) }]);
    expect(useEditorStore.getState().history.past).toHaveLength(1);
    store.load(floorId, { type: 'FeatureCollection', features: [] }, false);
    expect(useEditorStore.getState().history).toEqual({ past: [], future: [] });
    expect(useEditorStore.getState().undo()).toBeNull();
  });

  it('focus dari daftar memilih satu fitur, kembali ke alat pilih, dan meminta kamera', () => {
    const store = useEditorStore.getState();
    store.commit([{ id: 'b', before: null, after: unit('b', 2) }]);
    store.setTool('polygon');
    store.focus('b');
    const first = useEditorStore.getState();
    expect(first.selectedIds).toEqual(['b']);
    expect(first.tool).toBe('select');
    expect(first.focusRequest?.id).toBe('b');
    // Klik ulang item yang sama tetap menerbangkan peta.
    first.focus('b');
    expect(useEditorStore.getState().focusRequest?.seq).toBe((first.focusRequest?.seq ?? 0) + 1);
    // Fitur yang tidak ada diabaikan; riwayat undo tidak berubah.
    useEditorStore.getState().focus('tidak-ada');
    expect(useEditorStore.getState().selectedIds).toEqual(['b']);
    expect(useEditorStore.getState().history.past).toHaveLength(1);
  });

  it('3D untuk memeriksa: alat kembali ke Pilih; memilih alat gambar kembali ke 2D', () => {
    const store = useEditorStore.getState();
    store.setTool('polygon');
    store.setViewMode('3d');
    expect(useEditorStore.getState()).toMatchObject({ viewMode: '3d', tool: 'select' });
    useEditorStore.getState().setTool('linestring');
    expect(useEditorStore.getState()).toMatchObject({ viewMode: '2d', tool: 'linestring' });
    // Perubahan fitur tidak hilang saat berganti mode.
    expect(useEditorStore.getState().features.a).toBeDefined();
  });
});

describe('store editor: graf jalur', () => {
  const empty: NavGraph = { nodes: {}, edges: {} };
  let n = 0;
  const newId = () => `g${++n}`;
  const line = (graph: NavGraph, from: [number, number], to: [number, number]) =>
    addPath(graph, [from, to], { floorId, newId });

  beforeEach(() => {
    useEditorStore
      .getState()
      .load(floorId, { type: 'FeatureCollection', features: [unit('a', 1)] }, false, empty);
  });

  it('aksi graf dan fitur berbagi satu riwayat undo/redo', () => {
    const store = useEditorStore.getState();
    store.commit([{ id: 'b', before: null, after: unit('b', 2) }]);
    store.commitGraph(line(empty, [106.8, -6.17], [106.8003, -6.17]));
    const drawn = useEditorStore.getState().graph;
    expect(Object.keys(drawn.edges)).toHaveLength(1);

    const undone = useEditorStore.getState().undo();
    expect(undone?.patch.edges).toHaveLength(1);
    expect(useEditorStore.getState().graph).toEqual(empty);
    expect(useEditorStore.getState().features.b).toBeDefined();
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().features.b).toBeUndefined();
    useEditorStore.getState().redo();
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().graph).toEqual(drawn);
  });

  it('seleksi graf dan seleksi fitur saling menggantikan; elemen yang hilang lepas dari seleksi', () => {
    const store = useEditorStore.getState();
    store.commitGraph(line(empty, [106.8, -6.17], [106.8003, -6.17]));
    const [edgeId] = Object.keys(useEditorStore.getState().graph.edges);
    store.select('a');
    store.selectGraph({ kind: 'edge', id: edgeId ?? '' });
    expect(useEditorStore.getState()).toMatchObject({
      selectedIds: [],
      graphSelection: { id: edgeId },
    });
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().graphSelection).toBeNull();
    useEditorStore.getState().select('a');
    expect(useEditorStore.getState().graphSelection).toBeNull();
    useEditorStore.getState().setTool('path');
    expect(useEditorStore.getState().selectedIds).toEqual([]);
  });

  it('menyembunyikan node melepas node terpilih; alat Jalur dan Konektor menampilkan graf lagi', () => {
    const store = useEditorStore.getState();
    store.commitGraph(line(empty, [106.8, -6.17], [106.8003, -6.17]));
    const [nodeId = ''] = Object.keys(useEditorStore.getState().graph.nodes);
    store.selectGraph({ kind: 'node', id: nodeId });
    store.setGraphVisible('edges', false);
    expect(useEditorStore.getState().graphSelection).toEqual({ kind: 'node', id: nodeId });
    store.setGraphVisible('nodes', false);
    expect(useEditorStore.getState()).toMatchObject({
      graphSelection: null,
      graphVisibility: { nodes: false, edges: false },
    });
    // Sakelar tetap saat lantai dimuat ulang.
    store.load(floorId, { type: 'FeatureCollection', features: [] }, false, empty);
    expect(useEditorStore.getState().graphVisibility).toEqual({ nodes: false, edges: false });
    store.setTool('polygon');
    expect(useEditorStore.getState().graphVisibility.nodes).toBe(false);
    store.setTool('connector');
    expect(useEditorStore.getState().graphVisibility).toEqual({ nodes: true, edges: true });
    store.setGraphVisible('edges', false);
    store.setTool('path');
    expect(useEditorStore.getState().graphVisibility.edges).toBe(true);
  });

  it('aksi kosong tidak masuk riwayat', () => {
    const store = useEditorStore.getState();
    store.commit([]);
    store.commitGraph({ nodes: [], edges: [] });
    expect(useEditorStore.getState().history.past).toEqual([]);
  });

  it('status simpan gabungan: galat lebih dulu, lalu menyimpan, lalu tersimpan', () => {
    const store = useEditorStore.getState();
    store.setSaveStatus('features', 'saved', null);
    store.setSaveStatus('graph', 'saving', null);
    expect(combinedSave(useEditorStore.getState()).status).toBe('saving');
    store.setSaveStatus('graph', 'error', 'jaringan');
    expect(combinedSave(useEditorStore.getState())).toEqual({ status: 'error', error: 'jaringan' });
    store.setSaveStatus('graph', 'saved', null);
    expect(combinedSave(useEditorStore.getState()).status).toBe('saved');
  });
});
