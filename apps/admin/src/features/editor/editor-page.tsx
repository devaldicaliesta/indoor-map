import {
  type Building,
  can,
  type Floor,
  type FloorId,
  FloorIdSchema,
  type Point,
  type VenueId,
} from '@indoor/domain';
import type { LngLat, MapDisplay } from '@indoor/map-core';
import { EmptyState, Skeleton } from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useRole } from '../../app/auth/can';
import { data } from '../../app/data-client';
import { ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { useFloorPlans } from '../floor-plans/queries';
import { useDisplaySettings } from '../settings/display/queries';
import { useBuildings, useOutdoorLayer } from '../venues/buildings/queries';
import { useFloors } from '../venues/floors/queries';
import { ConnectorDialog } from './connectors/connector-dialog';
import { EditorCanvas, type PlanBackground } from './editor-canvas';
import { EditorSidebar } from './editor-sidebar';
import { EditorToolbar } from './editor-toolbar';
import { EditorTopbar, OUTDOOR } from './editor-topbar';
import { KindPicker } from './properties/kind-picker';
import { PropertiesPanel } from './properties/properties-panel';
import { ReferenceFloorPicker } from './reference-layer';
import { StatusBar } from './status-bar';
import { useEditorSession } from './use-editor-session';
import { useEditorShortcuts } from './use-editor-shortcuts';
import { useFloorValidation } from './use-floor-validation';
import { ValidationSummary } from './validation-overlay';

function footprintCenter(building: Building | undefined): LngLat | null {
  const ring = building?.footprint?.coordinates[0];
  if (!ring?.length) return null;
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}

/** Gedung dan lantai terpilih disimpan di URL agar reload kembali ke lantai yang sama. */
function useFloorSelection(venueId: VenueId) {
  const [params, setParams] = useSearchParams();
  const venue = useQuery({ queryKey: ['venue', venueId], queryFn: () => data.venues.get(venueId) });
  const buildings = useBuildings(venueId);
  const outdoor = useOutdoorLayer(venueId);
  const list = buildings.data ?? [];
  const requested = params.get('building');
  const buildingValue =
    requested === OUTDOOR || list.some((b) => b.id === requested)
      ? (requested as string)
      : ((list.find((b) => b.id === venue.data?.defaultBuildingId) ?? list[0])?.id ?? OUTDOOR);
  const building = list.find((b) => b.id === buildingValue);
  const floors = useFloors(building ? building.id : null);
  const outdoorFloor = useQuery({
    queryKey: ['floor', outdoor.data?.floorId],
    queryFn: () => data.floors.get(outdoor.data?.floorId as FloorId),
    enabled: buildingValue === OUTDOOR && Boolean(outdoor.data),
  });

  const floorList = floors.data ?? [];
  const requestedFloor = FloorIdSchema.safeParse(params.get('floor'));
  let floor: Floor | undefined;
  if (buildingValue === OUTDOOR) floor = outdoorFloor.data;
  else {
    floor =
      floorList.find((f) => requestedFloor.success && f.id === requestedFloor.data) ??
      floorList.find((f) => f.id === building?.defaultFloorId) ??
      [...floorList].sort((a, b) => Math.abs(a.level) - Math.abs(b.level))[0];
  }

  return {
    venueCenter: (venue.data?.center ?? null) as Point | null,
    buildings: list,
    outdoorName: outdoor.data?.name ?? 'Area Luar',
    buildingValue,
    building,
    floors: floorList,
    floor,
    loading: buildings.isPending || venue.isPending || (building ? floors.isPending : false),
    setBuilding: (value: string) => setParams({ building: value }),
    setFloor: (id: FloorId) => setParams({ building: buildingValue, floor: id }),
  };
}

function useActivePlan(floorId: FloorId | null): PlanBackground | null {
  const plans = useFloorPlans(floorId);
  const active = floorId
    ? plans.data?.find((p) => p.isActive && p.corners?.length === 4)
    : undefined;
  return active
    ? {
        imageUrl: active.imageUrl,
        corners: active.corners as PlanBackground['corners'],
        opacity: active.opacity,
      }
    : null;
}

function Editor({ venueId, canEdit }: { venueId: VenueId; canEdit: boolean }) {
  const selection = useFloorSelection(venueId);
  const { floor, building } = selection;
  const session = useEditorSession(venueId, floor, building);
  useEditorShortcuts(session, canEdit);
  const plan = useActivePlan(floor?.id ?? null);
  const validation = useFloorValidation(floor?.isOutdoor ? null : (building?.footprint ?? null));
  const displaySettings = useDisplaySettings(venueId).data;
  const display = useMemo<MapDisplay>(
    () => ({ heights: displaySettings?.heights ?? {}, colors: displaySettings?.colors ?? {} }),
    [displaySettings],
  );
  const [referenceFloorId, setReferenceFloorId] = useState<FloorId | null>(null);
  const [cursor, setCursor] = useState<LngLat | null>(null);

  // Lantai acuan hanya berlaku di gedung yang sama.
  useEffect(() => setReferenceFloorId(null), [building?.id]);

  if (selection.loading) return <Skeleton className="m-4 h-96" />;
  if (!floor) {
    return (
      <div className="p-6">
        <EmptyState
          title="Belum ada lantai"
          description="Tambahkan gedung dan lantai di menu Venue sebelum menggambar peta."
        />
      </div>
    );
  }
  const center =
    footprintCenter(building) ?? (selection.venueCenter?.coordinates as LngLat | undefined) ?? null;

  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <EditorTopbar
        buildings={selection.buildings}
        outdoorName={selection.outdoorName}
        buildingValue={selection.buildingValue}
        onBuilding={selection.setBuilding}
        floors={selection.floors}
        floorId={floor.id}
        onFloor={selection.setFloor}
        onRetry={session.retry}
        validation={<ValidationSummary issues={validation.issues} />}
        reference={
          building ? (
            <ReferenceFloorPicker
              compact
              floors={selection.floors}
              currentFloorId={floor.id}
              value={referenceFloorId}
              onChange={setReferenceFloorId}
            />
          ) : null
        }
      />
      <div className="grid min-h-0 grid-cols-[3rem_15rem_1fr_18rem]">
        <aside className="border-line border-r">
          <EditorToolbar canEdit={canEdit} session={session} />
        </aside>
        <aside className="min-h-0 overflow-hidden border-line border-r">
          <EditorSidebar
            floorName={floor.name}
            facilityTypes={session.facilityTypes}
            issues={validation.byFeature}
            session={session}
            canEdit={canEdit}
          />
        </aside>
        <div className="relative min-h-0">
          {session.error ? (
            <div className="p-6">
              <EmptyState title="Fitur tidak bisa dimuat" description={session.error.message} />
            </div>
          ) : (
            <EditorCanvas
              session={session}
              canEdit={canEdit}
              plan={plan}
              center={center}
              referenceFloorId={referenceFloorId}
              facilityTypes={session.facilityTypes}
              issueFeatureIds={validation.featureIds}
              display={display}
              onCursor={setCursor}
            />
          )}
          {canEdit ? (
            <KindPicker isOutdoor={session.isOutdoor} facilityTypes={session.facilityTypes} />
          ) : null}
        </div>
        <aside aria-label="Properti" className="min-h-0 overflow-y-auto border-line border-l">
          <PropertiesPanel
            session={session}
            canEdit={canEdit}
            issues={validation.byFeature}
            display={display}
          />
        </aside>
      </div>
      <StatusBar cursor={cursor} canEdit={canEdit} />
      {canEdit ? <ConnectorDialog venueId={venueId} floor={floor} /> : null}
    </div>
  );
}

export function EditorPage() {
  const { venue } = useSelectedVenue();
  const role = useRole();
  return (
    <ModuleRoute module="map_editor">
      {() =>
        venue ? (
          <Editor
            key={venue.id}
            venueId={venue.id}
            canEdit={role !== null && can(role, 'map.edit')}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              title="Belum ada venue"
              description="Buat venue lebih dulu di menu Venue."
            />
          </div>
        )
      }
    </ModuleRoute>
  );
}
