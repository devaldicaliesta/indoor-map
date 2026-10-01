import { buildSnapshot } from '@indoor/domain';
import { sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { FLOORS, unitIdOf } from '@indoor/domain/fixtures/venue-graph.ts';
import { describe, expect, it } from 'vitest';
import { buildRouteGraph, planRoute, type RoutePlace, routeOnFloor } from '../src';

const snapshot = buildSnapshot(sampleSnapshotSource());
const graph = buildRouteGraph(snapshot);
const unit = (code: string): RoutePlace => ({ kind: 'feature', featureId: unitIdOf(code) });

describe('routeOnFloor', () => {
  const plan = planRoute(graph, snapshot, unit('GF-A02'), unit('GT-B03'));
  if (!plan.ok) throw new Error('Rute skenario 3 harus ada');
  const { legs } = plan.route;
  const first = legs[0];
  const last = legs.at(-1);

  it('lantai asal: garis, penanda asal, dan titik keluar gedung', () => {
    const view = routeOnFloor(plan.route, FLOORS.guGf);
    expect(view.lines).toHaveLength(1);
    expect(view.origin).toEqual(first?.kind === 'walk' ? first.coordinates[0] : null);
    expect(view.destination).toBeNull();
    expect(view.transfers).toEqual([view.lines[0]?.at(-1)]);
  });

  it('Area Luar: hanya garis dan dua titik pintu gedung', () => {
    const view = routeOnFloor(plan.route, FLOORS.outdoor);
    expect(view.lines).toHaveLength(1);
    expect(view.origin).toBeNull();
    expect(view.destination).toBeNull();
    expect(view.transfers).toEqual([view.lines[0]?.[0], view.lines[0]?.at(-1)]);
  });

  it('lantai tujuan: penanda tujuan; lantai yang tidak dilewati kosong', () => {
    const view = routeOnFloor(plan.route, FLOORS.gtGf);
    expect(view.destination).toEqual(last?.kind === 'walk' ? last.coordinates.at(-1) : null);
    expect(routeOnFloor(plan.route, FLOORS.guL1)).toEqual({
      lines: [],
      origin: null,
      destination: null,
      transfers: [],
    });
  });
});
