import { describe, expect, it } from 'vitest';
import {
  buildSnapshot,
  PREVIEW_READY,
  PREVIEW_SNAPSHOT,
  readPreviewMessage,
  withPreviewMode,
} from '../src';
import { sampleSnapshotSource } from './fixtures/snapshot-source';

const snapshot = () => buildSnapshot(sampleSnapshotSource());

describe('readPreviewMessage', () => {
  it('membaca snapshot dari pesan preview yang valid', () => {
    const value = snapshot();
    expect(readPreviewMessage({ type: PREVIEW_SNAPSHOT, snapshot: value })).toEqual(value);
  });

  it('mengabaikan pesan lain, jenis salah, dan snapshot rusak', () => {
    expect(readPreviewMessage(null)).toBeNull();
    expect(readPreviewMessage('halo')).toBeNull();
    expect(readPreviewMessage({ type: PREVIEW_READY })).toBeNull();
    expect(readPreviewMessage({ type: PREVIEW_SNAPSHOT, snapshot: { venue: {} } })).toBeNull();
  });
});

describe('withPreviewMode', () => {
  it('mengganti mode awal tanpa mengubah snapshot asli', () => {
    const value = snapshot();
    const before = value.venue.display.defaultMode;
    const other = before === '3d' ? '2d' : '3d';
    expect(withPreviewMode(value, other).venue.display.defaultMode).toBe(other);
    expect(value.venue.display.defaultMode).toBe(before);
  });
});
