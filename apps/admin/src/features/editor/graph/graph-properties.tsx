import type { NavNodeRole } from '@indoor/domain';
import { Button } from '@indoor/ui';
import { useEditorStore } from '../store/editor-store';
import type { EditorSession } from '../use-editor-session';
import { NODE_ROLE_LABELS } from './graph-views';

/** Pemilik node berjangkar, untuk menjelaskan mengapa node itu tidak dihapus dari sini. */
const ANCHOR_OWNERS: Partial<Record<NavNodeRole, string>> = {
  origin: 'titik asal QR',
  info_point: 'Info Point',
  connector: 'konektor',
};

const meters = (value: number) =>
  `${value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {rows.map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="text-ink-muted">{term}</dt>
          <dd className="font-mono tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Properti node atau edge graf jalur yang terpilih. */
export function GraphProperties({
  session,
  canEdit,
}: {
  session: EditorSession;
  canEdit: boolean;
}) {
  const selection = useEditorStore((s) => s.graphSelection);
  const graph = useEditorStore((s) => s.graph);
  if (selection?.kind === 'edge') {
    const edge = graph.edges[selection.id];
    if (!edge) return null;
    return (
      <section
        aria-label="Properti edge jalur"
        className="grid min-w-0 content-start gap-4 p-(--panel-padding)"
      >
        <h2 className="font-bold text-lg">Edge jalur</h2>
        <Facts
          rows={[
            ['Panjang', meters(edge.lengthM)],
            ['Aksesibel', edge.accessible ? 'Ya' : 'Tidak'],
          ]}
        />
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => session.graph.splitEdge(edge.id)}>Pisah di tengah</Button>
            <Button
              variant="ghost"
              className="text-danger"
              onClick={() => session.graph.removeEdge(edge.id)}
            >
              Hapus edge
            </Button>
          </div>
        ) : null}
      </section>
    );
  }
  const node = selection ? graph.nodes[selection.id] : undefined;
  if (!node) return null;
  const degree = Object.values(graph.edges).filter(
    (e) => e.from === node.id || e.to === node.id,
  ).length;
  const owner = ANCHOR_OWNERS[node.role];
  return (
    <section
      aria-label="Properti node jalur"
      className="grid min-w-0 content-start gap-4 p-(--panel-padding)"
    >
      <h2 className="font-bold text-lg">{NODE_ROLE_LABELS[node.role]}</h2>
      <Facts
        rows={[
          ['Edge', String(degree)],
          ['Bujur', node.coordinates[0].toFixed(7)],
          ['Lintang', node.coordinates[1].toFixed(7)],
        ]}
      />
      {canEdit ? (
        <>
          <p className="text-ink-muted text-sm">
            Tarik node untuk memindahnya; lepaskan di atas node lain untuk menggabungkan keduanya.
            Node dengan dua edge yang dihapus menyambungkan kedua tetangganya.
          </p>
          {owner ? (
            <p className="text-sm">
              Node ini dipakai {owner}, jadi hanya bisa dihapus dari menunya sendiri.
            </p>
          ) : (
            <Button
              variant="ghost"
              className="justify-self-start text-danger"
              onClick={() => session.graph.removeNode(node.id)}
            >
              Hapus node
            </Button>
          )}
        </>
      ) : null}
    </section>
  );
}
