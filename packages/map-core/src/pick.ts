import type { Map as MapLibreMap, PointLike } from 'maplibre-gl';
import { LABEL_LAYER_ID } from './layers/labels';
import { HIGHLIGHT_LAYER_IDS, LAYER_IDS } from './style';

/** Yang diketuk pengunjung: label (nama lokasi atau ikon fasilitas) atau fitur lantai. */
export type MapPick =
  | { layer: 'label'; kind: 'location' | 'facility'; id: string }
  | { layer: 'floor'; id: string };

/** Jari lebih besar dari kursor: label dicari dalam kotak di sekitar titik ketuk. */
export const PICK_TOLERANCE_PX = 8;

/** Ruang di 2D dan 3D, serta lingkaran sorotan fasilitas yang ikonnya tersembunyi. */
const FLOOR_PICK_LAYERS = [
  HIGHLIGHT_LAYER_IDS.point,
  HIGHLIGHT_LAYER_IDS.extrusion,
  LAYER_IDS.extrusion,
  LAYER_IDS.rooms,
];

function idOf(properties: Record<string, unknown> | undefined): string | null {
  return typeof properties?.id === 'string' ? properties.id : null;
}

/**
 * Sasaran di titik layar: label lebih dulu karena digambar paling atas, lalu fitur lantai teratas
 * tepat di bawah titik (bukan kotak, agar unit sebelah tidak ikut terpilih).
 */
export function pickAt(map: MapLibreMap, point: { x: number; y: number }): MapPick | null {
  if (map.getLayer(LABEL_LAYER_ID)) {
    const t = PICK_TOLERANCE_PX;
    const box: [PointLike, PointLike] = [
      [point.x - t, point.y - t],
      [point.x + t, point.y + t],
    ];
    for (const hit of map.queryRenderedFeatures(box, { layers: [LABEL_LAYER_ID] })) {
      const kind = hit.properties?.kind;
      const id = idOf(hit.properties);
      if (id && (kind === 'location' || kind === 'facility')) return { layer: 'label', kind, id };
    }
  }
  const layers = FLOOR_PICK_LAYERS.filter((id) => map.getLayer(id));
  if (!layers.length) return null;
  const [hit] = map.queryRenderedFeatures([point.x, point.y], { layers });
  const id = idOf(hit?.properties);
  return id ? { layer: 'floor', id } : null;
}
