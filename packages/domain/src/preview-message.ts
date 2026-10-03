import type { Snapshot } from './snapshot';
import { SnapshotSchema } from './snapshot-schema';

/**
 * Pesan `postMessage` antara preview Admin dan Visitor `/preview` di dalam iframe. Visitor
 * memberi tahu siap, lalu Admin mengirim snapshot draft yang dibangun di memori.
 */
export const PREVIEW_READY = 'indoor-map:preview-ready';
export const PREVIEW_SNAPSHOT = 'indoor-map:preview-snapshot';

export interface PreviewSnapshotMessage {
  type: typeof PREVIEW_SNAPSHOT;
  snapshot: Snapshot;
}

/** Snapshot dari pesan preview; `null` untuk pesan lain atau snapshot yang tidak valid. */
export function readPreviewMessage(value: unknown): Snapshot | null {
  if (typeof value !== 'object' || value === null) return null;
  const message = value as { type?: unknown; snapshot?: unknown };
  if (message.type !== PREVIEW_SNAPSHOT) return null;
  const parsed = SnapshotSchema.safeParse(message.snapshot);
  return parsed.success ? parsed.data : null;
}

/** Snapshot preview dengan mode tampilan awal pilihan Admin (2D/3D). */
export function withPreviewMode(
  snapshot: Snapshot,
  mode: Snapshot['venue']['display']['defaultMode'],
): Snapshot {
  return {
    ...snapshot,
    venue: { ...snapshot.venue, display: { ...snapshot.venue.display, defaultMode: mode } },
  };
}
