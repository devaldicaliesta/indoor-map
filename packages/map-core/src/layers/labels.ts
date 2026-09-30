import type { MapLabel } from '@indoor/domain';
import type { FeatureCollection, Point } from 'geojson';
import type {
  ExpressionSpecification,
  FontFacesSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  SymbolLayerSpecification,
} from 'maplibre-gl';
import { FACILITY_ICON_PREFIX } from '../sprites';

export const LABEL_SOURCE_ID = 'labels';
export const LABEL_LAYER_ID = 'labels';

/**
 * Font label peta (05-desain-ui.md: Atkinson Hyperlegible dengan halo putih). Berkasnya
 * di-host sendiri dan digambar langsung oleh MapLibre lewat `font-faces`, jadi tidak perlu
 * server glyph.
 */
export interface LabelFont {
  /** Nama di `text-font` dan kunci `font-faces`. */
  name: string;
  faces: { url: string; unicodeRange?: string[] }[];
}

// Warna token --ink dan --surface; label harus terbaca di atas warna unit mana pun.
const TEXT_COLOR = '#111418';
const HALO_COLOR = '#ffffff';

const kind: ExpressionSpecification = ['get', 'kind'];

export function labelFontFaces(font: LabelFont): FontFacesSpecification {
  return {
    [font.name]: font.faces.map((face) =>
      face.unicodeRange ? { url: face.url, 'unicode-range': face.unicodeRange } : { url: face.url },
    ),
  };
}

/**
 * Satu layer untuk nama lokasi dan ikon fasilitas agar tabrakan keduanya diselesaikan
 * bersama: `symbol-sort-key` = prioritas label, yang kalah disembunyikan pada zoom itu.
 */
export function labelLayer(font: LabelFont): SymbolLayerSpecification {
  return {
    id: LABEL_LAYER_ID,
    type: 'symbol',
    source: LABEL_SOURCE_ID,
    layout: {
      'symbol-sort-key': ['get', 'priority'],
      'icon-image': [
        'case',
        ['==', kind, 'facility'],
        ['concat', FACILITY_ICON_PREFIX, ['get', 'facilityTypeId']],
        '',
      ],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 15, 0.5, 18, 1],
      'icon-padding': 2,
      'text-field': ['case', ['==', kind, 'location'], ['get', 'name'], ''],
      'text-font': [font.name],
      'text-size': ['interpolate', ['linear'], ['zoom'], 17, 12, 20, 14],
      'text-max-width': 8,
      'text-padding': 4,
      'icon-allow-overlap': false,
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': TEXT_COLOR,
      'text-halo-color': HALO_COLOR,
      'text-halo-width': 1.5,
    },
  };
}

export function labelCollection(labels: readonly MapLabel[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: labels.map((label) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [...label.position] },
      properties:
        label.kind === 'location'
          ? { kind: label.kind, id: label.id, name: label.name, priority: label.priority }
          : {
              kind: label.kind,
              id: label.id,
              facilityTypeId: label.facilityTypeId,
              priority: label.priority,
            },
    })),
  };
}

/** Mengganti label yang tampil; peta harus dibuat dengan `labelFont`. */
export function setLabels(map: MapLibreMap, labels: readonly MapLabel[]): void {
  map.getSource<GeoJSONSource>(LABEL_SOURCE_ID)?.setData(labelCollection(labels));
}
