import { Button } from '@indoor/ui';
import { useEditorStore } from '../store/editor-store';
import { useEntranceStore } from './entrance-store';

/** Titik masuk unit atau fasilitas di panel properti, dengan tombol sambung manual ke jalur. */
export function EntranceField({ featureId, canEdit }: { featureId: string; canEdit: boolean }) {
  const count = useEditorStore(
    (s) => Object.values(s.graph.nodes).filter((node) => node.featureId === featureId).length,
  );
  const hasPath = useEditorStore((s) => Object.keys(s.graph.edges).length > 0);
  const linking = useEntranceStore((s) => s.linkingId === featureId);
  const startLinking = useEntranceStore((s) => s.startLinking);
  const stopLinking = useEntranceStore((s) => s.stopLinking);
  return (
    <div className="grid gap-1">
      <span className="font-bold text-sm">Titik masuk</span>
      <p className="text-sm">
        {count === 0
          ? 'Belum terhubung ke jalur; rute berakhir di jalur terdekat.'
          : `${count} titik masuk terhubung ke jalur.`}
      </p>
      {canEdit && hasPath ? (
        linking ? (
          <Button size="sm" variant="ghost" className="justify-self-start" onClick={stopLinking}>
            Batal menyambung
          </Button>
        ) : (
          <Button size="sm" className="justify-self-start" onClick={() => startLinking(featureId)}>
            Hubungkan ke jalur
          </Button>
        )
      ) : null}
    </div>
  );
}
