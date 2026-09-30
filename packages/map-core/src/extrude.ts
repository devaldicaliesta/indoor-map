import type { FeatureKind, MapFeatureProperties } from '@indoor/domain';
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import { DEFAULT_HEIGHTS } from './defaults';
import type { FloorFeatureCollection } from './map';

/** Source khusus 3D: diisi hanya saat mode 3D agar mode 2D tetap ringan. */
export const FLOOR_3D_SOURCE_ID = 'floor-3d';

/** Ruang yang selalu tampil di 3D (tinggi 0 = rata lantai, tetap terlihat). */
export const ROOM_KINDS: readonly FeatureKind[] = ['unit', 'elevator', 'escalator', 'stairs'];
/** Tebal dinding hasil ekstrusi garis dinding (m). */
export const WALL_THICKNESS_M = 0.2;
/** Lebar pemisah di tepi atas ruang agar unit bersebelahan tidak tampak menyatu (m). */
export const EDGE_WIDTH_M = 0.12;
/** Pemisah sedikit lebih tinggi dari ruangnya agar tidak berkedip (z-fighting). */
const EDGE_RAISE_M = 0.03;

export type HeightTable = Partial<Record<FeatureKind, number>>;

/** Properti fitur 3D: `extrude` = tinggi akhir; `edge` menandai pemisah tepi ruang. */
export type Feature3dProperties = MapFeatureProperties & { extrude: number; edge?: true };
export type Floor3dCollection = FeatureCollection<Polygon | MultiPolygon, Feature3dProperties>;

/**
 * Tinggi 3D satu fitur (FR-VIS-01/02): override per fitur lebih dulu, lalu tinggi default
 * venue per jenis, lalu default aplikasi. Override tetap berlaku walau default diubah.
 */
export function resolveHeight(properties: MapFeatureProperties, venueHeights: HeightTable): number {
  return (
    properties.height ?? venueHeights[properties.kind] ?? DEFAULT_HEIGHTS[properties.kind] ?? 0
  );
}

const EARTH_RADIUS_M = 6_371_008.8;
const RAD = Math.PI / 180;

/**
 * Persegi panjang selebar `width` meter di sepanjang ruas a→b, diperpanjang setengah lebar
 * di kedua ujung sehingga sudut antar-ruas tertutup tanpa celah.
 */
function segmentQuad(a: Position, b: Position, width: number): Position[] | null {
  const [ax = 0, ay = 0] = a;
  const [bx = 0, by = 0] = b;
  const mx = RAD * EARTH_RADIUS_M * Math.cos(ay * RAD);
  const my = RAD * EARTH_RADIUS_M;
  const dx = (bx - ax) * mx;
  const dy = (by - ay) * my;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return null;
  const half = width / 2;
  const ux = dx / length;
  const uy = dy / length;
  const at = (p: Position, along: number, side: number): Position => [
    (p[0] ?? 0) + (ux * along - uy * side) / mx,
    (p[1] ?? 0) + (uy * along + ux * side) / my,
  ];
  const ring = [at(a, -half, -half), at(b, half, -half), at(b, half, half), at(a, -half, half)];
  return [...ring, ring[0] as Position];
}

function stripsAlong(lines: readonly (readonly Position[])[], width: number): MultiPolygon | null {
  const quads: Position[][][] = [];
  for (const line of lines) {
    for (let i = 0; i + 1 < line.length; i++) {
      const quad = segmentQuad(line[i] as Position, line[i + 1] as Position, width);
      if (quad) quads.push([quad]);
    }
  }
  return quads.length ? { type: 'MultiPolygon', coordinates: quads } : null;
}

/**
 * Data source 3D dari fitur lantai: ruang dan area bertinggi > 0 diekstrusi, ruang
 * setinggi 0 tetap tampil rata, dinding diekstrusi dari garisnya, dan setiap ruang diberi
 * pemisah tipis di tepinya. Fitur turunan membawa `id` aslinya sehingga tetap bisa dipilih.
 */
export function build3dFeatures(
  source: FloorFeatureCollection,
  venueHeights: HeightTable,
): Floor3dCollection {
  const out: Feature<Polygon | MultiPolygon, Feature3dProperties>[] = [];
  for (const feature of source.features) {
    const props = feature.properties;
    const extrude = resolveHeight(props, venueHeights);
    const g = feature.geometry;
    if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
      const isRoom = ROOM_KINDS.includes(props.kind);
      if (extrude <= 0 && !isRoom) continue;
      out.push({ type: 'Feature', geometry: g, properties: { ...props, extrude } });
      if (!isRoom || extrude <= 0) continue;
      const rings = g.type === 'Polygon' ? g.coordinates : g.coordinates.flat();
      const edge = stripsAlong(rings, EDGE_WIDTH_M);
      if (edge) {
        out.push({
          type: 'Feature',
          geometry: edge,
          properties: { ...props, extrude: extrude + EDGE_RAISE_M, edge: true },
        });
      }
    } else if (g.type === 'LineString' && props.kind === 'wall' && extrude > 0) {
      const wall = stripsAlong([g.coordinates], WALL_THICKNESS_M);
      if (wall) out.push({ type: 'Feature', geometry: wall, properties: { ...props, extrude } });
    }
  }
  return { type: 'FeatureCollection', features: out };
}
