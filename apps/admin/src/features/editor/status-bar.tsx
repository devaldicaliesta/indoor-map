import type { LngLat } from '@indoor/map-core';
import { Badge } from '@indoor/ui';
import { useEditorStore } from './editor-store';

const count = new Intl.NumberFormat('id-ID');

export function StatusBar({ cursor, canEdit }: { cursor: LngLat | null; canEdit: boolean }) {
  const total = useEditorStore((s) => Object.keys(s.features).length);
  return (
    <footer className="flex items-center gap-4 border-line border-t px-3 py-1 font-mono text-ink-muted text-xs tabular-nums">
      <span>{count.format(total)} fitur</span>
      <span>
        <span className="sr-only">Koordinat kursor </span>
        {cursor ? `${cursor[1].toFixed(6)}, ${cursor[0].toFixed(6)}` : '—'}
      </span>
      {!canEdit ? <Badge>Mode baca</Badge> : null}
    </footer>
  );
}
