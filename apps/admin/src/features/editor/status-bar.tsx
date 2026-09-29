import type { LngLat } from '@indoor/map-core';
import { Badge } from '@indoor/ui';
import { useEditorStore } from './editor-store';

const count = new Intl.NumberFormat('id-ID');

function SnapToggle() {
  const enabled = useEditorStore((s) => s.snapEnabled);
  const setEnabled = useEditorStore((s) => s.setSnapEnabled);
  return (
    <button
      type="button"
      aria-pressed={enabled}
      title="Menempel ke vertex, tepi, dan sudut siku. Tahan Alt untuk mematikan sementara."
      onClick={() => setEnabled(!enabled)}
      className="cursor-pointer rounded-sm px-1.5 py-0.5 hover:bg-canvas aria-pressed:text-ink"
    >
      Snap: {enabled ? 'aktif' : 'mati'}
    </button>
  );
}

export function StatusBar({ cursor, canEdit }: { cursor: LngLat | null; canEdit: boolean }) {
  const total = useEditorStore((s) => Object.keys(s.features).length);
  const selected = useEditorStore((s) => s.selectedIds.length);
  return (
    <footer className="flex items-center gap-4 border-line border-t px-3 py-1 font-mono text-ink-muted text-xs tabular-nums">
      {canEdit ? <SnapToggle /> : null}
      <span>
        {count.format(total)} fitur{selected > 1 ? ` · ${selected} dipilih` : ''}
      </span>
      <span>
        <span className="sr-only">Koordinat kursor </span>
        {cursor ? `${cursor[1].toFixed(6)}, ${cursor[0].toFixed(6)}` : '—'}
      </span>
      {!canEdit ? <Badge>Mode baca</Badge> : null}
    </footer>
  );
}
