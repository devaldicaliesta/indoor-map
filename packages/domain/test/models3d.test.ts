import { describe, expect, it } from 'vitest';
import {
  checkGlb,
  checkModelPlacement,
  MAX_GLB_BYTES,
  MODEL_LABELS,
  MODEL_LIBRARY,
  modelRefValue,
  normalizeRotation,
  parseModelRef,
} from '../src/models3d';
import { buildSnapshot } from '../src/snapshot-builder';
import { parseSnapshot } from '../src/snapshot-schema';
import type { SourceFeature } from '../src/snapshot-source';
import { sampleSnapshotSource } from './fixtures/snapshot-source';

const VENUE = '0b9f3c2e-1d4a-4c6b-8e7f-123456789abc';

function glb(json: object, options: { magic?: number; version?: number; length?: number } = {}) {
  const text = new TextEncoder().encode(JSON.stringify(json));
  const padded = Math.ceil(text.length / 4) * 4;
  const total = 12 + 8 + padded;
  const bytes = new Uint8Array(total).fill(0x20, 20);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, options.magic ?? 0x46546c67, true);
  view.setUint32(4, options.version ?? 2, true);
  view.setUint32(8, options.length ?? total, true);
  view.setUint32(12, padded, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(text, 20);
  return bytes.buffer;
}

describe('pustaka model dan rujukan', () => {
  it('setiap model bawaan punya label dan rujukannya bolak-balik', () => {
    expect(MODEL_LIBRARY).toEqual(
      expect.arrayContaining(['stairs', 'elevator', 'escalator', 'taxi', 'car', 'bus-stop']),
    );
    expect(MODEL_LIBRARY).toEqual(
      expect.arrayContaining(['tree', 'plant', 'pot', 'bench', 'table', 'kiosk', 'sign']),
    );
    for (const key of MODEL_LIBRARY) {
      expect(MODEL_LABELS[key].length).toBeGreaterThan(0);
      const value = modelRefValue({ kind: 'builtin', key });
      expect(parseModelRef(value)).toEqual({ kind: 'builtin', key });
    }
  });

  it('unggahan hanya di models/<venue>/<nama>.glb', () => {
    const path = `models/${VENUE}/patung-lobi.glb`;
    expect(parseModelRef(path)).toEqual({ kind: 'upload', path });
    expect(parseModelRef(`models/${VENUE}/../x.glb`)).toBeNull();
    expect(parseModelRef(`venues/${VENUE}/x.glb`)).toBeNull();
    expect(parseModelRef('https://contoh.id/x.glb')).toBeNull();
    expect(parseModelRef('builtin:naga')).toBeNull();
    expect(parseModelRef(null)).toBeNull();
  });
});

describe('checkModelPlacement', () => {
  it('menerima nilai wajar dan menolak di luar batas', () => {
    expect(checkModelPlacement({ model: 'builtin:tree' })).toEqual([]);
    expect(
      checkModelPlacement({
        model: 'builtin:tree',
        modelScale: 2,
        modelRotation: 90,
        baseHeight: 4,
      }),
    ).toEqual([]);
    expect(
      checkModelPlacement({
        model: 'tidak-ada',
        modelScale: 0,
        modelRotation: 400,
        baseHeight: -1,
      }),
    ).toEqual(['model', 'scale', 'rotation', 'base_height']);
    expect(checkModelPlacement({ model: 'builtin:car', modelScale: Number.NaN })).toEqual([
      'scale',
    ]);
  });

  it('rotasi dinormalkan ke 0–359,9 derajat', () => {
    expect(normalizeRotation(370)).toBe(10);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(359.99)).toBe(0);
  });
});

describe('checkGlb', () => {
  it('menerima GLB glTF 2.0 yang utuh', () => {
    expect(checkGlb(glb({ asset: { version: '2.0' } }))).toBeNull();
  });

  it('menolak kosong, terlalu besar, bukan GLB, versi lain, dan rusak', () => {
    expect(checkGlb(new ArrayBuffer(0))).toBe('empty');
    expect(checkGlb(new ArrayBuffer(MAX_GLB_BYTES + 1))).toBe('too_large');
    expect(checkGlb(new TextEncoder().encode('{"asset":{"version":"2.0"}}').buffer)).toBe(
      'not_glb',
    );
    expect(checkGlb(glb({ asset: { version: '2.0' } }, { magic: 0x12345678 }))).toBe('not_glb');
    expect(checkGlb(glb({ asset: { version: '2.0' } }, { version: 1 }))).toBe('version');
    expect(checkGlb(glb({ asset: { version: '1.0' } }))).toBe('version');
    expect(checkGlb(glb({ asset: { version: '2.0' } }, { length: 9999 }))).toBe('corrupt');
    const broken = new Uint8Array(glb({ asset: { version: '2.0' } }));
    broken[20] = 0x7b;
    broken[21] = 0x7b;
    expect(checkGlb(broken.buffer)).toBe('corrupt');
  });
});

describe('snapshot', () => {
  it('membawa model per lantai dan membuang nilai bawaan', () => {
    const source = sampleSnapshotSource();
    const floorId = source.floors[0]?.id ?? '';
    const features: SourceFeature[] = [
      ...source.features,
      {
        id: '11111111-1111-4111-8111-111111111111',
        floorId,
        kind: 'model3d',
        geometry: { type: 'Point', coordinates: [106.8, -6.2] },
        name: null,
        unitCode: null,
        unitStatus: null,
        height: null,
        color: null,
        facilityTypeId: null,
        subtype: null,
        model: { model: 'builtin:tree', modelScale: 1.5, modelRotation: 45, baseHeight: 0 },
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        floorId,
        kind: 'model3d',
        geometry: { type: 'Point', coordinates: [106.8001, -6.2] },
        name: null,
        unitCode: null,
        unitStatus: null,
        height: null,
        color: null,
        facilityTypeId: null,
        subtype: null,
        model: { model: `models/${VENUE}/patung.glb`, modelScale: 1, baseHeight: 3 },
      },
    ];
    const snapshot = parseSnapshot(
      JSON.parse(JSON.stringify(buildSnapshot({ ...source, features }))),
    );
    const models = snapshot.features.features.filter((f) => f.properties.kind === 'model3d');
    expect(models.map((f) => f.properties)).toEqual([
      expect.objectContaining({ model: 'builtin:tree', modelScale: 1.5, modelRotation: 45 }),
      expect.objectContaining({ model: `models/${VENUE}/patung.glb`, baseHeight: 3 }),
    ]);
    expect(models[0]?.properties).not.toHaveProperty('baseHeight');
    expect(models[1]?.properties).not.toHaveProperty('modelScale');
  });
});
