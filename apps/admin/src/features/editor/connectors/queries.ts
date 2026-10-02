import type { ConnectorInput } from '@indoor/data';
import type { Connector, GraphChange, NavEdge, NavNode, Position, VenueId } from '@indoor/domain';
import { toast } from '@indoor/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../../app/data-client';
import { venueGraphKey } from '../graph/graph-queries';
import { graphSaveQueue } from '../session-helpers';
import { useEditorStore } from '../store/editor-store';

export const connectorsKey = (venueId: VenueId) => ['connectors', venueId] as const;

export function useConnectors(venueId: VenueId) {
  return useQuery({
    queryKey: connectorsKey(venueId),
    queryFn: () => data.connectors.listByVenue(venueId),
  });
}

/**
 * Menyamakan node pemberhentian di lantai yang sedang dibuka dengan server: node lama (beserta
 * edge-nya) dilepas bila lantai ini tidak lagi dilayani, node baru ditambah di `position`.
 */
function syncStop(previousNodeId: string | null, nodeId: string | null, position: Position) {
  const store = useEditorStore.getState();
  const floorId = store.floorId;
  if (!floorId || previousNodeId === nodeId) return;
  const nodes: GraphChange<NavNode>[] = [];
  const edges: GraphChange<NavEdge>[] = [];
  if (previousNodeId) {
    const before = store.graph.nodes[previousNodeId];
    if (before) nodes.push({ id: previousNodeId, before, after: null });
    for (const edge of Object.values(store.graph.edges)) {
      if (edge.from === previousNodeId || edge.to === previousNodeId) {
        edges.push({ id: edge.id, before: edge, after: null });
      }
    }
  }
  if (nodeId) {
    nodes.push({
      id: nodeId,
      before: null,
      after: { id: nodeId, floorId, coordinates: position, role: 'connector', featureId: null },
    });
  }
  store.syncGraph({ nodes, edges });
}

/**
 * Simpan dan hapus konektor. Konektor disimpan langsung ke server (lintas lantai, di luar riwayat
 * undo lantai); antrean graf dikosongkan lebih dulu agar edge yang menuju pemberhentian tidak
 * tertinggal, lalu node pemberhentian di lantai yang sedang dibuka disinkronkan.
 */
export function useConnectorMutations(venueId: VenueId) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    // Pemberhentian di lantai lain berubah di server; graf venue dimuat ulang tanpa ditunggu dialog.
    void queryClient.invalidateQueries({ queryKey: venueGraphKey(venueId) });
    return queryClient.invalidateQueries({ queryKey: connectorsKey(venueId) });
  };
  const stopOn = (stops: readonly { floorId: string; nodeId: string }[]) =>
    stops.find((s) => s.floorId === useEditorStore.getState().floorId)?.nodeId ?? null;

  const save = useMutation({
    mutationFn: async ({
      input,
      previous,
    }: {
      input: ConnectorInput;
      previous: Connector | null;
    }) => {
      await graphSaveQueue().flush();
      const stops = await data.connectors.save(venueId, input);
      syncStop(previous ? stopOn(previous.stops) : null, stopOn(stops), input.position);
      return stops;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (connector: Connector) => {
      await graphSaveQueue().flush();
      await data.connectors.remove(connector.id);
      syncStop(stopOn(connector.stops), null, [0, 0]);
    },
    // Toast di sini, bukan di panel: panel ter-unmount begitu node konektornya hilang.
    onSuccess: (_result, connector) => {
      toast.success('Konektor dihapus', { description: connector.name });
      return invalidate();
    },
  });

  return { save, remove };
}

export function connectorDraftOf(connector: Connector) {
  return {
    kind: connector.kind,
    name: connector.name,
    direction: connector.direction,
    accessible: connector.accessible,
    floorIds: connector.stops.map((s) => s.floorId),
  };
}

/** Semua gedung dan lantai venue (termasuk Area Luar), untuk aturan dan nama pemberhentian. */
export function useVenueFloors(venueId: VenueId) {
  return useQuery({
    queryKey: ['venue-floors', venueId],
    queryFn: async () => {
      const [buildings, outdoor] = await Promise.all([
        data.buildings.list(venueId),
        data.buildings.outdoorLayer(venueId),
      ]);
      const [outdoorFloor, ...lists] = await Promise.all([
        data.floors.get(outdoor.floorId),
        ...buildings.map((b) => data.floors.list(b.id)),
      ]);
      return { buildings, floors: [...lists.flat(), outdoorFloor] };
    },
  });
}
