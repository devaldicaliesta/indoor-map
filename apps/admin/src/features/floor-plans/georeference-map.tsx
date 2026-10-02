import type { FloorFeatures } from '@indoor/data';
import type { FloorId } from '@indoor/domain';
import {
  createGeoreferencer,
  createMap,
  featureBounds,
  GEOREF_LAYER_IDS,
  type Georeferencer,
  type MapInstance,
  placementCorners,
  setFloorData,
  setReferenceShapes,
} from '@indoor/map-core';
import { useEffect, useRef, useState } from 'react';
import { ReferenceLayer } from '../editor/reference-layer';
import type { FloorPlanVersion } from './queries';
import type { useGeoreference } from './use-georeference';

/** Peta mode "Tempatkan denah": denah lantai ini, fiturnya, dan lantai acuan (opsional). */
export function GeoreferenceMap({
  plan,
  footprint,
  editable,
  state,
  features,
  referenceFloorId,
}: {
  plan: FloorPlanVersion;
  footprint: GeoJSON.Polygon | null;
  editable: boolean;
  state: ReturnType<typeof useGeoreference>;
  features: FloorFeatures | undefined;
  referenceFloorId: FloorId | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const georef = useRef<Georeferencer | null>(null);
  const [map, setMap] = useState<MapInstance | null>(null);
  const [ready, setReady] = useState(false);
  const start = useRef(state.placement);
  const onChange = useRef(state.change);
  onChange.current = state.change;

  useEffect(() => {
    const initial = start.current;
    if (!container.current || !initial) return;
    const instance = createMap(container.current, { center: initial.center, zoom: 18 });
    instance.once('load', () => {
      if (footprint) {
        setReferenceShapes(instance, {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: footprint, properties: {} }],
        });
      }
      const corners = placementCorners(initial);
      const bounds = featureBounds({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[...corners, corners[0]]] },
            properties: { id: 'plan', kind: 'unit', floorId: 'plan' },
          },
        ],
      });
      if (bounds) instance.fitBounds(bounds, { padding: 48, duration: 0 });
      setMap(instance);
    });
    return () => instance.remove();
  }, [footprint]);

  // Dibuat sekali per peta; nilai berikutnya disinkronkan oleh efek di bawah.
  useEffect(() => {
    const initial = start.current;
    if (!map || !initial) return;
    georef.current = createGeoreferencer(map, {
      imageUrl: plan.imageUrl,
      placement: initial,
      opacity: state.opacity,
      lockAspect: state.lockAspect,
      editable,
      onChange: (next) => onChange.current(next),
    });
    // Penanda untuk test E2E: denah sudah tergambar di peta.
    map.once('idle', () => setReady(true));
    return () => {
      georef.current?.destroy();
      georef.current = null;
    };
  }, [map, editable]);

  useEffect(() => {
    if (state.placement) georef.current?.setPlacement(state.placement);
  }, [state.placement]);
  useEffect(() => georef.current?.setOpacity(state.opacity), [state.opacity]);
  useEffect(() => georef.current?.setLockAspect(state.lockAspect), [state.lockAspect]);

  const { measure, setMeasure } = state;
  useEffect(() => {
    const g = georef.current;
    if (!g) return;
    if (measure.step === 'picking') {
      g.startMeasure((a, b) => setMeasure({ step: 'measured', a, b }));
    } else if (measure.step === 'measured') {
      g.showMeasurement([measure.a, measure.b]);
    } else {
      g.cancelMeasure();
      g.showMeasurement(null);
    }
  }, [measure, setMeasure]);

  useEffect(() => {
    if (map && features) setFloorData(map, features);
  }, [map, features]);

  return (
    <>
      <div
        ref={container}
        className="size-full"
        data-testid="georef-map"
        data-ready={ready ? 'true' : undefined}
      />
      <ReferenceLayer map={map} floorId={referenceFloorId} beforeId={GEOREF_LAYER_IDS.frameHit} />
    </>
  );
}
