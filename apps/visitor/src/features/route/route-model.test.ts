import { buildSnapshot, indexSnapshot } from '@indoor/domain';
import {
  IDS,
  RADIOLOGY_UNITS,
  sampleSnapshotSource,
} from '@indoor/domain/fixtures/snapshot-source.ts';
import { buildRouteGraph } from '@indoor/routing';
import { describe, expect, it } from 'vitest';
import { routeFailure, routeFloors, stepTexts, targetOfPlace, visitorRoute } from './route-model';

const snapshot = buildSnapshot(sampleSnapshotSource());
const index = indexSnapshot(snapshot);
const graph = buildRouteGraph(snapshot);
const lobby = { kind: 'origin_point', code: snapshot.originPoints[0]?.code ?? '' } as const;
const radiology = { kind: 'location', id: IDS.radiology } as const;

describe('rute Visitor', () => {
  it('dari QR Lobi ke Radiologi: langkah mulai sampai tiba dengan teks template venue', () => {
    const plan = visitorRoute(graph, snapshot, lobby, radiology, false);
    if (!plan.ok) throw new Error(`gagal: ${plan.reason}`);
    expect(plan.route.distanceM).toBeGreaterThan(0);
    expect(plan.steps[0]?.action).toBe('start');
    expect(plan.steps.at(-1)?.action).toBe('arrive');
    const texts = stepTexts(plan.steps, snapshot, 'id', {
      origin: 'Lobi Utama',
      destination: 'Radiologi',
    });
    expect(texts[0]).toBe('Mulai dari Lobi Utama');
    expect(texts.at(-1)).toBe('Tiba di Radiologi');
    expect(routeFloors(plan.steps)[0]).toBe(snapshot.originPoints[0]?.floorId);
  });

  it('hitung rute fixture jauh di bawah 500 ms', () => {
    const start = performance.now();
    for (let i = 0; i < 20; i++) visitorRoute(graph, snapshot, lobby, radiology, i % 2 === 0);
    expect((performance.now() - start) / 20).toBeLessThan(50);
  });

  it('pesan gagal per alasan; penutupan didahulukan', () => {
    const failed = (reason: 'no_path' | 'accessible_blocked' | 'origin_unknown', closures = []) =>
      ({ ok: false, reason, blockingClosureIds: closures, gap: null }) as const;
    expect(routeFailure(failed('no_path'))).toBe('no_path');
    expect(routeFailure(failed('accessible_blocked'))).toBe('accessible');
    expect(routeFailure(failed('origin_unknown'))).toBe('origin');
    expect(
      routeFailure({
        ok: false,
        reason: 'accessible_blocked',
        blockingClosureIds: ['c'],
        gap: null,
      }),
    ).toBe('closed');
  });

  it('asal yang bisa ditukar: lokasi dan fitur; QR tidak', () => {
    expect(targetOfPlace(index, { kind: 'location', locationId: IDS.radiology })).toEqual(
      radiology,
    );
    expect(targetOfPlace(index, { kind: 'feature', featureId: RADIOLOGY_UNITS[0] ?? '' })).toEqual({
      kind: 'unit',
      id: RADIOLOGY_UNITS[0],
    });
    expect(targetOfPlace(index, lobby)).toBeNull();
  });
});
