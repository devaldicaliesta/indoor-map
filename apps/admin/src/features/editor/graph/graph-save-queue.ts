import type { NavGraphChanges } from '@indoor/data';
import type { NavEdge, NavNode, VenueId } from '@indoor/domain';
import type { SaveStatus } from '../store/save-queue';

type Entry =
  | { venueId: VenueId; kind: 'node'; id: string; value: NavNode | null }
  | { venueId: VenueId; kind: 'edge'; id: string; value: NavEdge | null };

export interface GraphChangesInput {
  nodes: readonly { id: string; value: NavNode | null }[];
  edges: readonly { id: string; value: NavEdge | null }[];
}

export interface GraphSaveQueueOptions {
  run(venueId: VenueId, changes: NavGraphChanges): Promise<void>;
  onStatus(status: SaveStatus, error: Error | null): void;
  delayMs?: number;
}

function toChanges(entries: readonly Entry[]): NavGraphChanges {
  const changes = {
    saveNodes: [] as NavNode[],
    removeNodeIds: [] as string[],
    saveEdges: [] as NavEdge[],
    removeEdgeIds: [] as string[],
  };
  for (const entry of entries) {
    if (entry.kind === 'node') {
      if (entry.value) changes.saveNodes.push(entry.value);
      else changes.removeNodeIds.push(entry.id);
    } else if (entry.value) changes.saveEdges.push(entry.value);
    else changes.removeEdgeIds.push(entry.id);
  }
  return changes;
}

/**
 * Antrean simpan graf jalur. Berbeda dari antrean fitur yang menyimpan per fitur, node dan edge
 * saling merujuk (edge butuh nodenya, pasangan node per edge unik), jadi perubahan dikumpulkan per
 * id (yang terakhir menang) lalu dikirim sekaligus paling lambat `delayMs` setelah perubahan
 * pertama. Hanya satu kiriman berjalan pada satu waktu; repository mengurutkan isinya.
 */
export class GraphSaveQueue {
  private readonly pending = new Map<string, Entry>();
  private readonly failed = new Map<string, Entry>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight = false;
  private lastError: Error | null = null;
  private everSaved = false;
  private waiters: (() => void)[] = [];

  constructor(private readonly options: GraphSaveQueueOptions) {}

  enqueue(venueId: VenueId, input: GraphChangesInput): void {
    for (const { id, value } of input.nodes) this.put({ venueId, kind: 'node', id, value });
    for (const { id, value } of input.edges) this.put({ venueId, kind: 'edge', id, value });
    if (this.pending.size === 0) return;
    this.timer ??= setTimeout(() => this.fire(), this.options.delayMs ?? 800);
    this.emit();
  }

  /** Mengirim ulang kiriman yang gagal ("Gagal, coba lagi"). */
  retry(): void {
    for (const [key, entry] of this.failed)
      if (!this.pending.has(key)) this.pending.set(key, entry);
    this.failed.clear();
    this.lastError = null;
    this.fire();
  }

  /** Kirim semua yang tertunda sekarang dan tunggu sampai selesai (ganti lantai, keluar). */
  flush(): Promise<void> {
    this.fire();
    if (this.isIdle()) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  hasUnsaved(): boolean {
    return !this.isIdle() || this.failed.size > 0;
  }

  private put(entry: Entry) {
    const key = `${entry.kind}:${entry.id}`;
    this.pending.set(key, entry);
    this.failed.delete(key);
  }

  private isIdle() {
    return this.pending.size === 0 && !this.inFlight;
  }

  private fire() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.inFlight || this.pending.size === 0) {
      this.emit();
      return;
    }
    const batch = new Map(this.pending);
    this.pending.clear();
    this.inFlight = true;
    this.emit();
    void this.send([...batch.values()])
      .then(() => {
        this.everSaved = true;
      })
      .catch((error: unknown) => {
        this.lastError = error instanceof Error ? error : new Error(String(error));
        // Perubahan lebih baru yang sudah menunggu menggantikan yang gagal.
        for (const [key, entry] of batch) if (!this.pending.has(key)) this.failed.set(key, entry);
      })
      .finally(() => {
        this.inFlight = false;
        if (this.pending.size > 0) this.fire();
        else this.emit();
        if (this.isIdle()) for (const resolve of this.waiters.splice(0)) resolve();
      });
  }

  private async send(entries: readonly Entry[]) {
    const venues = [...new Set(entries.map((entry) => entry.venueId))];
    for (const venueId of venues) {
      await this.options.run(
        venueId,
        toChanges(entries.filter((entry) => entry.venueId === venueId)),
      );
    }
  }

  private emit() {
    const status: SaveStatus = !this.isIdle()
      ? 'saving'
      : this.failed.size > 0
        ? 'error'
        : this.everSaved
          ? 'saved'
          : 'idle';
    this.options.onStatus(status, status === 'error' ? this.lastError : null);
  }
}
