import type { Floor, FloorId } from '@indoor/domain';
import { type Corners, type MapInstance, setReferenceFloor } from '@indoor/map-core';
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { data } from '../../app/data-client';

const NONE = 'none';

async function loadReference(floorId: FloorId) {
  const [features, plans] = await Promise.all([
    data.features.listByFloor(floorId),
    data.floorPlans.list(floorId),
  ]);
  const active = plans.find((p) => p.isActive && p.corners?.length === 4);
  const imagePath = active ? (active.rasterPath ?? active.sourcePath) : null;
  const [imageUrl] = imagePath ? await data.floorPlans.signedUrls([imagePath]) : [];
  return {
    features,
    plan: active && imageUrl ? { imageUrl, corners: active.corners as unknown as Corners } : null,
  };
}

/**
 * FR-VEN-10: satu lantai lain tampil samar sebagai acuan penyelarasan. Hanya tampilan;
 * tidak disimpan dan tidak bisa diseleksi (layer tanpa event).
 */
export function ReferenceLayer({
  map,
  floorId,
  beforeId,
}: {
  map: MapInstance | null;
  floorId: FloorId | null;
  beforeId?: string;
}) {
  const reference = useQuery({
    queryKey: ['reference-floor', floorId],
    queryFn: () => loadReference(floorId as FloorId),
    enabled: floorId !== null,
    staleTime: 30 * 60 * 1000,
  });
  const value = floorId ? reference.data : null;

  useEffect(() => {
    if (!map) return;
    setReferenceFloor(map, value ?? null, beforeId);
  }, [map, value, beforeId]);

  useEffect(
    () => () => {
      if (map?.style) setReferenceFloor(map, null);
    },
    [map],
  );
  return null;
}

export function ReferenceFloorPicker({
  floors,
  currentFloorId,
  value,
  onChange,
  compact = false,
}: {
  floors: Floor[];
  currentFloorId: FloorId;
  value: FloorId | null;
  onChange: (floorId: FloorId | null) => void;
  /** Untuk bilah atas editor: label hanya untuk pembaca layar, tanpa keterangan. */
  compact?: boolean;
}) {
  const others = floors.filter((f) => f.id !== currentFloorId);
  return (
    <div className="grid gap-1">
      <Label htmlFor="reference-floor" className={compact ? 'sr-only' : undefined}>
        Tampilkan lantai lain
      </Label>
      <Select
        value={value ?? NONE}
        onValueChange={(next) =>
          onChange(next === NONE ? null : (others.find((f) => f.id === next)?.id ?? null))
        }
        disabled={others.length === 0}
      >
        <SelectTrigger id="reference-floor">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{compact ? 'Tanpa lantai acuan' : 'Tidak ada'}</SelectItem>
          {others.map((floor) => (
            <SelectItem key={floor.id} value={floor.id}>
              {compact ? 'Acuan: ' : ''}Lantai {floor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className={compact ? 'sr-only' : 'text-ink-muted text-sm'}>
        Samar dan tidak bisa disunting. Lift, eskalator, dan tangga ditonjolkan untuk menyelaraskan
        posisi.
      </p>
    </div>
  );
}
