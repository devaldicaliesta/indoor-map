import {
  CHANGE_GROUPS,
  type ChangeGroup,
  type ChangeItem,
  changeCount,
  type GroupChanges,
  type SnapshotDiff,
} from '@indoor/domain';
import { Button, StatusDot } from '@indoor/ui';

const count = new Intl.NumberFormat('id-ID');

const GROUP_LABELS: Record<ChangeGroup, string> = {
  features: 'Fitur peta',
  routes: 'Jalur dan konektor',
  locations: 'Lokasi',
  originPoints: 'Titik asal',
};

const KIND_LABELS: Record<keyof GroupChanges, string> = {
  added: 'Ditambah',
  changed: 'Diubah',
  removed: 'Dihapus',
};

function ItemList({ kind, items }: { kind: keyof GroupChanges; items: readonly ChangeItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid gap-1">
      <h4 className="text-ink-muted text-sm">
        {KIND_LABELS[kind]} ({count.format(items.length)})
      </h4>
      <ul className="grid gap-0.5">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span className="min-w-0 truncate">{item.name}</span>
            {item.floorName ? (
              <span className="shrink-0 text-ink-muted text-sm">{item.floorName}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GroupSection({ group, changes }: { group: ChangeGroup; changes: GroupChanges }) {
  const total = changeCount(changes);
  const heading = `${GROUP_LABELS[group]}: ${count.format(total)} perubahan`;
  if (total === 0) {
    return <p className="text-ink-muted">{GROUP_LABELS[group]}: tidak ada perubahan</p>;
  }
  return (
    <details className="border-line border-b pb-2">
      <summary className="cursor-pointer font-bold">{heading}</summary>
      <div className="mt-2 grid gap-3 pl-4">
        <ItemList kind="added" items={changes.added} />
        <ItemList kind="changed" items={changes.changed} />
        <ItemList kind="removed" items={changes.removed} />
      </div>
    </details>
  );
}

/**
 * Fitur, jalur, lokasi, dan titik asal yang ditambah, diubah, atau dihapus di draft sejak versi
 * published. Dihitung server atas permintaan dan tidak disimpan.
 */
export function ChangeSummary({
  changes,
  pending,
  error,
  onLoad,
}: {
  changes: SnapshotDiff | undefined;
  pending: boolean;
  error: string | null;
  onLoad: () => void;
}) {
  const total = changes ? CHANGE_GROUPS.reduce((sum, g) => sum + changeCount(changes[g]), 0) : 0;
  return (
    <section
      aria-labelledby="changes-title"
      className="grid max-w-3xl gap-4 rounded-md border border-line bg-surface p-(--panel-padding)"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="changes-title" className="font-bold">
          Ringkasan perubahan
        </h2>
        <Button onClick={onLoad} disabled={pending}>
          {pending ? 'Menghitung…' : changes ? 'Hitung ulang' : 'Lihat perubahan'}
        </Button>
      </div>
      <div aria-live="polite" className="grid gap-2">
        {error ? <p className="text-danger">{error}</p> : null}
        {!changes && !error ? (
          <p className="text-ink-muted">
            Bandingkan draft dengan versi published sebelum menerbitkan.
          </p>
        ) : null}
        {changes && total === 0 ? (
          <StatusDot tone="ok">Draft sama dengan versi published.</StatusDot>
        ) : null}
        {changes && total > 0
          ? CHANGE_GROUPS.map((group) => (
              <GroupSection key={group} group={group} changes={changes[group]} />
            ))
          : null}
      </div>
    </section>
  );
}
