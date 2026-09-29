import { type Polygon, PolygonSchema } from '@indoor/domain';
import type { Map as MapLibreMap } from 'maplibre-gl';
import {
  type GeoJSONStoreFeatures,
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
  ValidateNotSelfIntersecting,
} from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';

/** Warna gambar mengikuti token --signal (sorotan) dan --ink (garis). */
const DRAW_FILL = '#ffc20e';
const DRAW_LINE = '#111418';

export interface PolygonDrawer {
  /** Mulai menggambar poligon baru (menghapus yang ada). */
  draw(): void;
  /** Menampilkan poligon yang ada dalam mode edit (geser titik, tambah titik tengah). */
  edit(polygon: Polygon): void;
  current(): Polygon | null;
  destroy(): void;
}

/**
 * Menggambar/mengubah satu poligon (footprint gedung, lalu unit di editor peta).
 * Poligon yang memotong dirinya sendiri ditolak saat digambar.
 */
export function createPolygonDrawer(
  map: MapLibreMap,
  onChange: (polygon: Polygon | null) => void,
): PolygonDrawer {
  const terra = new TerraDraw({
    adapter: new TerraDrawMapLibreGLAdapter({ map }),
    modes: [
      new TerraDrawPolygonMode({
        validation: (feature) => ValidateNotSelfIntersecting(feature),
        styles: {
          fillColor: DRAW_FILL,
          fillOpacity: 0.25,
          outlineColor: DRAW_LINE,
          outlineWidth: 2,
          closingPointColor: DRAW_FILL,
          closingPointOutlineColor: DRAW_LINE,
        },
      }),
      new TerraDrawSelectMode({
        styles: {
          selectedPolygonColor: DRAW_FILL,
          selectedPolygonFillOpacity: 0.3,
          selectedPolygonOutlineColor: DRAW_LINE,
          selectedPolygonOutlineWidth: 2,
          selectionPointColor: DRAW_LINE,
          selectionPointOutlineColor: '#ffffff',
          selectionPointWidth: 5,
          midPointColor: '#ffffff',
          midPointOutlineColor: DRAW_LINE,
        },
        flags: {
          polygon: {
            feature: {
              draggable: true,
              coordinates: { midpoints: true, draggable: true, deletable: true },
            },
          },
        },
      }),
    ],
  });
  terra.start();

  // Snapshot juga berisi titik pegangan mode select; ambil poligon yang sudah selesai digambar.
  const drawnPolygons = (features: GeoJSONStoreFeatures[]) =>
    features.filter((f) => f.properties.mode === 'polygon' && !f.properties.currentlyDrawing);
  const polygonOf = (features: GeoJSONStoreFeatures[]): Polygon | null => {
    const parsed = PolygonSchema.safeParse(drawnPolygons(features).at(-1)?.geometry);
    return parsed.success ? parsed.data : null;
  };
  const current = () => polygonOf(terra.getSnapshot());

  terra.on('finish', (id) => {
    // Satu poligon saja: setelah selesai, pindah ke mode edit untuk poligon itu.
    const older = drawnPolygons(terra.getSnapshot()).flatMap((f) =>
      f.id !== id && f.id !== undefined ? [f.id] : [],
    );
    if (older.length) terra.removeFeatures(older);
    terra.setMode('select');
    terra.selectFeature(id);
    onChange(current());
  });
  terra.on('change', () => onChange(current()));

  return {
    draw() {
      terra.clear();
      terra.setMode('polygon');
      onChange(null);
    },
    edit(polygon) {
      terra.clear();
      const [result] = terra.addFeatures([
        { type: 'Feature', geometry: polygon, properties: { mode: 'polygon' } },
      ]);
      terra.setMode('select');
      if (result?.valid && result.id !== undefined) terra.selectFeature(result.id);
    },
    current,
    destroy() {
      terra.stop();
    },
  };
}
