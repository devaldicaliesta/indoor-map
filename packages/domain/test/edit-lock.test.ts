import { describe, expect, it } from 'vitest';
import { EDIT_LOCK_HEARTBEAT_MS, EDIT_LOCK_TTL_MS } from '../src';

describe('kunci edit', () => {
  it('heartbeat jauh lebih sering dari batas lepas 30 menit (sama dengan app.edit_lock_ttl)', () => {
    expect(EDIT_LOCK_TTL_MS).toBe(30 * 60_000);
    expect(EDIT_LOCK_TTL_MS / EDIT_LOCK_HEARTBEAT_MS).toBeGreaterThanOrEqual(10);
  });
});
