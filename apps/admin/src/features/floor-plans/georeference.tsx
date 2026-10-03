import { can, type FloorId, FloorIdSchema, type Point, type VenueId } from '@indoor/domain';
import { type Placement, placementCorners } from '@indoor/map-core';
import { Badge, Button, EmptyState, Skeleton, toast } from '@indoor/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useRole } from '../../app/auth/can';
import { data } from '../../app/data-client';
import { ModuleRoute } from '../../app/module-route';
import { ReferenceFloorPicker } from '../editor/reference-layer';
import { useFloors } from '../venues/floors/queries';
import { GeoreferenceMap } from './georeference-map';
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
  const features = useQuery({
    queryKey: ['features', floorId],
    queryFn: () => data.features.listByFloor(floorId),
  });
  return {
    features: features.data,
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

function GeoreferenceScreen({ floorId, canEdit }: { floorId: FloorId; canEdit: boolean }) {
  const ctx = usePlanContext(floorId);
  const state = useGeoreference(ctx.plan, ctx.building, ctx.venueCenter, ctx.ready);
  const save = useSavePlacement(floorId);
  const [referenceFloorId, setReferenceFloorId] = useState<FloorId | null>(null);
  const siblings = useFloors(ctx.floor?.buildingId ?? null);
  const title = `${ctx.building?.name ?? ''} · Lantai ${ctx.floor?.name ?? ''}`;

  function onSave() {
    if (!ctx.plan || !state.placement) return;
    save.mutate(
      { plan: ctx.plan, placement: state.placement, opacity: state.opacity },
      {
        onSuccess: () => {
          state.markSaved();
          toast.success('Posisi denah disimpan', { id: 'georeference-saved' });
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
              features={ctx.features}
              referenceFloorId={referenceFloorId}
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
            <div className="mb-4 border-line border-b pb-4">
              <ReferenceFloorPicker
                floors={siblings.data ?? []}
                currentFloorId={floorId}
                value={referenceFloorId}
                onChange={setReferenceFloorId}
              />
            </div>
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
