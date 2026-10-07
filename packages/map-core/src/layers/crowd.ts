import type { Feature, FeatureCollection, Point } from 'geojson';
import type { GeoJSONSource, LayerSpecification, Map as MapLibreMap } from 'maplibre-gl';
import { prefersReducedMotion } from '../camera';
import {
  type Crowd,
  type CrowdArea,
  type CrowdGraph,
  createCrowd,
  personFacing,
  personFrame,
  personPosition,
  stepCrowd,
} from '../crowd';
import {
  CROWD_FRAMES,
  CROWD_PIXEL_RATIO,
  type CrowdFacing,
  type CrowdFrame,
  renderCrowdSprite,
} from '../crowd-sprite';
import { LABEL_LAYER_ID } from './labels';

export const CROWD_SOURCE_ID = 'crowd';
export const CROWD_LAYER_ID = 'crowd-people';
/** Di bawah zoom ini orang terlalu kecil untuk dilihat; layer disembunyikan dan simulasi berhenti. */
export const CROWD_MIN_ZOOM = 16.5;
/** Pembaruan posisi ±20 kali per detik: cukup halus untuk jalan kaki, ringan untuk HP. */
const FRAME_MS = 50;
/** Langkah simulasi maksimum agar orang tidak melompat setelah tab disembunyikan. */
const MAX_STEP_S = 0.25;

export interface CrowdInput {
  graph: CrowdGraph;
  /** Lantai yang tampil; hanya orang di lantai ini yang dibuat. */
  floorIds: readonly string[];
  /** Benih acak, misalnya id venue. */
  seed: string;
  density?: number;
  /** Ruang tempat orang berdiri (lihat `CrowdOptions.areas`). */
  areas?: readonly CrowdArea[];
}

export const crowdIconId = (key: string, frame: CrowdFrame, facing: CrowdFacing) =>
  `crowd-${key}-${frame}-${facing}`;

/** Titik per orang yang tampil; `icon` memilih gambar tampilan, bingkai langkah, dan arah hadap. */
export function crowdCollection(
  crowd: Crowd | null,
  bearing: number,
  animate = true,
): FeatureCollection<Point> {
  if (!crowd) return { type: 'FeatureCollection', features: [] };
  const features: Feature<Point>[] = [];
  for (const person of crowd.people) {
    if (person.away) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: personPosition(crowd, person) },
      properties: {
        id: person.id,
        icon: crowdIconId(person.key, personFrame(person, animate), personFacing(person, bearing)),
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

/**
 * Orang berdiri tegak menghadap layar (billboard) di 2D maupun 3D, kaki di titiknya. Tidak ikut
 * tabrakan label agar nama lokasi dan ikon tetap tampil; urutan gambar mengikuti posisi layar
 * sehingga orang di depan menutupi yang di belakang.
 */
export function crowdLayer(): LayerSpecification {
  return {
    id: CROWD_LAYER_ID,
    type: 'symbol',
    source: CROWD_SOURCE_ID,
    minzoom: CROWD_MIN_ZOOM,
    layout: {
      'icon-image': ['get', 'icon'],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'viewport',
      'icon-rotation-alignment': 'viewport',
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        CROWD_MIN_ZOOM,
        0.5,
        18,
        0.75,
        19,
        1,
        20,
        1.4,
        22,
        2.2,
      ],
    },
  };
}

interface CrowdState {
  input: CrowdInput;
  crowd: Crowd;
  frame: number;
  last: number;
  lastDraw: number;
}

const states = new WeakMap<MapLibreMap, CrowdState>();

function ensureLayer(map: MapLibreMap) {
  if (map.getSource(CROWD_SOURCE_ID)) return;
  map.addSource(CROWD_SOURCE_ID, { type: 'geojson', data: crowdCollection(null, 0) });
  map.addLayer(crowdLayer(), map.getLayer(LABEL_LAYER_ID) ? LABEL_LAYER_ID : undefined);
}

/**
 * Gambar dibuat sekali per tampilan dan dipakai ulang antarlantai: pejalan butuh tiga bingkai ×
 * dua arah, yang berdiri cukup bingkai berdiri.
 */
function ensureImages(map: MapLibreMap, crowd: Crowd) {
  for (const person of crowd.people) {
    for (const frame of person.walker ? CROWD_FRAMES : (['stand'] as const)) {
      for (const facing of ['left', 'right'] as const) {
        const id = crowdIconId(person.key, frame, facing);
        if (!map.hasImage(id)) {
          map.addImage(id, renderCrowdSprite(person.look, frame, facing), {
            pixelRatio: CROWD_PIXEL_RATIO,
          });
        }
      }
    }
  }
}

const sameInput = (a: CrowdInput, b: CrowdInput) =>
  a.graph === b.graph &&
  a.seed === b.seed &&
  a.density === b.density &&
  a.areas === b.areas &&
  a.floorIds.length === b.floorIds.length &&
  a.floorIds.every((id, i) => id === b.floorIds[i]);

function stop(map: MapLibreMap) {
  const state = states.get(map);
  if (state?.frame) window.cancelAnimationFrame(state.frame);
  states.delete(map);
}

function draw(map: MapLibreMap, crowd: Crowd | null, animate: boolean) {
  map
    .getSource<GeoJSONSource>(CROWD_SOURCE_ID)
    ?.setData(crowdCollection(crowd, map.getBearing(), animate));
}

/**
 * Menampilkan orang mini di lantai yang tampil; `null` menghapusnya. Orang berjalan selama tab
 * terlihat dan peta cukup dekat; dengan `prefers-reduced-motion` mereka hanya berdiri di tempat.
 * Lantai yang sama (benih dan lantai sama) selalu berisi orang yang sama.
 */
export function setCrowd(map: MapLibreMap, input: CrowdInput | null): void {
  ensureLayer(map);
  const current = states.get(map);
  if (input && current && sameInput(current.input, input)) return;
  stop(map);
  if (!input) {
    draw(map, null, false);
    return;
  }
  const crowd = createCrowd(input.graph, input.floorIds, {
    seed: input.seed,
    ...(input.density === undefined ? {} : { density: input.density }),
    ...(input.areas ? { areas: input.areas } : {}),
  });
  ensureImages(map, crowd);
  const animate = typeof window !== 'undefined' && !prefersReducedMotion();
  draw(map, crowd, animate);
  const state: CrowdState = { input, crowd, frame: 0, last: 0, lastDraw: 0 };
  states.set(map, state);
  if (!animate || crowd.people.every((person) => !person.walker)) return;
  state.last = performance.now();
  const tick = (now: number) => {
    state.frame = window.requestAnimationFrame(tick);
    if (now - state.lastDraw < FRAME_MS) return;
    const dt = Math.min(MAX_STEP_S, (now - state.last) / 1000);
    state.last = now;
    if (document.hidden || map.getZoom() < CROWD_MIN_ZOOM) return;
    state.lastDraw = now;
    stepCrowd(crowd, dt);
    draw(map, crowd, true);
  };
  state.frame = window.requestAnimationFrame(tick);
  map.once('remove', () => stop(map));
}
