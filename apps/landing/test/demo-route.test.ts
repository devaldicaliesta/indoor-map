import { buildSnapshot, indexSnapshot, initialMapView } from '@indoor/domain';
import { concertVenue, hospitalVenue } from '@indoor/domain/fixtures/demo-venues/index.ts';
import { buildRouteGraph } from '@indoor/routing';
import { describe, expect, it } from 'vitest';
import {
  demoOrigin,
  demoRoute,
  destinationGroups,
  routeFloorIds,
  routeViewOn,
  stepTexts,
  targetName,
} from '../src/demo/demo-route';

const venues = { concert: buildSnapshot(concertVenue()), hospital: buildSnapshot(hospitalVenue()) };

describe('rute peta demo landing', () => {
  for (const [name, snapshot] of Object.entries(venues)) {
    it(`${name}: setiap tujuan pilihan punya rute dari titik asal demo`, () => {
      const origin = demoOrigin(snapshot);
      expect(origin?.name).toBeTruthy();
      if (!origin) return;
      const graph = buildRouteGraph(snapshot);
      const options = destinationGroups(snapshot).flatMap((group) => group.options);
      expect(options.length).toBeGreaterThan(5);
      expect(new Set(options.map((o) => o.id)).size).toBe(options.length);
      for (const option of options) {
        const plan = demoRoute(graph, snapshot, origin.place, { kind: 'location', id: option.id });
        expect(plan.ok, option.name).toBe(true);
      }
    });
  }

  it('rute antarlantai rumah sakit: garis di lantai asal, lantai berganti, teks langkah terisi', () => {
    const snapshot = venues.hospital;
    const index = indexSnapshot(snapshot);
    const origin = demoOrigin(snapshot);
    if (!origin) throw new Error('rumah sakit demo tanpa titik asal');
    const graph = buildRouteGraph(snapshot);
    const { buildingId } = initialMapView(snapshot);
    const upstairs = snapshot.locations.find((location) =>
      location.unitIds.some((id) => index.features.get(id)?.properties.floorId !== origin.floorId),
    );
    if (!upstairs) throw new Error('rumah sakit demo tanpa lokasi di lantai lain');
    const target = { kind: 'location', id: upstairs.id } as const;
    const plan = demoRoute(graph, snapshot, origin.place, target);
    if (!plan.ok) throw new Error(`rute gagal: ${plan.reason}`);

    expect(routeFloorIds(snapshot, buildingId, plan).length).toBeGreaterThan(1);
    const start = routeViewOn(plan.route, [origin.floorId]);
    expect(start.lines.length).toBeGreaterThan(0);
    expect(start.origin).not.toBeNull();
    const texts = stepTexts(plan, snapshot, 'en', {
      origin: origin.name,
      destination: targetName(index, target),
    });
    expect(texts).toHaveLength(plan.steps.length);
    expect(texts.every((text) => text.trim().length > 0 && !text.includes('{'))).toBe(true);
  });
});
