import {
  CONNECTOR_KINDS,
  type Connector,
  type ConnectorDraft,
  type ConnectorKind,
  type ConnectorStop,
  ESCALATOR_DIRECTIONS,
  type EscalatorDirection,
  type Position,
  type VenueId,
} from '@indoor/domain';
import type { Tables } from '../database.types';
import { toDataError } from '../errors';
import { fetchAllPages } from '../pagination';
import type { Db } from '../supabase';

type ConnectorRow = Pick<
  Tables<'connectors'>,
  'id' | 'kind' | 'name' | 'direction' | 'is_accessible'
> & { connector_stops: Pick<Tables<'connector_stops'>, 'floor_id' | 'node_id'>[] | null };

export interface ConnectorInput extends ConnectorDraft {
  id: string;
  /** Posisi node untuk lantai yang baru dilayani; pemberhentian yang sudah ada tidak dipindah. */
  position: Position;
}

export interface ConnectorsRepository {
  /** Semua konektor venue beserta pemberhentiannya. */
  listByVenue(venueId: VenueId): Promise<Connector[]>;
  /**
   * Menyimpan konektor dan pemberhentiannya dalam satu transaksi (`save_connector`); lantai baru
   * mendapat node konektor, lantai yang dilepas kehilangan node pemberhentiannya.
   */
  save(venueId: VenueId, input: ConnectorInput): Promise<ConnectorStop[]>;
  /** Menghapus konektor beserta node pemberhentiannya. */
  remove(id: string): Promise<void>;
}

const isKind = (value: string): value is ConnectorKind =>
  (CONNECTOR_KINDS as readonly string[]).includes(value);
const isDirection = (value: string | null): value is EscalatorDirection =>
  value !== null && (ESCALATOR_DIRECTIONS as readonly string[]).includes(value);

export function mapConnectorRow(row: ConnectorRow): Connector | null {
  if (!isKind(row.kind)) return null;
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    direction: isDirection(row.direction) ? row.direction : null,
    accessible: row.is_accessible,
    stops: (row.connector_stops ?? []).map((s) => ({ floorId: s.floor_id, nodeId: s.node_id })),
  };
}

export function createConnectorsRepository(db: Db): ConnectorsRepository {
  return {
    async listByVenue(venueId) {
      const rows = await fetchAllPages((from, to) =>
        db
          .from('connectors')
          .select('id, kind, name, direction, is_accessible, connector_stops(floor_id, node_id)')
          .eq('venue_id', venueId)
          .order('id')
          .range(from, to),
      );
      return rows.flatMap((row) => mapConnectorRow(row) ?? []);
    },

    async save(venueId, input) {
      const { data, error } = await db.rpc('save_connector', {
        p_id: input.id,
        p_venue_id: venueId,
        p_kind: input.kind,
        p_name: input.name.trim(),
        p_is_accessible: input.accessible,
        p_floor_ids: [...input.floorIds],
        p_lng: input.position[0],
        p_lat: input.position[1],
        ...(input.kind === 'escalator' && input.direction ? { p_direction: input.direction } : {}),
      });
      if (error) throw toDataError(error);
      return (data ?? []).map((s) => ({ floorId: s.floor_id, nodeId: s.node_id }));
    },

    async remove(id) {
      const { error } = await db.rpc('delete_connector', { p_id: id });
      if (error) throw toDataError(error);
    },
  };
}
