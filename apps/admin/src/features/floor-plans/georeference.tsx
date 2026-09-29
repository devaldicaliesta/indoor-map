import { can, type FloorId, FloorIdSchema, type Point, type VenueId } from '@indoor/domain';
import {
  createGeoreferencer,
  createMap,
  featureBounds,
  type Georeferencer,
  type MapInstance,
  type Placement,
  placementCorners,
  setReferenceShapes,
} from '@indoor/map-core';
import { Badge, Button, EmptyState, Skeleton, toast } from '@indoor/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useRole } from '../../app/auth/can';
import { data } from '../../app/data-client';
import { ModuleRoute } from '../../app/module-route';
import { GeoreferencePanel } from './georeference-panel';
import { type FloorPlanVersion, useFloorPlans } from './queries';
import { useGeoreference } from './use-georeference';

function usePlanContext(floorId: FloorId) {
  const floor = useQuery({ queryKey: ['floor', floorId], queryFn: () => data.floors.get(floorId) });
  const venueId = floor.data?.venueId;
  const buildings = useQuery({
    queryKey: ['buildings', venueId],
    queryFn: () => data.buildings.list(venueId as VenueId),
    enabled: Boolean(venueId),
  });
  const venue = useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => data.venues.get(venueId as VenueId),
    enabled: Boolean(venueId),
  });
  const plans = useFloorPlans(floorId);
  return {
    floor: floor.data,
    building: buildings.data?.find((b) => b.id === floor.data?.buildingId),
    venueCenter: (venue.data?.center ?? null) as Point | null,
    plan: plans.data?.find((p) => p.isActive),
    ready: Boolean(floor.data && buildings.data && venue.data && plans.data),
    error: floor.error ?? plans.error,
  };
}

function useSavePlacement(floorId: FloorId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      plan,
      placement,
      opacity,
    }: {
      plan: FloorPlanVersion;
      placement: Placement;
      opacity: number;
    }) => data.floorPlans.savePlacement(plan.id, { corners: placementCorners(placement), opacity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['floor-plans', floorId] }),
  });
}

function GeoreferenceMap({
  plan,
  footprint,
  editable,
  state,
}: {
  plan: FloorPlanVersion;
  footprint: GeoJSON.Polygon | null;
  editable: boolean;
  state: ReturnType<typeof useGeoreference>;
}) {
  const container = useRef<HTMLDivElement>(null);
  const georef = useRef<Georeferencer | null>(null);
  const [map, setMap] = useState<MapInstance | null>(null);
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

  return <div ref={container} className="size-full" data-testid="georef-map" />;
}

function GeoreferenceScreen({ floorId, canEdit }: { floorId: FloorId; canEdit: boolean }) {
  const ctx = usePlanContext(floorId);
  const state = useGeoreference(ctx.plan, ctx.building, ctx.venueCenter, ctx.ready);
  const save = useSavePlacement(floorId);
  const title = `${ctx.building?.name ?? ''} · Lantai ${ctx.floor?.name ?? ''}`;

  function onSave() {
    if (!ctx.plan || !state.placement) return;
    save.mutate(
      { plan: ctx.plan, placement: state.placement, opacity: state.opacity },
      {
        onSuccess: () => {
          state.markSaved();
          toast.success('Posisi denah disimpan');
        },
        onError: (error) => toast.error('Posisi tidak disimpan', { description: error.message }),
      },
    );
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <header className="flex items-center gap-3 border-line border-b px-4 py-2">
        <Button asChild size="sm" variant="ghost">
          <Link to="/venues">
            <ArrowLeftIcon /> Venue
          </Link>
        </Button>
        <h1 className="font-bold">Tempatkan denah</h1>
        <span className="text-ink-muted">{title}</span>
        {!canEdit ? <Badge>Mode baca</Badge> : null}
        <div className="ml-auto flex items-center gap-3">
          {canEdit ? (
            <span className="text-ink-muted text-sm" aria-live="polite">
              {save.isPending ? 'Menyimpan…' : state.dirty ? 'Belum disimpan' : 'Tersimpan'}
            </span>
          ) : null}
          {canEdit ? (
            <Button
              variant="primary"
              disabled={!state.dirty || save.isPending || !state.placement}
              onClick={onSave}
            >
              Simpan posisi
            </Button>
          ) : null}
        </div>
      </header>
      {ctx.error ? (
        <div className="p-6">
          <EmptyState title="Denah tidak bisa dimuat" description={ctx.error.message} />
        </div>
      ) : ctx.ready && !ctx.plan ? (
        <div className="p-6">
          <EmptyState
            title="Lantai ini belum punya denah"
            description="Unggah denah dari halaman Venue › Lantai › Denah."
          />
        </div>
      ) : !state.placement || !ctx.plan ? (
        <Skeleton className="m-4" />
      ) : (
        <div className="grid min-h-0 grid-cols-[1fr_20rem]">
          <div className="relative min-h-0">
            <GeoreferenceMap
              plan={ctx.plan}
              footprint={ctx.building?.footprint ?? null}
              editable={canEdit}
              state={state}
            />
            {canEdit ? (
              <p className="pointer-events-none absolute bottom-3 left-3 rounded-sm bg-surface px-3 py-1.5 text-sm shadow-(--shadow-float)">
                Tarik sudut kuning untuk mengubah ukuran; tarik denah untuk menggeser.
              </p>
            ) : null}
          </div>
          <aside
            aria-label="Pengaturan denah"
            className="overflow-y-auto border-line border-l p-(--panel-padding)"
          >
            <GeoreferencePanel
              placement={state.placement}
              opacity={state.opacity}
              lockAspect={state.lockAspect}
              measure={state.measure}
              canEdit={canEdit}
              onChange={state.change}
              onOpacity={state.setOpacity}
              onLockAspect={state.setLockAspect}
              onMeasureStart={() => state.setMeasure({ step: 'picking' })}
              onMeasureCancel={() => state.setMeasure({ step: 'idle' })}
              onCalibrate={state.calibrate}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

export function GeoreferencePage() {
  const parsed = FloorIdSchema.safeParse(useParams().floorId);
  const role = useRole();
  return (
    <ModuleRoute module="venues">
      {() =>
        parsed.success ? (
          <GeoreferenceScreen
            floorId={parsed.data}
            canEdit={role !== null && can(role, 'venue.edit')}
          />
        ) : (
          <div className="p-6">
            <EmptyState title="Lantai tidak ditemukan" description="Tautan tidak valid." />
          </div>
        )
      }
    </ModuleRoute>
  );
}
