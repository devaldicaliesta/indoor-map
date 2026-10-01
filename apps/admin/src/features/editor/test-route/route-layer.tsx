import type { Geometry } from '@indoor/domain';
import { focusFeature, type LngLat, type MapInstance, setRoute } from '@indoor/map-core';
import { routeOnFloor } from '@indoor/routing';
import { Button } from '@indoor/ui';
import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editor-store';
import { useTestRouteStore } from './test-route-store';

function geometryOf(coordinates: readonly LngLat[]): Geometry | null {
  const [first] = coordinates;
  if (!first) return null;
  return coordinates.length > 1
    ? { type: 'LineString', coordinates: [...coordinates] }
    : { type: 'Point', coordinates: first };
}

/**
 * Rute uji di lantai yang tampil beserta sorotan langkah aktif; kamera diarahkan ke langkah yang
 * dipilih setelah lantainya dimuat. Juga petunjuk saat asal/tujuan dipilih dengan klik peta.
 */
export function RouteLayer({ map }: { map: MapInstance | null }) {
  const floorId = useEditorStore((s) => s.floorId);
  const plan = useTestRouteStore((s) => s.plan);
  const activeStep = useTestRouteStore((s) => s.activeStep);
  const focus = useTestRouteStore((s) => s.focus);
  const picking = useTestRouteStore((s) => s.picking);

  useEffect(() => {
    if (!map) return;
    if (!plan?.ok || !floorId) {
      setRoute(map, null);
      return;
    }
    const step = activeStep === null ? undefined : plan.steps[activeStep];
    setRoute(map, {
      ...routeOnFloor(plan.route, floorId),
      active: step?.floorId === floorId ? step.coordinates : null,
    });
  }, [map, plan, floorId, activeStep]);

  // Ditunda satu frame agar tidak tertimpa pembingkaian lantai baru di kanvas.
  const shown = useRef(0);
  useEffect(() => {
    if (!map || !focus || focus.floorId !== floorId || shown.current === focus.seq) return;
    const frame = requestAnimationFrame(() => {
      shown.current = focus.seq;
      const geometry = geometryOf(focus.coordinates);
      if (geometry) focusFeature(map, geometry);
    });
    return () => cancelAnimationFrame(frame);
  }, [map, focus, floorId]);

  if (!picking) return null;
  return (
    <div
      role="status"
      className="absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-md bg-surface px-3 py-2 text-sm shadow-(--shadow-float)"
    >
      <span>
        Klik peta untuk memilih {picking === 'from' ? 'asal' : 'tujuan'} uji rute.{' '}
        <span className="text-ink-muted">Esc untuk batal.</span>
      </span>
      <Button size="sm" variant="ghost" onClick={() => useTestRouteStore.getState().stopPicking()}>
        Batal
      </Button>
    </div>
  );
}
