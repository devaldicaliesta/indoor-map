import type { Building, BuildingId, Closure, Connector, Floor, FloorId } from '@indoor/domain';
import type { RouteGap, RoutePlan } from '@indoor/routing';
import { describe, expect, it } from 'vitest';
import { inVenueTime } from '../../../app/format';
import { type FailureContext, failureText } from './failure-text';

const building = (id: string, name: string) => ({ id: id as BuildingId, name }) as Building;
const floor = (id: string, name: string, buildingId: string | null) =>
  ({ id: id as FloorId, name, buildingId, isOutdoor: buildingId === null }) as Floor;
const connector = (id: string, name: string) => ({ id, name }) as Connector;

const context: FailureContext = {
  accessible: false,
  floors: [
    floor('gf', 'GF', 'gu'),
    floor('l1', 'L1', 'gu'),
    floor('l2', 'L2', 'gu'),
    floor('out', 'Area Luar', null),
    floor('gt', 'GF', 'gt'),
  ],
  buildings: [building('gu', 'Gedung Utama'), building('gt', 'Gedung Timur')],
  connectors: [
    connector('stairs', 'Tangga Barat'),
    connector('up', 'Eskalator naik'),
    connector('lift', 'Lift 1'),
    connector('door', 'Pintu Timur'),
  ],
  closures: [
    {
      id: 'c1',
      featureId: null,
      edgeId: null,
      connectorId: 'lift',
      reason: 'Perawatan',
      startsAt: '2026-10-01T01:00:00Z',
      endsAt: '2026-10-01T10:00:00Z',
    } satisfies Closure,
    {
      id: 'c2',
      featureId: 'u1',
      edgeId: null,
      connectorId: null,
      reason: 'Renovasi',
      startsAt: '2026-10-01T01:00:00Z',
      endsAt: null,
    },
    {
      id: 'c3',
      featureId: null,
      edgeId: 'e1',
      connectorId: null,
      reason: 'Lantai basah',
      startsAt: '2026-10-01T01:00:00Z',
      endsAt: null,
    },
  ],
  featureLabel: (id) => (id === 'u1' ? 'GF-A01' : null),
  edgeFloorId: (id) => (id === 'e1' ? 'l1' : null),
  timezone: 'Asia/Jakarta',
};

const failed = (
  reason: Extract<RoutePlan, { ok: false }>['reason'],
  gap: RouteGap | null,
  blockingClosureIds: string[] = [],
): Extract<RoutePlan, { ok: false }> => ({ ok: false, reason, blockingClosureIds, gap });
const accessible = { ...context, accessible: true };

describe('alasan uji rute gagal', () => {
  it('lantai tanpa lift aksesibel menyebut lantai dan konektor yang ada', () => {
    const gap: RouteGap = {
      kind: 'floor',
      floorId: 'l2',
      fromFloorId: 'gf',
      connectorIds: ['stairs'],
    };
    expect(failureText(failed('accessible_blocked', gap), accessible)).toEqual({
      title: 'Rute kursi roda tidak tersedia',
      details: [
        'Lantai L2 Gedung Utama tidak terhubung lift yang aksesibel.',
        'Konektor yang ada (Tangga Barat) tidak bisa dilalui kursi roda.',
      ],
    });
    expect(
      failureText(failed('accessible_blocked', { ...gap, connectorIds: [] }), accessible).details,
    ).toEqual([
      'Lantai L2 Gedung Utama tidak terhubung lift yang aksesibel.',
      'Tambahkan lift dengan alat Konektor.',
    ]);
  });

  it('lantai atau gedung yang belum terhubung, dan eskalator yang hanya satu arah', () => {
    expect(
      failureText(
        failed('no_path', { kind: 'floor', floorId: 'l2', fromFloorId: 'gf', connectorIds: [] }),
        context,
      ),
    ).toEqual({
      title: 'Tidak ada rute',
      details: [
        'Lantai L2 Gedung Utama belum terhubung ke lantai GF Gedung Utama.',
        'Tambahkan lift, eskalator, atau tangga dengan alat Konektor.',
      ],
    });
    expect(
      failureText(
        failed('no_path', {
          kind: 'floor',
          floorId: 'gf',
          fromFloorId: 'l1',
          connectorIds: ['up'],
        }),
        context,
      ).details,
    ).toEqual([
      'Lantai GF Gedung Utama tidak bisa dicapai dari lantai L1 Gedung Utama: Eskalator naik hanya satu arah.',
    ]);
    expect(
      failureText(
        failed('no_path', { kind: 'floor', floorId: 'gt', fromFloorId: 'out', connectorIds: [] }),
        context,
      ).details,
    ).toEqual([
      'Gedung Timur belum terhubung ke Area Luar.',
      'Tambahkan pintu gedung dengan alat Konektor.',
    ]);
    expect(
      failureText(
        failed('accessible_blocked', {
          kind: 'floor',
          floorId: 'gt',
          fromFloorId: 'out',
          connectorIds: ['door'],
        }),
        accessible,
      ).details,
    ).toEqual([
      'Gedung Timur tidak terhubung ke Area Luar lewat pintu gedung yang aksesibel.',
      'Pintu yang ada (Pintu Timur) tidak bisa dilalui kursi roda.',
    ]);
  });

  it('konektor yang belum disambung, tujuan terpisah, dan ujung tanpa jalur', () => {
    expect(
      failureText(
        failed('no_path', {
          kind: 'connector',
          floorId: 'gf',
          toFloorId: 'l1',
          connectorIds: ['lift'],
        }),
        context,
      ).details,
    ).toEqual([
      'Di lantai GF Gedung Utama, jalur belum sampai ke Lift 1 menuju lantai L1 Gedung Utama.',
      'Sambungkan node konektor itu ke jalur dengan alat Jalur.',
    ]);
    expect(
      failureText(failed('no_path', { kind: 'path', floorId: 'l1' }), context).details,
    ).toEqual([
      'Di lantai L1 Gedung Utama, jalur dari asal tidak tersambung ke tujuan.',
      'Periksa node terisolasi di lantai itu.',
    ]);
    expect(
      failureText(failed('accessible_blocked', { kind: 'path', floorId: 'l1' }), accessible)
        .details,
    ).toEqual([
      'Di lantai L1 Gedung Utama, tujuan hanya bisa dicapai lewat jalur yang tidak aksesibel.',
    ]);
    expect(
      failureText(failed('origin_invalid', { kind: 'origin', floorId: 'out' }), context).details,
    ).toEqual(['Asal tidak bisa disambungkan ke jalur: Area Luar belum punya jalur.']);
  });

  it('penutupan yang menghalangi disebut dengan alasan dan waktu selesainya', () => {
    const text = failureText(failed('accessible_blocked', null, ['c1']), accessible);
    expect(text.title).toBe('Rute kursi roda tertutup sementara');
    // Jam ditulis dalam zona waktu venue (10.00 UTC = 17.00 WIB).
    expect(text.details[0]).toBe(
      `Lift 1 ditutup (Perawatan), sampai ${inVenueTime('2026-10-01T10:00:00Z', 'Asia/Jakarta')}.`,
    );
    expect(text.details[0]).toContain('17.00');
    expect(text.details[1]).toBe('Tanpa mode kursi roda rute tetap tersedia.');
    expect(failureText(failed('closed', null, ['c2', 'c3']), context)).toEqual({
      title: 'Rute tertutup sementara',
      details: [
        'GF-A01 ditutup (Renovasi), tanpa waktu selesai.',
        'Jalur di lantai L1 Gedung Utama ditutup (Lantai basah), tanpa waktu selesai.',
      ],
    });
  });

  it('tempat yang sudah dihapus dari draft', () => {
    expect(failureText(failed('origin_unknown', null), context).title).toBe('Asal tidak ditemukan');
    expect(failureText(failed('destination_unknown', null), context).title).toBe(
      'Tujuan tidak ditemukan',
    );
  });
});
