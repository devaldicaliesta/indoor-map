// Ringkasan perubahan draft terhadap snapshot aktif. Dimuat Edge Function `publish` (Deno),
// jadi hanya impor tipe berekstensi `.ts` tanpa zod. Diff tidak disimpan; selalu dihitung ulang.
import type { Snapshot } from './snapshot.ts';

export const CHANGE_GROUPS = ['features', 'routes', 'locations', 'originPoints'] as const;
export type ChangeGroup = (typeof CHANGE_GROUPS)[number];

export interface ChangeItem {
  id: string;
  name: string;
  /** Nama lantai tempat item berada; `null` untuk item tanpa lantai (lokasi, konektor). */
  floorName: string | null;
}

export interface GroupChanges {
  added: ChangeItem[];
  changed: ChangeItem[];
  removed: ChangeItem[];
}

export type SnapshotDiff = Record<ChangeGroup, GroupChanges>;

interface Entry {
  item: ChangeItem;
  /** Isi yang dibandingkan; sama persis berarti tidak berubah. */
  body: string;
}

type Diffable = Pick<Snapshot, 'floors' | 'features' | 'graph' | 'locations' | 'originPoints'>;

function entries(snapshot: Diffable): Record<ChangeGroup, Map<string, Entry>> {
  const floorName = new Map(snapshot.floors.map((f) => [f.id, f.name]));
  const onFloor = (id: string) => floorName.get(id) ?? null;
  const index = <T extends { id: string }>(rows: readonly T[], item: (row: T) => ChangeItem) =>
    new Map(rows.map((row) => [row.id, { item: item(row), body: JSON.stringify(row) }]));

  return {
    features: index(snapshot.features.features, (f) => ({
      id: f.id,
      name: f.properties.name ?? f.properties.unitCode ?? f.properties.kind,
      floorName: onFloor(f.properties.floorId),
    })),
    routes: new Map([
      ...index(snapshot.graph.edges, (e) => ({
        id: e.id,
        name: 'Jalur',
        floorName: onFloor(e.floorId),
      })),
      ...index(snapshot.graph.connectors, (c) => ({ id: c.id, name: c.name, floorName: null })),
    ]),
    locations: index(snapshot.locations, (l) => ({ id: l.id, name: l.name, floorName: null })),
    originPoints: index(snapshot.originPoints, (o) => ({
      id: o.id,
      name: o.name,
      floorName: onFloor(o.floorId),
    })),
  };
}

const byName = (a: ChangeItem, b: ChangeItem) => a.name.localeCompare(b.name, 'id');

function compare(prev: Map<string, Entry>, next: Map<string, Entry>): GroupChanges {
  const changes: GroupChanges = { added: [], changed: [], removed: [] };
  for (const [id, entry] of next) {
    const before = prev.get(id);
    if (!before) changes.added.push(entry.item);
    else if (before.body !== entry.body) changes.changed.push(entry.item);
  }
  for (const [id, entry] of prev) if (!next.has(id)) changes.removed.push(entry.item);
  changes.added.sort(byName);
  changes.changed.sort(byName);
  changes.removed.sort(byName);
  return changes;
}

/**
 * Fitur, jalur (edge dan konektor), lokasi, dan titik asal yang ditambah, diubah, atau dihapus
 * dari `prev` ke `next`. `prev` kosong (belum pernah publish) berarti semuanya ditambah.
 */
export function diffSnapshot(prev: Diffable | null, next: Diffable): SnapshotDiff {
  const before = prev ? entries(prev) : null;
  const after = entries(next);
  const diff = {} as SnapshotDiff;
  for (const group of CHANGE_GROUPS) {
    diff[group] = compare(before?.[group] ?? new Map(), after[group]);
  }
  return diff;
}

/** Jumlah semua perubahan dalam satu kelompok. */
export function changeCount(changes: GroupChanges): number {
  return changes.added.length + changes.changed.length + changes.removed.length;
}
