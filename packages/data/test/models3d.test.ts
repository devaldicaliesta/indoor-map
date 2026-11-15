import type { VenueId } from '@indoor/domain';
import { describe, expect, it, vi } from 'vitest';
import { mapFeatureRow, toFeatureColumns } from '../src/repositories/features';
import { createModels3dRepository } from '../src/repositories/models3d';
import type { Db } from '../src/supabase';

const VENUE = '0b9f3c2e-1d4a-4c6b-8e7f-123456789abc' as VenueId;
const FLOOR = '1b9f3c2e-1d4a-4c6b-8e7f-123456789abc';
const ID = '2b9f3c2e-1d4a-4c6b-8e7f-123456789abc';

function glbBytes(): Uint8Array<ArrayBuffer> {
  const json = new TextEncoder().encode('{"asset":{"version":"2.0"}}  ');
  const bytes = new Uint8Array(20 + json.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.length, true);
  view.setUint32(12, json.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(json, 20);
  return bytes;
}

describe('fitur model3d', () => {
  it('model, skala, rotasi, dan tinggi dasar disimpan di props lalu dibaca kembali', () => {
    const feature = {
      type: 'Feature' as const,
      id: ID,
      geometry: { type: 'Point' as const, coordinates: [106.8, -6.2] as [number, number] },
      properties: {
        id: ID,
        kind: 'model3d' as const,
        floorId: FLOOR,
        model: 'builtin:tree',
        modelScale: 1.5,
        modelRotation: 30,
        baseHeight: 2,
      },
    };
    const columns = toFeatureColumns(VENUE, feature);
    expect(columns.props).toEqual({
      model: 'builtin:tree',
      modelScale: 1.5,
      modelRotation: 30,
      baseHeight: 2,
    });
    const row = {
      id: ID,
      floor_id: FLOOR,
      kind: 'model3d' as const,
      geom: feature.geometry,
      name: null,
      height_m: null,
      color: null,
      unit_code: null,
      unit_status: null,
      area_m2: null,
      facility_type_id: null,
      props: columns.props,
    };
    expect(mapFeatureRow(row).properties).toEqual(feature.properties);
  });

  it('props model tidak ikut pada jenis lain', () => {
    const columns = toFeatureColumns(VENUE, {
      type: 'Feature',
      id: ID,
      geometry: { type: 'Point', coordinates: [106.8, -6.2] },
      properties: { id: ID, kind: 'door', floorId: FLOOR, model: 'builtin:tree' },
    });
    expect(columns.props).toEqual({});
  });
});

describe('unggah model GLB', () => {
  function repository() {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const db = {
      storage: {
        from: () => ({
          upload,
          getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn/${path}` } }),
        }),
      },
    } as unknown as Db;
    return { repo: createModels3dRepository(db), upload };
  }

  it('GLB sah diunggah ke models/<venue>/ dengan tipe model/gltf-binary', async () => {
    const { repo, upload } = repository();
    const path = await repo.upload(VENUE, new File([glbBytes()], 'Patung Lobi.glb'));
    expect(path).toMatch(new RegExp(`^models/${VENUE}/patung-lobi-\\d+\\.glb$`));
    expect(upload).toHaveBeenCalledWith(path, expect.any(Blob), {
      contentType: 'model/gltf-binary',
    });
    expect(repo.url(path)).toBe(`https://cdn/${path}`);
  });

  it('berkas bukan GLB ditolak sebelum diunggah', async () => {
    const { repo, upload } = repository();
    await expect(repo.upload(VENUE, new File(['bukan glb'], 'x.glb'))).rejects.toThrow(
      'Berkas bukan model GLB (glTF biner).',
    );
    expect(upload).not.toHaveBeenCalled();
  });
});
