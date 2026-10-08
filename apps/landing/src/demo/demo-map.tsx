// Tanpa ini MapLibre mencari worker di sebelah modulnya sendiri, yang tidak ada di build produksi.
import '@indoor/map-core/worker';
import {
  buildingFloors,
  buildSnapshot,
  initialMapView,
  mapLabels,
  type Snapshot,
  visibleFloorIds,
} from '@indoor/domain';
import { concertVenue, hospitalVenue } from '@indoor/domain/fixtures/demo-venues/index.ts';
import {
  createMap,
  type FloorFeatureCollection,
  featureBounds,
  type MapInstance,
  PITCH_3D,
  setCrowd,
  setFacilityIcons,
  setFloorData,
  setLabels,
  setMapLabel,
  setViewMode,
} from '@indoor/map-core';
import { cn, FloorSwitcher, MapControls } from '@indoor/ui';
import { UsersRoundIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import '@indoor/map-core/styles.css';
import { useLanguage } from '../language';
import { crowdAreas, floorCollection, iconSpecs } from './demo-layers';
import { LABEL_FONT } from './label-font';
import { DestinationPicker, RouteCard } from './route-card';
import { useDemoRoute } from './use-demo-route';

export type DemoVenue = 'concert' | 'hospital';

const SNAPSHOTS: Record<DemoVenue, () => Snapshot> = {
  concert: () => buildSnapshot(concertVenue()),
  hospital: () => buildSnapshot(hospitalVenue()),
};
const cache = new Map<DemoVenue, Snapshot>();
const snapshotOf = (venue: DemoVenue) => {
  let snapshot = cache.get(venue);
  if (!snapshot) {
    snapshot = SNAPSHOTS[venue]();
    cache.set(venue, snapshot);
  }
  return snapshot;
};

/**
 * Peta demo interaktif di landing page: venue demo konser stadion atau rumah sakit dibangun
 * langsung di browser dari fixture yang sama dengan data demo, digambar map-core dalam 3D,
 * lengkap dengan orang mini.
 */
export default function DemoMap() {
  const [venue, setVenue] = useState<DemoVenue>('concert');
  const [people, setPeople] = useState(true);
  // Satu peta per venue: ganti venue memasang ulang peta beserta lantai dan kameranya.
  return (
    <VenueDemo
      key={venue}
      venue={venue}
      onVenueChange={setVenue}
      people={people}
      onPeopleChange={setPeople}
    />
  );
}

function VenueDemo({
  venue,
  onVenueChange,
  people,
  onPeopleChange,
}: {
  venue: DemoVenue;
  onVenueChange: (venue: DemoVenue) => void;
  people: boolean;
  onPeopleChange: (people: boolean) => void;
}) {
  const { copy } = useLanguage();
  const snapshot = useMemo(() => snapshotOf(venue), [venue]);
  const [floorId, setFloorId] = useState<string | null>(() => initialMapView(snapshot).floorId);
  const [mode, setMode] = useState<'2d' | '3d'>('3d');
  const [map, setMap] = useState<MapInstance | null>(null);
  const [failed, setFailed] = useState(false);
  const [bearing, setBearing] = useState(-24);
  const container = useRef<HTMLDivElement>(null);

  const view = initialMapView(snapshot);
  const floors = useMemo(
    () =>
      view.buildingId
        ? buildingFloors(snapshot, view.buildingId).map((f) => ({ id: f.id, label: f.name }))
        : [],
    [snapshot, view.buildingId],
  );
  const floorIds = useMemo(
    () => (floorId ? visibleFloorIds(snapshot, floorId) : []),
    [snapshot, floorId],
  );
  const route = useDemoRoute({
    map,
    snapshot,
    buildingId: view.buildingId,
    floorIds,
    setFloorId,
  });

  // Peta dibuat ulang per venue agar ikon dan kamera mengikuti venue itu.
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let instance: MapInstance;
    try {
      instance = createMap(element, {
        center: [0, 0],
        zoom: 17,
        bearing: -24,
        mode: '3d',
        labelFont: LABEL_FONT,
      });
    } catch {
      setFailed(true);
      return;
    }
    instance.on('rotate', () => setBearing(instance.getBearing()));
    instance.once('load', () => {
      // Kamera membingkai gedung (bukan parkir dan jalan di Area Luar) agar orang mini terlihat.
      const footprints = snapshot.buildings.flatMap((b) => (b.footprint ? [b.footprint] : []));
      const bounds = featureBounds({
        type: 'FeatureCollection',
        features: footprints.map((geometry) => ({
          type: 'Feature',
          geometry,
          properties: { id: 'footprint', kind: 'corridor', floorId: '' },
        })),
      } as FloorFeatureCollection);
      if (bounds) {
        instance.fitBounds(bounds, { padding: 8, bearing: -24, pitch: PITCH_3D, animate: false });
      }
      void setFacilityIcons(instance, iconSpecs(snapshot));
      setMap(instance);
    });
    return () => {
      setMap(null);
      instance.remove();
    };
  }, [snapshot]);

  useEffect(() => {
    if (!map) return;
    setFloorData(map, floorCollection(snapshot, floorIds));
    setLabels(map, mapLabels(snapshot, floorIds));
    setCrowd(
      map,
      people
        ? {
            graph: snapshot.graph,
            floorIds,
            seed: snapshot.venue.id,
            areas: crowdAreas(snapshot, floorIds),
          }
        : null,
    );
  }, [map, snapshot, floorIds, people]);

  useEffect(() => {
    if (map) setMapLabel(map, copy.demo.canvas);
  }, [map, copy]);

  function changeMode(next: '2d' | '3d') {
    setMode(next);
    if (map) setViewMode(map, next);
  }

  if (failed)
    return <p className="rounded-lg border border-line bg-surface p-6">{copy.demo.failed}</p>;

  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <fieldset
          aria-label={copy.demo.title}
          className="m-0 flex min-w-0 overflow-hidden rounded-sm border border-line bg-surface p-0"
        >
          {(['concert', 'hospital'] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={venue === key}
              onClick={() => onVenueChange(key)}
              className={cn(
                'h-(--control-height) cursor-pointer px-4 font-bold',
                venue === key ? 'bg-ink text-surface' : 'text-ink-muted hover:text-ink',
              )}
            >
              {key === 'concert' ? copy.demo.concert : copy.demo.hospital}
            </button>
          ))}
        </fieldset>
        <button
          type="button"
          aria-pressed={people}
          onClick={() => onPeopleChange(!people)}
          className={cn(
            'flex h-(--control-height) cursor-pointer items-center gap-2 rounded-sm border border-line px-3 font-bold',
            people ? 'bg-ink text-surface' : 'bg-surface text-ink-muted',
          )}
        >
          <UsersRoundIcon aria-hidden="true" className="size-5" strokeWidth={1.75} />
          {copy.demo.people}
        </button>
        <span className="text-ink-muted text-sm">{copy.demo.note}</span>
      </div>
      {route.origin ? (
        <DestinationPicker
          snapshot={snapshot}
          origin={route.origin}
          target={route.target}
          onChange={route.setTarget}
        />
      ) : null}
      <div className="relative h-[460px] overflow-hidden rounded-lg border border-line bg-canvas sm:h-[560px]">
        <div
          ref={container}
          className="h-full w-full"
          data-testid="demo-map"
          data-ready={map ? 'true' : 'false'}
          data-venue={venue}
          data-floor-id={floorId ?? ''}
          data-people={people ? 'on' : 'off'}
          data-route={route.plan ? (route.plan.ok ? 'ok' : 'failed') : 'none'}
        />
        {route.origin && route.target && route.plan ? (
          <RouteCard
            snapshot={snapshot}
            index={route.index}
            origin={route.origin}
            target={route.target}
            plan={route.plan}
            buildingId={view.buildingId}
            floorId={floorId}
            floors={floors}
            onFloor={setFloorId}
            onClose={() => route.setTarget(null)}
          />
        ) : null}
        <div className="pointer-events-none absolute top-3 right-3 bottom-3 flex flex-col items-end justify-between gap-3">
          <div className="pointer-events-auto">
            {floors.length > 1 ? (
              <FloorSwitcher
                floors={floors}
                value={floorId}
                onChange={setFloorId}
                label={copy.demo.floors}
              />
            ) : null}
          </div>
          <MapControls
            className="pointer-events-auto"
            labels={{
              zoomIn: copy.demo.zoomIn,
              zoomOut: copy.demo.zoomOut,
              resetNorth: copy.demo.resetNorth,
              viewMode: copy.demo.title,
              mode2d: copy.demo.mode2d,
              mode3d: copy.demo.mode3d,
            }}
            bearing={bearing}
            mode={mode}
            onModeChange={changeMode}
            onZoomIn={() => map?.zoomIn()}
            onZoomOut={() => map?.zoomOut()}
            onResetNorth={() => map?.easeTo({ bearing: 0 })}
          />
        </div>
      </div>
    </div>
  );
}
