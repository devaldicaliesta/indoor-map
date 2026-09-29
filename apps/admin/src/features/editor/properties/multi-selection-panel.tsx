import { Button } from '@indoor/ui';
import { useEditorStore } from '../editor-store';
import { FEATURE_KIND_LABELS } from '../labels';
import type { EditorSession } from '../use-editor-session';
import { RotateControl } from './rotate-control';

/** Seleksi ganda: ringkasan jenis, putar bersama, hapus bersama. Geser dengan menarik di peta. */
export function MultiSelectionPanel({
  session,
  canEdit,
}: {
  session: EditorSession;
  canEdit: boolean;
}) {
  const ids = useEditorStore((s) => s.selectedIds);
  const features = useEditorStore((s) => s.features);
  const counts = new Map<string, number>();
  for (const id of ids) {
    const kind = features[id]?.properties.kind;
    if (kind)
      counts.set(FEATURE_KIND_LABELS[kind], (counts.get(FEATURE_KIND_LABELS[kind]) ?? 0) + 1);
  }
  return (
    <section
      aria-label="Seleksi ganda"
      className="grid min-w-0 content-start gap-4 p-(--panel-padding)"
    >
      <h2 className="font-bold text-lg">{ids.length} fitur dipilih</h2>
      <ul className="grid gap-1 text-sm">
        {[...counts].map(([label, n]) => (
          <li key={label} className="flex justify-between">
            {label}
            <span className="font-mono tabular-nums">{n}</span>
          </li>
        ))}
      </ul>
      {canEdit ? (
        <>
          <p className="text-ink-muted text-sm">
            Tarik salah satu fitur terpilih di peta untuk menggeser semuanya. Shift+klik untuk
            menambah atau mengurangi.
          </p>
          <RotateControl onRotate={(deg) => session.rotateMany(ids, deg)} />
          <Button
            variant="ghost"
            className="justify-self-start text-danger"
            onClick={() => session.removeMany(ids)}
          >
            Hapus {ids.length} fitur
          </Button>
        </>
      ) : null}
    </section>
  );
}
