import { describe, expect, it } from 'vitest';
import type { VenueId } from '../src/ids';
import { checkInfoPointInput, infoPointUrl } from '../src/info-point';

describe('checkInfoPointInput', () => {
  it('kode huruf/angka/tanda hubung, nama wajib, idle 15–600 detik', () => {
    expect(checkInfoPointInput({ code: 'IP-LOBI', name: 'Lobi', idleSeconds: 60 })).toEqual([]);
    expect(checkInfoPointInput({ code: 'ip 1', name: ' ', idleSeconds: 14 })).toEqual([
      'code',
      'name',
      'idle',
    ]);
    expect(checkInfoPointInput({ code: 'A', name: 'x', idleSeconds: 600 })).toEqual([]);
    expect(checkInfoPointInput({ code: 'A', name: 'x', idleSeconds: 601 })).toEqual(['idle']);
  });
});

describe('infoPointUrl', () => {
  it('URL publik + /ip/{kode} dengan venue', () => {
    expect(infoPointUrl('https://peta.contoh.id/', 'v-1' as VenueId, 'IP-1')).toBe(
      'https://peta.contoh.id/ip/IP-1?venue=v-1',
    );
  });
});
