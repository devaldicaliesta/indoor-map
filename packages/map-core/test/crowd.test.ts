import type { SnapshotNavEdge, SnapshotNavNode, SnapshotNodeRole } from '@indoor/domain';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, it, vi } from 'vitest';
import {
  type CrowdGraph,
  createCrowd,
  personFacing,
  personFrame,
  personMeters,
  seededRandom,
  stepCrowd,
} from '../src/crowd';
import {
  CROWD_FRAMES,
  lookKey,
  randomLook,
  renderCrowdSprite,
  uniqueLooks,
} from '../src/crowd-sprite';
import {
  CROWD_LAYER_ID,
  CROWD_MIN_ZOOM,
  crowdCollection,
  crowdLayer,
  setCrowd,
} from '../src/layers/crowd';

const ORIGIN = [106.8019, -6.2183] as const;
const KX = 111_320 * Math.cos((ORIGIN[1] * Math.PI) / 180);
const KY = 110_574;

/**
 * Lantai uji: koridor persegi 60 × 30 m (empat node sudut + tengah sisi), dua ruang bertitik
 * masuk, dan dua konektor di sudut. Lantai kedua tanpa ruas.
 */
function testGraph(): CrowdGraph {
  const nodes: SnapshotNavNode[] = [];
  const edges: SnapshotNavEdge[] = [];
  const node = (
    id: string,
    x: number,
    y: number,
    role: SnapshotNodeRole = 'path',
    floorId = 'L1',
  ) =>
    nodes.push({
      id,
      floorId,
      coordinates: [ORIGIN[0] + x / KX, ORIGIN[1] + y / KY],
      role,
      featureId: null,
    });
  const edge = (from: string, to: string) => {
    const a = nodes.find((n) => n.id === from);
    const b = nodes.find((n) => n.id === to);
    if (!a || !b) throw new Error('node');
    edges.push({
      id: `${from}-${to}`,
      floorId: a.floorId,
      from,
      to,
      lengthM: Math.hypot(
        (b.coordinates[0] - a.coordinates[0]) * KX,
        (b.coordinates[1] - a.coordinates[1]) * KY,
      ),
      accessible: true,
    });
  };
  const ring: [string, number, number][] = [
    ['a', 0, 0],
    ['b', 30, 0],
    ['c', 60, 0],
    ['d', 60, 30],
    ['e', 30, 30],
    ['f', 0, 30],
  ];
  for (const [id, x, y] of ring) node(id, x, y);
  for (const [i, [id]] of ring.entries()) edge(id, ring[(i + 1) % ring.length]?.[0] ?? 'a');
  node('shop1', 30, -5, 'entrance');
  node('shop2', 30, 35, 'entrance');
  edge('b', 'shop1');
  edge('e', 'shop2');
  node('lift1', -3, 0, 'connector');
  node('lift2', 63, 30, 'connector');
  edge('lift1', 'a');
  edge('d', 'lift2');
  node('lonely', 0, 0, 'path', 'L2');
  return { nodes, edges };
}

/** Jarak titik ke ruas terdekat lantai L1 (m). */
function distanceToNetwork(graph: CrowdGraph, [x, y]: [number, number]) {
  const meters = (id: string) => {
    const n = graph.nodes.find((node) => node.id === id);
    return n ? [(n.coordinates[0] - ORIGIN[0]) * KX, (n.coordinates[1] - ORIGIN[1]) * KY] : [0, 0];
  };
  let best = Number.POSITIVE_INFINITY;
  for (const edge of graph.edges) {
    const [ax = 0, ay = 0] = meters(edge.from);
    const [bx = 0, by = 0] = meters(edge.to);
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}

const hashOf = (data: Uint8Array) => {
  let h = 2166136261;
  for (const byte of data) h = Math.imul(h ^ byte, 16777619);
  return `${data.length}:${h >>> 0}`;
};

describe('tampilan orang mini', () => {
  it('banyak orang semuanya berbeda: kunci dan gambar tidak ada yang kembar', () => {
    const looks = uniqueLooks(300, seededRandom('unik'));
    expect(looks).toHaveLength(300);
    expect(new Set(looks.map(lookKey)).size).toBe(300);
    const images = looks.map((look) => hashOf(renderCrowdSprite(look, 'stand', 'right').data));
    expect(new Set(images).size).toBe(300);
  });

  it('bervariasi: anak dan dewasa, kerudung, topi, aksesori, berbagai warna kulit', () => {
    const looks = uniqueLooks(200, seededRandom('ragam'));
    expect(looks.some((look) => look.child)).toBe(true);
    expect(looks.some((look) => !look.child)).toBe(true);
    for (const hair of ['hijab', 'cap', 'long', 'curly'] as const) {
      expect(looks.some((look) => look.hair === hair)).toBe(true);
    }
    for (const accessory of ['backpack', 'bag', 'glasses', 'phone'] as const) {
      expect(looks.some((look) => look.accessory === accessory)).toBe(true);
    }
    expect(new Set(looks.map((look) => look.skin)).size).toBe(5);
    expect(new Set(looks.map((look) => look.topColor)).size).toBeGreaterThan(8);
  });

  it('gambar 2×: dewasa lebih tinggi dari anak, menghadap kiri = cermin kanan, langkah beda', () => {
    const random = seededRandom('gambar');
    let adult = randomLook(random);
    while (adult.child) adult = randomLook(random);
    const child = { ...adult, child: true };
    const right = renderCrowdSprite(adult, 'stand', 'right');
    const small = renderCrowdSprite(child, 'stand', 'right');
    expect(right.width).toBe(24);
    expect(right.height).toBe(44);
    expect(small.height).toBeLessThan(right.height);
    const left = renderCrowdSprite(adult, 'stand', 'left');
    for (let y = 0; y < right.height; y++) {
      for (let x = 0; x < right.width; x++) {
        const a = (y * right.width + x) * 4;
        const b = (y * right.width + (right.width - 1 - x)) * 4;
        expect(left.data.slice(b, b + 4)).toEqual(right.data.slice(a, a + 4));
      }
    }
    const frames = CROWD_FRAMES.map((frame) =>
      hashOf(renderCrowdSprite(adult, frame, 'right').data),
    );
    expect(new Set(frames).size).toBe(3);
    // Ada bayangan setengah transparan di baris bawah dan tepi gelap.
    const bottom = right.data.slice((right.height - 1) * right.width * 4);
    expect([...bottom].some((value, i) => i % 4 === 3 && value > 0 && value < 100)).toBe(true);
  });
});

describe('simulasi kerumunan', () => {
  const graph = testGraph();

  it('jumlah sesuai panjang jalur, campuran berjalan dan berdiri, tampilan unik', () => {
    const crowd = createCrowd(graph, ['L1', 'L2'], { seed: 'venue-1' });
    // Jalur 180 m × 6 per 100 m ≈ 11 orang; lantai tanpa ruas kosong.
    expect(crowd.people.length).toBe(11);
    expect(crowd.people.every((person) => person.floorId === 'L1')).toBe(true);
    const walkers = crowd.people.filter((person) => person.walker).length;
    expect(walkers).toBeGreaterThan(0);
    expect(walkers).toBeLessThan(crowd.people.length);
    expect(new Set(crowd.people.map((person) => person.key)).size).toBe(crowd.people.length);
    expect(
      createCrowd(graph, ['L1'], { seed: 'x', density: 100, maxPerFloor: 25 }).people,
    ).toHaveLength(25);
  });

  it('orang berdiri di dalam ruang: ruang luas ramai, tidak menempel dinding, tidak bergerak', () => {
    const square = (x0: number, y0: number, size: number) =>
      [
        [x0, y0],
        [x0 + size, y0],
        [x0 + size, y0 + size],
        [x0, y0 + size],
      ].map(([x = 0, y = 0]) => [ORIGIN[0] + x / KX, ORIGIN[1] + y / KY] as [number, number]);
    const hall = square(100, 0, 50); // 2.500 m²
    const kiosk = square(0, 100, 3); // 9 m²
    const crowd = createCrowd(graph, ['L1'], {
      seed: 'ruang',
      areas: [
        { floorId: 'L1', ring: hall },
        { floorId: 'L1', ring: kiosk },
        { floorId: 'L2', ring: square(0, 0, 50) },
      ],
    });
    const inHall = crowd.people.filter((p) => !p.walker && p.spot[0] >= 100);
    expect(inHall).toHaveLength(12);
    for (const person of inHall) {
      const [x, y] = person.spot;
      expect(x).toBeGreaterThanOrEqual(100.6);
      expect(x).toBeLessThanOrEqual(149.4);
      expect(y).toBeGreaterThanOrEqual(0.6);
      expect(y).toBeLessThanOrEqual(49.4);
    }
    expect(crowd.people.filter((p) => p.spot[1] >= 100)).toHaveLength(0);
    expect(crowd.people.every((p) => p.floorId === 'L1')).toBe(true);
    expect(new Set(crowd.people.map((p) => p.key)).size).toBe(crowd.people.length);
    const before = inHall.map((p) => [...p.spot]);
    for (let i = 0; i < 100; i++) stepCrowd(crowd, 0.1);
    expect(inHall.map((p) => [...personMeters(crowd, p)])).toEqual(before);
  });

  it('deterministik per benih dan lantai', () => {
    const positions = (seed: string) => {
      const crowd = createCrowd(graph, ['L1'], { seed });
      for (let i = 0; i < 40; i++) stepCrowd(crowd, 0.05);
      return crowd.people.map((person) => personMeters(crowd, person).map((v) => v.toFixed(3)));
    };
    expect(positions('venue-1')).toEqual(positions('venue-1'));
    expect(positions('venue-1')).not.toEqual(positions('venue-2'));
  });

  it('pejalan bergerak di sepanjang jalur dan yang berdiri tetap di tempat', () => {
    const crowd = createCrowd(graph, ['L1'], { seed: 'gerak', density: 20 });
    const start = crowd.people.map((person) => personMeters(crowd, person));
    for (let i = 0; i < 600; i++) {
      stepCrowd(crowd, 0.05);
      for (const person of crowd.people) {
        if (!person.walker || person.away) continue;
        // Paling jauh geser samping + pembulatan dari garis jalur.
        expect(distanceToNetwork(graph, personMeters(crowd, person))).toBeLessThan(1.01);
      }
    }
    crowd.people.forEach((person, i) => {
      const moved = Math.hypot(
        personMeters(crowd, person)[0] - (start[i]?.[0] ?? 0),
        personMeters(crowd, person)[1] - (start[i]?.[1] ?? 0),
      );
      if (person.walker) expect(person.distance).toBeGreaterThan(10);
      else expect(moved).toBe(0);
    });
  });

  it('bingkai langkah bergantian saat berjalan; arah hadap mengikuti rotasi peta', () => {
    const crowd = createCrowd(graph, ['L1'], { seed: 'bingkai', density: 20 });
    const walker = crowd.people.find((person) => person.walker);
    if (!walker) throw new Error('tidak ada pejalan');
    walker.pause = 0;
    const frames = new Set<string>();
    for (let i = 0; i < 40; i++) {
      walker.distance += 0.21;
      frames.add(personFrame(walker));
    }
    expect([...frames].sort()).toEqual(['stepA', 'stepB']);
    expect(personFrame(walker, false)).toBe('stand');
    walker.heading = 90; // ke timur
    expect(personFacing(walker, 0)).toBe('right');
    expect(personFacing(walker, 180)).toBe('left');
    // Hampir tegak lurus layar: arah sebelumnya dipertahankan.
    walker.heading = 2;
    expect(personFacing(walker, 0)).toBe('left');
  });

  it('GeoJSON: satu titik per orang yang tampil dengan ikon tampilan-bingkai-arah', () => {
    const crowd = createCrowd(graph, ['L1'], { seed: 'geojson' });
    const first = crowd.people[0];
    if (first) first.away = true;
    const collection = crowdCollection(crowd, 0);
    expect(collection.features).toHaveLength(crowd.people.length - 1);
    for (const feature of collection.features) {
      expect(feature.properties?.icon).toMatch(/^crowd-.+-(stand|stepA|stepB)-(left|right)$/);
    }
    expect(crowdCollection(null, 0).features).toEqual([]);
  });
});

describe('layer orang mini', () => {
  it('billboard di atas lantai, tidak menyembunyikan label, mulai dari zoom gedung', () => {
    const layer = crowdLayer();
    expect(layer.type).toBe('symbol');
    expect(layer.minzoom).toBe(CROWD_MIN_ZOOM);
    const layout = (layer as { layout: Record<string, unknown> }).layout;
    expect(layout['icon-ignore-placement']).toBe(true);
    expect(layout['icon-allow-overlap']).toBe(true);
    expect(layout['icon-pitch-alignment']).toBe('viewport');
    expect(layout['icon-anchor']).toBe('bottom');
  });

  it('setCrowd memasang gambar sekali, tidak membangun ulang untuk masukan sama, null mengosongkan', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true }),
      requestAnimationFrame: () => 1,
      cancelAnimationFrame: () => undefined,
    });
    try {
      const images = new Set<string>();
      const data: number[] = [];
      let added = false;
      const map = {
        getSource: () =>
          added
            ? { setData: (c: { features: unknown[] }) => data.push(c.features.length) }
            : undefined,
        addSource: () => {
          added = true;
        },
        addLayer: (layer: { id: string }) => expect(layer.id).toBe(CROWD_LAYER_ID),
        getLayer: () => undefined,
        hasImage: (id: string) => images.has(id),
        addImage: (id: string) => images.add(id),
        getBearing: () => 0,
        once: () => undefined,
      } as unknown as MapLibreMap;
      const graph = testGraph();
      const input = { graph, floorIds: ['L1'], seed: 'layer' };
      setCrowd(map, input);
      const people = data[0] ?? 0;
      expect(people).toBeGreaterThan(0);
      // Pejalan: 3 bingkai × 2 arah; yang berdiri hanya bingkai berdiri × 2 arah.
      const walkers = createCrowd(graph, ['L1'], { seed: 'layer' }).people.filter((p) => p.walker);
      expect(images.size).toBe(walkers.length * 6 + (people - walkers.length) * 2);
      setCrowd(map, { ...input, floorIds: ['L1'] });
      expect(data).toHaveLength(1);
      setCrowd(map, null);
      expect(data).toEqual([people, 0]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
