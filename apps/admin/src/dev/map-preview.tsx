import { initialFloorView, sortFloorsTopDown } from '@indoor/domain';
import sample from '@indoor/domain/fixtures/venue-sample.json';
import {
  createMap,
  type FloorFeatureCollection,
  featureBounds,
  type MapInstance,
  setFloorData,
  setViewMode,
  type ViewMode,
} from '@indoor/map-core';
import { FloorSwitcher, type MapControlLabels, MapControls } from '@indoor/ui';
import { useEffect, useRef, useState } from 'react';

// Pratinjau peta khusus pengembangan dengan fixture venue contoh.
const all = sample.features as FloorFeatureCollection;
const floors = sample.floors.map((f, i) => ({ ...f, sortOrder: i }));
const buildings = sample.buildings.map((b) => ({ ...b, defaultFloorId: null }));
// Tampilan awal dari gedung/lantai default (fixture tanpa default → fallback).
const start = initialFloorView(null, buildings, floors);

/** Lantai sintetis 1.000 fitur untuk mengukur kecepatan ganti lantai. */
function syntheticFloor(): FloorFeatureCollection {
  const [lng, lat] = sample.venue.center as [number, number];
  const size = 0.00003;
  const features: FloorFeatureCollection['features'] = [];
  for (let i = 0; i < 1000; i += 1) {
    const x = lng - 0.0005 + (i % 40) * size * 1.2;
    const y = lat + 0.0005 - Math.floor(i / 40) * size * 1.2;
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [x, y],
            [x + size, y],
            [x + size, y - size],
            [x, y - size],
            [x, y],
          ],
        ],
      },
      properties: { id: `synthetic-${i}`, kind: 'unit', floorId: 'synthetic', unitCode: `S-${i}` },
    });
  }
  return { type: 'FeatureCollection', features };
}

function floorFeatures(floorId: string): FloorFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: all.features.filter((f) => f.properties.floorId === floorId),
  };
}

export function MapPreview({
  labels,
}: {
  labels: MapControlLabels & { floor: string; synthetic: string; floorSwitcher: string };
}) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapInstance | null>(null);
  const [floorId, setFloorId] = useState(start?.floorId ?? '');
  const [mode, setMode] = useState<ViewMode>('2d');
  const [bearing, setBearing] = useState(0);
  const [lastSwitchMs, setLastSwitchMs] = useState<number | null>(null);

  useEffect(() => {
    if (!container.current) return;
    const instance = createMap(container.current, {
      center: sample.venue.center as [number, number],
      zoom: 18,
    });
    instance.on('rotate', () => setBearing(instance.getBearing()));
    instance.once('load', () => {
      const first = floorFeatures(start?.floorId ?? '');
      setFloorData(instance, first);
      const bounds = featureBounds(first);
      if (bounds) instance.fitBounds(bounds, { padding: 40, duration: 0 });
      setMap(instance);
    });
    return () => instance.remove();
  }, []);

  function showFloor(id: string) {
    if (!map) return;
    const data = id === 'synthetic' ? syntheticFloor() : floorFeatures(id);
    const started = performance.now();
    setFloorData(map, data);
    map.once('idle', () => setLastSwitchMs(Math.round(performance.now() - started)));
    setFloorId(id);
  }

  return (
    <div className="relative h-dvh w-full">
      <div ref={container} className="h-full w-full" data-testid="map" />
      <div className="absolute top-3 left-3 flex flex-wrap gap-1 rounded-sm border border-line bg-surface p-1 shadow-float">
        {buildings.map((building) => {
          const first = initialFloorView(building.id, buildings, floors)?.floorId;
          const active = floors.find((f) => f.id === floorId)?.buildingId === building.id;
          return (
            <button
              key={building.id}
              type="button"
              aria-pressed={active}
              onClick={() => first && showFloor(first)}
              className={`h-9 cursor-pointer rounded-sm px-3 font-bold ${active ? 'bg-ink text-surface' : 'text-ink'}`}
            >
              {building.name}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={floorId === 'synthetic'}
          onClick={() => showFloor('synthetic')}
          className={`h-9 cursor-pointer rounded-sm px-3 font-bold ${floorId === 'synthetic' ? 'bg-ink text-surface' : 'text-ink'}`}
        >
          {labels.synthetic}
        </button>
      </div>
      <FloorSwitcher
        className="absolute top-3 right-3"
        label={labels.floorSwitcher}
        value={floorId}
        onChange={showFloor}
        floors={sortFloorsTopDown(
          floors.filter(
            (f) =>
              f.buildingId ===
              (floors.find((x) => x.id === floorId)?.buildingId ?? start?.buildingId),
          ),
        ).map((f) => ({ id: f.id, label: f.name }))}
      />
      <output
        data-testid="switch-ms"
        className="absolute bottom-3 left-3 rounded-sm bg-surface px-2 py-1 font-mono text-xs shadow-float"
      >
        {labels.floor}: {lastSwitchMs === null ? '–' : `${lastSwitchMs} ms`}
      </output>
      {map ? (
        <MapControls
          className="absolute right-3 bottom-3"
          labels={labels}
          bearing={bearing}
          mode={mode}
          onZoomIn={() => map.zoomIn()}
          onZoomOut={() => map.zoomOut()}
          onResetNorth={() => map.resetNorthPitch({ duration: 300 })}
          onModeChange={(next) => {
            setViewMode(map, next);
            setMode(next);
          }}
        />
      ) : null}
    </div>
  );
}
