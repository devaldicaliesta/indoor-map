import { type Geometry, GeometrySchema } from '@indoor/domain';
import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import {
  type GeoJSONStoreFeatures,
  type SnappableContext,
  TerraDraw,
  TerraDrawLineStringMode,
  type TerraDrawMouseEvent,
  TerraDrawPointMode,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
  ValidateNotSelfIntersecting,
} from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import { COORDINATE_DECIMALS, EDIT_COLORS } from './defaults';
import type { LngLat } from './georef';
import { type GraphElement, graphElementAt } from './layers/graph';
import { PICKABLE_LAYERS } from './selection';
import { closestOnSegment, type Px, SNAP_TOLERANCE_PX, snapPoint } from './snap';
import type { BBox, SnapCandidates } from './snap-index';
import { roundCoordinate, roundGeometry } from './transform';

export type EditorTool = 'select' | 'polygon' | 'linestring' | 'point' | 'path';

export interface EditableFeature {
  id: string;
  geometry: Geometry;
}

export interface FeatureEditorCallbacks {
  /** Geometri baru selesai digambar dengan alat poligon/garis/titik. */
  onDraw(geometry: Geometry): void;
  /** Geometri fitur yang sedang disunting selesai diubah (tarik fitur/titik, tambah/hapus titik). */
  onEdit(id: string, geometry: Geometry): void;
  /** Klik pada fitur lantai di alat pilih; `null` bila klik di ruang kosong. Shift = tambah/kurangi. */
  onPick(id: string | null, additive: boolean): void;
  /** Garis jalur selesai digambar dengan alat jalur (titik-titiknya berurutan). */
  onDrawPath?(coordinates: LngLat[]): void;
  /** Klik pada node atau edge graf di alat pilih; didahulukan dari fitur di bawahnya. */
  onPickGraph?(element: GraphElement): void;
  /**
   * Klik di alat pilih yang lebih dulu ditangani alat lain (misalnya menyambung titik masuk ke
   * jalur); `true` = klik itu sudah dipakai sehingga seleksi tidak berubah.
   */
  interceptClick?(at: LngLat, point: { x: number; y: number }): boolean;
  /** `enabled` false = snapping dimatikan di bilah status. */
  snap: {
    enabled(): boolean;
    candidates(bbox: BBox, excludeId: string | null): SnapCandidates;
  };
}

export interface FeatureEditor {
  setTool(tool: EditorTool): void;
  /** Fitur yang sedang disunting (tampil dengan pegangan), atau `null`. */
  edit(feature: EditableFeature | null): void;
  destroy(): void;
}

const PICK_TOLERANCE_PX = 4;

const MODE_OF: Record<Geometry['type'], string> = {
  Point: 'point',
  LineString: 'linestring',
  Polygon: 'polygon',
  MultiPolygon: 'polygon',
};

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
    path: { lineStringColor: ink, lineStringWidth: 2, closingPointColor: signal },
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

/** Tipe opsi snapping terra-draw (tidak diekspor langsung oleh paketnya). */
type Snapping = NonNullable<
  NonNullable<ConstructorParameters<typeof TerraDrawPolygonMode>[0]>['snapping']
>;

const editableFlags = (snapping: Snapping) => ({
  feature: {
    draggable: true,
    coordinates: { midpoints: true, draggable: true, deletable: true, snappable: snapping },
  },
});

/** Ray casting: titik layar di dalam cincin poligon (koordinat layar). */
function insideRing(p: Px, ring: readonly Px[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as Px;
    const [xj, yj] = ring[j] as Px;
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

/** Klik mengenai geometri yang sedang disunting (isi poligon, dekat garis, dekat titik). */
function hitsGeometry(
  geometry: Geometry,
  p: Px,
  toPx: (c: LngLat) => Px,
  tolerance: number,
): boolean {
  const near = (a: Px, b: Px) => {
    const q = closestOnSegment(p, a, b);
    return Math.hypot(q[0] - p[0], q[1] - p[1]) <= tolerance;
  };
  switch (geometry.type) {
    case 'Point': {
      const q = toPx(geometry.coordinates);
      return near(q, q);
    }
    case 'LineString': {
      const pts = geometry.coordinates.map((c) => toPx(c as LngLat));
      return pts.slice(1).some((b, i) => near(pts[i] as Px, b));
    }
    case 'Polygon':
      return insideRing(
        p,
        (geometry.coordinates[0] ?? []).map((c) => toPx(c as LngLat)),
      );
    case 'MultiPolygon':
      return geometry.coordinates.some((poly) =>
        insideRing(
          p,
          (poly[0] ?? []).map((c) => toPx(c as LngLat)),
        ),
      );
  }
}

/** Titik yang sudah ditempatkan pada geometri yang sedang digambar (tanpa titik kursor). */
function placedVertices(context: SnappableContext): LngLat[] {
  const geometry = context.getCurrentGeometrySnapshot();
  if (!geometry || context.currentCoordinate === undefined) return [];
  const coords =
    geometry.type === 'Polygon' ? (geometry.coordinates[0] ?? []) : geometry.coordinates;
  return coords.slice(0, context.currentCoordinate) as LngLat[];
}

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
  let editing: string | null = null;

  // Tempel ke vertex/tepi fitur lain dan sudut siku; tahan Alt untuk mematikan sementara.
  const snapping: Snapping = {
    toCustom(event: TerraDrawMouseEvent, context: SnappableContext) {
      if (!callbacks.snap.enabled() || event.heldKeys.includes('Alt')) return undefined;
      const pointer: Px = [event.containerX, event.containerY];
      const t = SNAP_TOLERANCE_PX;
      const sw = map.unproject([pointer[0] - t, pointer[1] + t]);
      const ne = map.unproject([pointer[0] + t, pointer[1] - t]);
      const found = callbacks.snap.candidates([sw.lng, sw.lat, ne.lng, ne.lat], editing);
      const px = (p: LngLat): Px => {
        const { x, y } = map.project(p);
        return [x, y];
      };
      const result = snapPoint({
        pointer,
        vertices: found.vertices.map(px),
        segments: found.segments.map(([a, b]) => [px(a), px(b)] as const),
        previous: placedVertices(context).map(px),
      });
      if (!result) return undefined;
      const { lng, lat } = map.unproject(result.point);
      return roundCoordinate([lng, lat]);
    },
  };

  const terra = new TerraDraw({
    adapter: new TerraDrawMapLibreGLAdapter({ map, coordinatePrecision: COORDINATE_DECIMALS }),
    idStrategy: {
      isValidId: (id) => typeof id === 'string' && id.length > 0,
      getId: () => crypto.randomUUID(),
    },
    modes: [
      new TerraDrawPolygonMode({
        validation: (feature) => ValidateNotSelfIntersecting(feature),
        styles: styles.polygon,
        snapping,
      }),
      new TerraDrawLineStringMode({ styles: styles.linestring, snapping }),
      new TerraDrawLineStringMode({ modeName: 'path', styles: styles.path, snapping }),
      new TerraDrawPointMode({ styles: styles.point }),
      new TerraDrawSelectMode({
        styles: styles.select,
        // Hapus dan pintasan lain lewat store editor, bukan langsung di terra-draw.
        keyEvents: null,
        allowManualDeselection: false,
        flags: {
          polygon: editableFlags(snapping),
          linestring: editableFlags(snapping),
          point: { feature: { draggable: true } },
        },
      }),
    ],
  });
  terra.start();
  terra.setMode('select');

  let tool: EditorTool = 'select';

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
      if (context.mode === 'path' && geometry.type === 'LineString') {
        callbacks.onDrawPath?.(geometry.coordinates as LngLat[]);
      } else callbacks.onDraw(geometry);
    } else if (id === editing) {
      callbacks.onEdit(String(id), geometry);
    }
  });

  function onClick(e: MapMouseEvent) {
    if (tool !== 'select') return;
    if (callbacks.interceptClick?.([e.lngLat.lng, e.lngLat.lat], e.point)) return;
    const onHandle = terra
      .getFeaturesAtPointerEvent(e.originalEvent, { ignoreSelectFeatures: false })
      .some((f) => f.id === editing || f.properties.selectionPoint || f.properties.midPoint);
    const editedGeometry = editing ? geometryOf(terra.getSnapshotFeature(editing)) : null;
    const toPx = (c: LngLat): Px => {
      const { x, y } = map.project(c);
      return [x, y];
    };
    if (onHandle && !e.originalEvent.shiftKey) return;
    const graph = callbacks.onPickGraph
      ? graphElementAt(map, e.point, PICK_TOLERANCE_PX + 2)
      : null;
    if (graph) {
      callbacks.onPickGraph?.(graph);
      return;
    }
    // Klik di dalam fitur yang sedang disunting tidak membatalkan seleksi (kecuali Shift).
    const onEdited =
      editedGeometry !== null &&
      hitsGeometry(editedGeometry, [e.point.x, e.point.y], toPx, PICK_TOLERANCE_PX + 2);
    if (onEdited && !e.originalEvent.shiftKey) return;
    const { x, y } = e.point;
    const hits = map.queryRenderedFeatures(
      [
        [x - PICK_TOLERANCE_PX, y - PICK_TOLERANCE_PX],
        [x + PICK_TOLERANCE_PX, y + PICK_TOLERANCE_PX],
      ],
      { layers: PICKABLE_LAYERS.filter((layer) => map.getLayer(layer)) },
    );
    // Titik dan garis di atas poligon lebih mudah dipilih bila didahulukan.
    const order = (type: string) => (type === 'Point' ? 0 : type === 'LineString' ? 1 : 2);
    const hit = hits.sort((a, b) => order(a.geometry.type) - order(b.geometry.type))[0];
    const id = hit?.properties?.id;
    callbacks.onPick(typeof id === 'string' ? id : null, e.originalEvent.shiftKey);
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
      if (feature && feature.id === editing) {
        // Geometri bisa berubah dari luar (undo/redo, putar): segarkan lapisan sunting.
        const current = terra.getSnapshotFeature(feature.id)?.geometry;
        if (JSON.stringify(current) === JSON.stringify(roundGeometry(feature.geometry))) return;
      }
      clearEditing();
      if (!feature || tool !== 'select') return;
      const [result] = terra.addFeatures([
        {
          id: feature.id,
          type: 'Feature',
          // terra-draw menolak koordinat lebih dari 9 desimal (hasil putar/geser/snap).
          geometry: roundGeometry(feature.geometry) as GeoJSONStoreFeatures['geometry'],
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
