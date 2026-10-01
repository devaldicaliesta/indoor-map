import type { Building, Point } from '@indoor/domain';
import {
  calibratePlacement,
  distanceM,
  initialPlacement,
  type LngLat,
  type Placement,
  placementFromCorners,
} from '@indoor/map-core';
import { useEffect, useState } from 'react';
import type { FloorPlanVersion } from './queries';

const FALLBACK_CENTER: LngLat = [106.8272, -6.1754];
const FALLBACK_WIDTH_M = 60;

export type Measure =
  | { step: 'idle' }
  | { step: 'picking' }
  | { step: 'measured'; a: LngLat; b: LngLat };

function footprintBox(building: Building | undefined) {
  const ring = building?.footprint?.coordinates[0];
  if (!ring?.length) return null;
  const xs = ring.map((p) => p[0] as number);
  const ys = ring.map((p) => p[1] as number);
  const [minX, maxX, minY, maxY] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  return {
    center: [(minX + maxX) / 2, (minY + maxY) / 2] as LngLat,
    widthM: distanceM([minX, minY], [maxX, minY]),
  };
}

function loadImageSize(url: string): Promise<[number, number]> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
    image.onerror = () => resolve([1, 1]);
    image.src = url;
  });
}

/**
 * Posisi awal: yang tersimpan, atau (belum pernah ditempatkan) seukuran footprint
 * gedung di tengahnya, dengan rasio gambar asli.
 */
async function startingPlacement(
  plan: FloorPlanVersion,
  building: Building | undefined,
  venueCenter: Point | null,
): Promise<Placement> {
  if (plan.corners?.length === 4) {
    return placementFromCorners(plan.corners as [LngLat, LngLat, LngLat, LngLat]);
  }
  const box = footprintBox(building);
  const center = box?.center ?? (venueCenter?.coordinates as LngLat | undefined) ?? FALLBACK_CENTER;
  const [w, h] = await loadImageSize(plan.imageUrl);
  return initialPlacement(center, box?.widthM || FALLBACK_WIDTH_M, w, h);
}

export function useGeoreference(
  plan: FloorPlanVersion | undefined,
  building: Building | undefined,
  venueCenter: Point | null,
  ready: boolean,
) {
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [opacity, setOpacity] = useState(0.6);
  const [lockAspect, setLockAspect] = useState(true);
  const [measure, setMeasure] = useState<Measure>({ step: 'idle' });
  const [dirty, setDirty] = useState(false);
  const planId = plan?.id;

  // Mulai ulang hanya bila versi denah berganti, bukan tiap URL bertanda diperbarui.
  useEffect(() => {
    if (!plan || !ready) return;
    let cancelled = false;
    void startingPlacement(plan, building, venueCenter).then((start) => {
      if (cancelled) return;
      setPlacement(start);
      setOpacity(plan.opacity);
      setDirty(false);
    });
    return () => {
      cancelled = true;
    };
  }, [planId, ready]);

  function change(next: Placement) {
    setPlacement(next);
    setDirty(true);
  }

  function calibrate(realDistanceM: number) {
    if (!placement || measure.step !== 'measured') return;
    const result = calibratePlacement(placement, measure.a, measure.b, realDistanceM);
    change(result.placement);
    setMeasure({ step: 'measured', a: result.a, b: result.b });
  }

  return {
    placement,
    opacity,
    lockAspect,
    measure,
    dirty,
    change,
    setOpacity: (value: number) => {
      setOpacity(value);
      setDirty(true);
    },
    setLockAspect,
    setMeasure,
    calibrate,
    markSaved: () => setDirty(false),
  };
}
