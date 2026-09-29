import type { FloorFeature } from '@indoor/data';
import type { FloorId } from '@indoor/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from './editor-store';

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
});
