import type { Building, Point, Polygon } from '@indoor/domain';
import {
  createMap,
  createPolygonDrawer,
  featureBounds,
  type MapInstance,
  type PolygonDrawer,
  setReferenceShapes,
} from '@indoor/map-core';
import { Button } from '@indoor/ui';
import { useEffect, useRef, useState } from 'react';

const FALLBACK_CENTER: [number, number] = [106.8272, -6.1754];

/** Peta kecil untuk menggambar footprint gedung; gedung lain tampil sebagai acuan. */
export function FootprintMap({
  center,
  others,
  value,
  onChange,
}: {
  center: Point | null;
  others: Building[];
  value: Polygon | null;
  onChange: (polygon: Polygon | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const drawer = useRef<PolygonDrawer | null>(null);
  const [ready, setReady] = useState(false);
  const initial = useRef(value);
  const reference = useRef(others);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!container.current) return;
    const map: MapInstance = createMap(container.current, {
      center: (center?.coordinates as [number, number] | undefined) ?? FALLBACK_CENTER,
      zoom: 18,
    });
    map.once('load', () => {
      map.resize();
      const shapes = {
        type: 'FeatureCollection' as const,
        features: reference.current.flatMap((b) =>
          b.footprint
            ? [{ type: 'Feature' as const, geometry: b.footprint, properties: { name: b.name } }]
            : [],
        ),
      };
      setReferenceShapes(map, shapes);
      drawer.current = createPolygonDrawer(map, (polygon) => onChangeRef.current(polygon));
      const start = initial.current;
      if (start) {
        drawer.current.edit(start);
        const bounds = featureBounds({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: start,
              properties: { id: 'fp', kind: 'unit', floorId: 'fp' },
            },
          ],
        });
        if (bounds) map.fitBounds(bounds, { padding: 60, duration: 0 });
      }
      setReady(true);
    });
    return () => {
      drawer.current?.destroy();
      map.remove();
    };
  }, [center]);

  return (
    <div className="grid gap-2">
      <div ref={container} className="h-72 w-full overflow-hidden rounded-sm border border-line" />
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" disabled={!ready} onClick={() => drawer.current?.draw()}>
          {value ? 'Gambar ulang' : 'Gambar footprint'}
        </Button>
        <p className="text-ink-muted text-sm">
          {value
            ? 'Geser titik untuk menyesuaikan, klik garis untuk menambah titik.'
            : 'Klik sudut-sudut gedung, lalu klik titik awal untuk menutup.'}
        </p>
      </div>
    </div>
  );
}
