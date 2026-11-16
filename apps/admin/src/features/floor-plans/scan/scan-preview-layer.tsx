import type { FloorId } from '@indoor/domain';
import { type MapInstance, setScanPreview } from '@indoor/map-core';
import { useEffect } from 'react';
import { useScanStore } from './scan-store';

export function ScanPreviewLayer({ map, floorId }: { map: MapInstance | null; floorId: FloorId }) {
  const resultFloor = useScanStore((s) => s.floorId);
  const candidates = useScanStore((s) => s.candidates);
  const selectedIds = useScanStore((s) => s.selectedIds);

  useEffect(() => {
    if (!map) return;
    setScanPreview(map, resultFloor === floorId ? { candidates, selectedIds } : null);
  }, [map, floorId, resultFloor, candidates, selectedIds]);

  useEffect(
    () => () => {
      if (map?.style) setScanPreview(map, null);
    },
    [map],
  );
  return null;
}
