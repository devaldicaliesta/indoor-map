import { type Geometry, GeometrySchema } from '@indoor/domain';
import type { FilterSpecification, Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import {
  type GeoJSONStoreFeatures,
  TerraDraw,
  TerraDrawLineStringMode,
  TerraDrawPointMode,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
  ValidateNotSelfIntersecting,
} from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import { EDIT_COLORS } from './defaults';
import { buildStyleLayers, LAYER_IDS } from './style';

export type EditorTool = 'select' | 'polygon' | 'linestring' | 'point';

export interface EditableFeature {
  id: string;
  geometry: Geometry;
}

export interface FeatureEditorCallbacks {
  /** Geometri baru selesai digambar dengan alat poligon/garis/titik. */
  onDraw(geometry: Geometry): void;
  /** Geometri fitur yang sedang disunting selesai diubah (tarik fitur/titik, tambah/hapus titik). */
  onEdit(id: string, geometry: Geometry): void;
  /** Klik pada fitur lantai di alat pilih; `null` bila klik di ruang kosong. */
  onPick(id: string | null): void;
}

export interface FeatureEditor {
  setTool(tool: EditorTool): void;
  /** Fitur yang sedang disunting (tampil dengan pegangan), atau `null`. */
  edit(feature: EditableFeature | null): void;
  destroy(): void;
}

/** Layer lantai yang bisa diklik untuk memilih fitur. */
const PICKABLE_LAYERS = [
  LAYER_IDS.flat,
  LAYER_IDS.rooms,
  LAYER_IDS.walls,
  LAYER_IDS.points,
  LAYER_IDS.extrusion,
];
const PICK_TOLERANCE_PX = 4;

const MODE_OF: Record<Geometry['type'], string> = {
  Point: 'point',
  LineString: 'linestring',
  Polygon: 'polygon',
  MultiPolygon: 'polygon',
};

/**
 * Menyembunyikan satu fitur dari layer lantai selama ia tampil di lapisan sunting,
 * dengan filter (tanpa `setData`, sehingga murah untuk lantai 1.000 fitur).
 */
export function setHiddenFeature(map: MapLibreMap, id: string | null): void {
  for (const layer of buildStyleLayers()) {
    if (!map.getLayer(layer.id) || !('filter' in layer)) continue;
    const base = layer.filter as FilterSpecification | undefined;
    const hide: FilterSpecification = ['!=', ['get', 'id'], id ?? ''];
    const filter = id ? (base ? (['all', base, hide] as FilterSpecification) : hide) : base;
    map.setFilter(layer.id, filter ?? null);
  }
}

function drawStyles() {
  const { signal, ink, paper } = EDIT_COLORS;
  return {
    polygon: {
      fillColor: signal,
      fillOpacity: 0.25,
      outlineColor: ink,
      outlineWidth: 2,
      closingPointColor: signal,
      closingPointOutlineColor: ink,
    },
    linestring: { lineStringColor: ink, lineStringWidth: 3, closingPointColor: signal },
    point: { pointColor: signal, pointWidth: 6, pointOutlineColor: ink, pointOutlineWidth: 2 },
    select: {
      selectedPolygonColor: signal,
      selectedPolygonFillOpacity: 0.3,
      selectedPolygonOutlineColor: ink,
      selectedPolygonOutlineWidth: 2,
      selectedLineStringColor: ink,
      selectedLineStringWidth: 3,
      selectedPointColor: signal,
      selectedPointWidth: 7,
      selectedPointOutlineColor: ink,
      selectedPointOutlineWidth: 2,
      selectionPointColor: ink,
      selectionPointOutlineColor: paper,
      selectionPointWidth: 5,
      midPointColor: paper,
      midPointOutlineColor: ink,
    },
  } as const;
}

const editableFlags = {
  feature: {
    draggable: true,
    coordinates: { midpoints: true, draggable: true, deletable: true },
  },
};

/**
 * Lapisan interaksi editor peta. Sumber kebenaran geometri ada di luar (store editor);
 * terra-draw hanya memegang fitur yang sedang digambar atau disunting, sehingga lantai
 * dengan ribuan fitur tetap dirender lewat layer style biasa.
 */
export function createFeatureEditor(
  map: MapLibreMap,
  callbacks: FeatureEditorCallbacks,
): FeatureEditor {
  const styles = drawStyles();
  const terra = new TerraDraw({
    adapter: new TerraDrawMapLibreGLAdapter({ map }),
    idStrategy: {
      isValidId: (id) => typeof id === 'string' && id.length > 0,
      getId: () => crypto.randomUUID(),
    },
    modes: [
      new TerraDrawPolygonMode({
        validation: (feature) => ValidateNotSelfIntersecting(feature),
        styles: styles.polygon,
      }),
      new TerraDrawLineStringMode({ styles: styles.linestring }),
      new TerraDrawPointMode({ styles: styles.point }),
      new TerraDrawSelectMode({
        styles: styles.select,
        // Hapus dan pintasan lain lewat store editor (T-110), bukan langsung di terra-draw.
        keyEvents: null,
        allowManualDeselection: false,
        flags: {
          polygon: editableFlags,
          linestring: editableFlags,
          point: { feature: { draggable: true } },
        },
      }),
    ],
  });
  terra.start();
  terra.setMode('select');

  let tool: EditorTool = 'select';
  let editing: string | null = null;

  const geometryOf = (feature: GeoJSONStoreFeatures | undefined): Geometry | null => {
    const parsed = GeometrySchema.safeParse(feature?.geometry);
    return parsed.success ? parsed.data : null;
  };

  terra.on('finish', (id, context) => {
    const geometry = geometryOf(terra.getSnapshotFeature(id));
    if (!geometry) return;
    if (context.action === 'draw') {
      // Fitur baru pindah ke store; terra-draw siap menggambar berikutnya.
      terra.removeFeatures([id]);
      callbacks.onDraw(geometry);
    } else if (id === editing) {
      callbacks.onEdit(String(id), geometry);
    }
  });

  function onClick(e: MapMouseEvent) {
    if (tool !== 'select') return;
    const onEditing = terra
      .getFeaturesAtPointerEvent(e.originalEvent, { ignoreSelectFeatures: false })
      .some((f) => f.id === editing || f.properties.selectionPoint || f.properties.midPoint);
    if (onEditing) return;
    const { x, y } = e.point;
    const hits = map.queryRenderedFeatures(
      [
        [x - PICK_TOLERANCE_PX, y - PICK_TOLERANCE_PX],
        [x + PICK_TOLERANCE_PX, y + PICK_TOLERANCE_PX],
      ],
      { layers: PICKABLE_LAYERS.filter((id) => map.getLayer(id)) },
    );
    // Titik dan garis di atas poligon lebih mudah dipilih bila didahulukan.
    const order = (type: string) => (type === 'Point' ? 0 : type === 'LineString' ? 1 : 2);
    const hit = hits.sort((a, b) => order(a.geometry.type) - order(b.geometry.type))[0];
    const id = hit?.properties?.id;
    callbacks.onPick(typeof id === 'string' ? id : null);
  }
  map.on('click', onClick);

  function clearEditing() {
    if (editing && terra.hasFeature(editing)) terra.removeFeatures([editing]);
    editing = null;
  }

  return {
    setTool(next) {
      tool = next;
      if (next !== 'select') clearEditing();
      terra.setMode(next);
    },
    edit(feature) {
      if (feature?.id === editing) return;
      clearEditing();
      if (!feature || tool !== 'select') return;
      const [result] = terra.addFeatures([
        {
          id: feature.id,
          type: 'Feature',
          geometry: feature.geometry as GeoJSONStoreFeatures['geometry'],
          properties: { mode: MODE_OF[feature.geometry.type] },
        },
      ]);
      if (!result?.valid) return;
      editing = feature.id;
      terra.selectFeature(feature.id);
    },
    destroy() {
      map.off('click', onClick);
      terra.stop();
    },
  };
}
