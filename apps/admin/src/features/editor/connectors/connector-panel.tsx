import type { Connector, Floor, NavNode, VenueId } from '@indoor/domain';
import { Button } from '@indoor/ui';
import { useState } from 'react';
import { useVenueSelection } from '../../../app/venue-store';
import { useConnectorDialog } from './connector-dialog-store';
import { CONNECTOR_KIND_LABELS } from './connector-form';
import { useConnectorMutations, useConnectors, useVenueFloors } from './queries';

const DIRECTION_LABELS = { up: 'Naik', down: 'Turun', both: 'Dua arah' } as const;

function stopNames(connector: Connector, floors: readonly Floor[]): string {
  return connector.stops
    .flatMap((s) => floors.find((f) => f.id === s.floorId) ?? [])
    .sort((a, b) => Number(a.isOutdoor) - Number(b.isOutdoor) || a.level - b.level)
    .map((f) => f.name)
    .join(', ');
}

function ConnectorDetails({
  venueId,
  connector,
  node,
  canEdit,
}: {
  venueId: VenueId;
  connector: Connector;
  node: NavNode;
  canEdit: boolean;
}) {
  const floors = useVenueFloors(venueId).data?.floors ?? [];
  const openEdit = useConnectorDialog((s) => s.openEdit);
  const { remove } = useConnectorMutations(venueId);
  const [confirming, setConfirming] = useState(false);
  const rows: [string, string][] = [
    ['Jenis', CONNECTOR_KIND_LABELS[connector.kind]],
    ...(connector.direction
      ? ([['Arah', DIRECTION_LABELS[connector.direction]]] as [string, string][])
      : []),
    ['Lantai', stopNames(connector, floors)],
    ['Kursi roda', connector.accessible ? 'Bisa dilalui' : 'Tidak'],
  ];
  return (
    <div className="grid gap-3 border-line border-t pt-3">
      <h3 className="font-bold">{connector.name}</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-ink-muted">{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openEdit(connector, node.coordinates)}>
            Ubah konektor
          </Button>
          {confirming ? (
            <Button
              size="sm"
              variant="danger"
              disabled={remove.isPending}
              onClick={() => remove.mutate(connector, { onSettled: () => setConfirming(false) })}
            >
              Hapus dari semua lantai
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-danger"
              onClick={() => setConfirming(true)}
            >
              Hapus konektor
            </Button>
          )}
        </div>
      ) : null}
      {remove.error ? <p className="text-danger text-sm">{remove.error.message}</p> : null}
    </div>
  );
}

/** Konektor yang memakai node pemberhentian terpilih. */
export function ConnectorPanel({ node, canEdit }: { node: NavNode; canEdit: boolean }) {
  const venueId = useVenueSelection((s) => s.venueId);
  const connectors = useConnectors(venueId as VenueId);
  if (!venueId) return null;
  const connector = connectors.data?.find((c) => c.stops.some((s) => s.nodeId === node.id));
  if (!connector) {
    return connectors.isPending ? (
      <p className="text-ink-muted text-sm">Memuat konektor…</p>
    ) : (
      <p className="text-sm">Node ini belum menjadi pemberhentian konektor mana pun.</p>
    );
  }
  return <ConnectorDetails venueId={venueId} connector={connector} node={node} canEdit={canEdit} />;
}
