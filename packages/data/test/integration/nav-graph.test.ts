import { randomUUID } from 'node:crypto';
import {
  addPath,
  applyGraphPatch,
  type FloorId,
  type GraphPatch,
  type NavGraph,
  splitEdge,
} from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';
import type { NavGraphChanges } from '../../src/repositories/nav-graph';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

/** Patch domain menjadi perubahan yang disimpan repository. */
function changesOf(patch: GraphPatch): NavGraphChanges {
  return {
    saveNodes: patch.nodes.flatMap((c) => (c.after ? [c.after] : [])),
    removeNodeIds: patch.nodes.flatMap((c) => (c.after ? [] : [c.id])),
    saveEdges: patch.edges.flatMap((c) => (c.after ? [c.after] : [])),
    removeEdgeIds: patch.edges.flatMap((c) => (c.after ? [] : [c.id])),
  };
}

describe.runIf(url && anonKey && serviceKey)('graf jalur draft (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '';

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor' | 'viewer') {
    const email = `${role}-${suffix}-${userIds.length}@nav-graph.test`;
    const created = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    const id = created.data.user?.id ?? '';
    userIds.push(id);
    await service.from('profiles').insert({ user_id: id, full_name: role, email, role });
    const db = newDb(anonKey);
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    return createRepositories(db);
  }

  it('editor menyimpan, memecah, dan menghapus jalur; viewer dan anon tidak bisa menulis', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `Graf ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    const building = await admin.buildings.create(venue.id, {
      name: 'G',
      code: 'G',
      footprint: null,
    });
    const ground = await admin.floors.create(building.id, { name: 'GF', level: 0, heightM: 4 });
    const upper = await admin.floors.create(building.id, { name: 'L1', level: 1, heightM: 4 });
    const floorId: FloorId = ground.id;

    const editor = await signIn('editor');
    const empty: NavGraph = { nodes: {}, edges: {} };
    // Dua garis bersilangan: node dan edge baru disimpan dalam satu kiriman.
    const first = addPath(
      empty,
      [
        [106.8271, -6.1753],
        [106.8275, -6.1753],
      ],
      { floorId, newId: randomUUID },
    );
    let graph = applyGraphPatch(empty, first);
    const second = addPath(
      graph,
      [
        [106.8273, -6.1751],
        [106.8273, -6.1755],
      ],
      { floorId, newId: randomUUID },
    );
    graph = applyGraphPatch(graph, second);
    await editor.navGraph.apply(venue.id, changesOf(first));
    await editor.navGraph.apply(venue.id, changesOf(second));
    expect(await editor.navGraph.listByFloor(floorId)).toEqual(graph);
    expect(Object.keys(graph.nodes)).toHaveLength(5);
    expect(Object.keys(graph.edges)).toHaveLength(4);

    // Memecah edge lalu mengirim ulang kiriman yang sama tetap menghasilkan graf yang sama.
    const [anyEdge] = Object.keys(graph.edges);
    const split = splitEdge(graph, anyEdge ?? '', null, randomUUID);
    expect(split).not.toBeNull();
    if (!split) return;
    graph = applyGraphPatch(graph, split);
    await editor.navGraph.apply(venue.id, changesOf(split));
    await editor.navGraph.apply(venue.id, changesOf(split));
    expect(await editor.navGraph.listByFloor(floorId)).toEqual(graph);

    // Hapus edge lalu buat ulang pasangan yang sama dengan id baru dalam satu kiriman.
    const edge = Object.values(graph.edges)[0];
    if (!edge) return;
    const replacement = { ...edge, id: randomUUID(), from: edge.to, to: edge.from };
    await editor.navGraph.apply(venue.id, {
      saveNodes: [],
      removeNodeIds: [],
      saveEdges: [replacement],
      removeEdgeIds: [edge.id],
    });
    const listed = await editor.navGraph.listByFloor(floorId);
    expect(listed.edges[replacement.id]).toEqual(replacement);
    expect(listed.edges[edge.id]).toBeUndefined();

    // Edge antar-lantai ditolak trigger; itu tugas konektor.
    const [nodeId] = Object.keys(graph.nodes);
    const otherFloorNode = {
      id: randomUUID(),
      floorId: upper.id,
      coordinates: [106.8273, -6.1753] as [number, number],
      role: 'path' as const,
      featureId: null,
    };
    await expect(
      editor.navGraph.apply(venue.id, {
        saveNodes: [otherFloorNode],
        removeNodeIds: [],
        saveEdges: [
          {
            id: randomUUID(),
            floorId,
            from: nodeId ?? '',
            to: otherFloorNode.id,
            lengthM: 0,
            accessible: true,
          },
        ],
        removeEdgeIds: [],
      }),
    ).rejects.toMatchObject({ kind: 'invalid' });

    const viewer = await signIn('viewer');
    expect(Object.keys((await viewer.navGraph.listByFloor(floorId)).edges)).toHaveLength(5);
    await expect(
      viewer.navGraph.apply(venue.id, {
        saveNodes: [{ ...otherFloorNode, id: randomUUID() }],
        removeNodeIds: [],
        saveEdges: [],
        removeEdgeIds: [],
      }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    const anon = createRepositories(newDb(anonKey));
    expect(await anon.navGraph.listByFloor(floorId)).toEqual({ nodes: {}, edges: {} });

    // Menghapus node ikut menghapus edge-nya (cascade) tanpa galat.
    await editor.navGraph.apply(venue.id, {
      saveNodes: [],
      removeNodeIds: Object.keys(graph.nodes),
      saveEdges: [],
      removeEdgeIds: [],
    });
    expect(await editor.navGraph.listByFloor(floorId)).toEqual({ nodes: {}, edges: {} });
  });
});
