import { describe, expect, it } from 'vitest';
import { checkVenueInput, confirmsVenueDeletion, formatLatLng, parseLatLng } from '../src';

describe('parseLatLng', () => {
  it('membaca format salinan Google Maps menjadi Point [lng, lat]', () => {
    expect(parseLatLng('-6.1754, 106.8272')).toEqual({
      type: 'Point',
      coordinates: [106.8272, -6.1754],
    });
    expect(parseLatLng(' -6.1754 106.8272 ')).toEqual({
      type: 'Point',
      coordinates: [106.8272, -6.1754],
    });
  });

  it('menolak teks rusak dan koordinat di luar rentang', () => {
    expect(parseLatLng('Jakarta')).toBeNull();
    expect(parseLatLng('106.8272, -6.1754x')).toBeNull();
    expect(parseLatLng('106.8, 190')).toBeNull();
  });

  it('bolak-balik dengan formatLatLng', () => {
    const point = parseLatLng('-6.175400, 106.827200');
    expect(point && formatLatLng(point)).toBe('-6.175400, 106.827200');
  });
});

describe('checkVenueInput', () => {
  const valid = { name: 'RS Harapan', address: null, center: null, timezone: 'Asia/Jakarta' };

  it('nama wajib dan zona waktu IANA', () => {
    expect(checkVenueInput(valid)).toEqual([]);
    expect(checkVenueInput({ ...valid, name: '  ', timezone: 'WIB' })).toEqual([
      'name_required',
      'invalid_timezone',
    ]);
  });
});

describe('confirmsVenueDeletion', () => {
  it('nama harus diketik ulang persis', () => {
    expect(confirmsVenueDeletion('RS Harapan', 'RS Harapan')).toBe(true);
    expect(confirmsVenueDeletion('rs harapan', 'RS Harapan')).toBe(false);
    expect(confirmsVenueDeletion('', '')).toBe(false);
  });
});
