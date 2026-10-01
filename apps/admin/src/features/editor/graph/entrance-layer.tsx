import { type LngLat, type MapInstance, setGraphSuggestions } from '@indoor/map-core';
import { Button } from '@indoor/ui';
import { useEffect } from 'react';
import { useEditorStore } from '../store/editor-store';
import { useEntranceStore } from './entrance-store';

/**
 * Saran titik masuk di peta (garis putus-putus dari titik masuk ke jalur; yang disorot di daftar
 * lebih tebal) dan petunjuk saat menyambung titik masuk manual.
 */
export function EntranceLayer({ map }: { map: MapInstance | null }) {
  const floorId = useEditorStore((s) => s.floorId);
  const review = useEntranceStore((s) => s.review);
  const hovered = useEntranceStore((s) => s.hovered);
  const linkingId = useEntranceStore((s) => s.linkingId);
  const message = useEntranceStore((s) => s.linkingMessage);
  const target = useEditorStore((s) => (linkingId ? s.features[linkingId] : undefined));

  // Saran dan mode sambung milik satu lantai.
  useEffect(() => {
    if (floorId) useEntranceStore.getState().reset();
  }, [floorId]);

  useEffect(() => {
    if (!map) return;
    const suggestions = review?.floorId === floorId ? review.plan.suggestions : [];
    setGraphSuggestions(
      map,
      suggestions.map((s, i) => ({
        from: s.position as LngLat,
        to: s.attach as LngLat,
        active: hovered === i,
      })),
    );
  }, [map, review, hovered, floorId]);

  if (!linkingId) return null;
  const label = target?.properties.unitCode ?? target?.properties.name ?? 'fitur terpilih';
  return (
    <div
      role="status"
      className="absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-md bg-surface px-3 py-2 text-sm shadow-(--shadow-float)"
    >
      <span>
        {message ?? `Klik jalur untuk menyambung titik masuk ${label}.`}{' '}
        <span className="text-ink-muted">Esc untuk batal.</span>
      </span>
      <Button size="sm" variant="ghost" onClick={() => useEntranceStore.getState().stopLinking()}>
        Batal
      </Button>
    </div>
  );
}
