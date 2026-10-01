import {
  type FloorId,
  NAV_NODE_ROLES,
  type NavEdge,
  type NavGraph,
  type NavNode,
  type NavNodeRole,
  type VenueId,
} from '@indoor/domain';
import type { Tables } from '../database.types';
import { DataError, toDataError } from '../errors';
import { geometryFromColumn, geometryToColumn } from '../geometry';
import { fetchAllPages } from '../pagination';
import type { Db } from '../supabase';

type NodeRow = Pick<Tables<'nav_nodes'>, 'id' | 'floor_id' | 'geom' | 'role' | 'feature_id'>;
type EdgeRow = Pick<
  Tables<'nav_edges'>,
  'id' | 'floor_id' | 'from_node_id' | 'to_node_id' | 'length_m' | 'is_accessible'
>;

/** Perubahan graf yang belum tersimpan, sudah digabung per id (yang terakhir menang). */
export interface NavGraphChanges {
  saveNodes: readonly NavNode[];
  removeNodeIds: readonly string[];
  saveEdges: readonly NavEdge[];
  removeEdgeIds: readonly string[];
}

export interface NavGraphRepository {
  /** Node dan edge draft satu lantai. */
  listByFloor(floorId: FloorId): Promise<NavGraph>;
  /** Node dan edge draft semua lantai venue, termasuk Area Luar. */
  listByVenue(venueId: VenueId): Promise<NavGraph>;
  /**
   * Menyimpan perubahan graf. Urutannya menjaga kunci asing dan pasangan node unik per edge:
   * hapus edge, simpan node, simpan edge, lalu hapus node. Mengirim ulang perubahan yang sama
   * aman (upsert dan hapus berdasarkan id).
   */
  apply(venueId: VenueId, changes: NavGraphChanges): Promise<void>;
}

/** Id per permintaan agar URL filter `in` tetap pendek. */
const CHUNK = 100;

function chunks<T>(items: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) out.push(items.slice(i, i + CHUNK));
  return out;
}

export function mapNodeRow(row: NodeRow): NavNode {
  const geometry = geometryFromColumn(row.geom);
  if (geometry.type !== 'Point') {
    throw new DataError('invalid', { message: 'Node graf harus berupa titik.' });
  }
  return {
    id: row.id,
    floorId: row.floor_id,
    coordinates: geometry.coordinates,
    role: (NAV_NODE_ROLES as readonly string[]).includes(row.role)
      ? (row.role as NavNodeRole)
      : 'path',
    featureId: row.feature_id,
  };
}

export function mapEdgeRow(row: EdgeRow): NavEdge {
  return {
    id: row.id,
    floorId: row.floor_id,
    from: row.from_node_id,
    to: row.to_node_id,
    lengthM: Number(row.length_m),
    accessible: row.is_accessible,
  };
}

export function createNavGraphRepository(db: Db): NavGraphRepository {
  async function remove(table: 'nav_nodes' | 'nav_edges', ids: readonly string[]) {
    for (const part of chunks(ids)) {
      const { error } = await db.from(table).delete().in('id', part);
      if (error) throw toDataError(error);
    }
  }

  async function list(column: 'floor_id' | 'venue_id', value: string): Promise<NavGraph> {
    const [nodes, edges] = await Promise.all([
      fetchAllPages((from, to) =>
        db
          .from('nav_nodes')
          .select('id, floor_id, geom, role, feature_id')
          .eq(column, value)
          .order('id')
          .range(from, to),
      ),
      fetchAllPages((from, to) =>
        db
          .from('nav_edges')
          .select('id, floor_id, from_node_id, to_node_id, length_m, is_accessible')
          .eq(column, value)
          .order('id')
          .range(from, to),
      ),
    ]);
    return {
      nodes: Object.fromEntries(nodes.map((row) => [row.id, mapNodeRow(row)])),
      edges: Object.fromEntries(edges.map((row) => [row.id, mapEdgeRow(row)])),
    };
  }

  return {
    listByFloor: (floorId) => list('floor_id', floorId),
    listByVenue: (venueId) => list('venue_id', venueId),

    async apply(venueId, changes) {
      await remove('nav_edges', changes.removeEdgeIds);
      for (const part of chunks(changes.saveNodes)) {
        const { error } = await db.from('nav_nodes').upsert(
          part.map((node) => ({
            id: node.id,
            venue_id: venueId,
            floor_id: node.floorId,
            geom: geometryToColumn({ type: 'Point', coordinates: node.coordinates }),
            role: node.role,
            feature_id: node.featureId,
          })),
          { onConflict: 'id' },
        );
        if (error) throw toDataError(error);
      }
      for (const part of chunks(changes.saveEdges)) {
        const { error } = await db.from('nav_edges').upsert(
          part.map((edge) => ({
            id: edge.id,
            venue_id: venueId,
            floor_id: edge.floorId,
            from_node_id: edge.from,
            to_node_id: edge.to,
            length_m: edge.lengthM,
            is_accessible: edge.accessible,
          })),
          { onConflict: 'id' },
        );
        if (error) throw toDataError(error);
      }
      await remove('nav_nodes', changes.removeNodeIds);
    },
  };
}
