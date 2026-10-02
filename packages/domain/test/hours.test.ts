import { describe, expect, it } from 'vitest';
import { checkOpeningHours, isOpenAt, type OpeningHours } from '../src';

// Senin–Jumat 08.00–16.00, Sabtu 08.00–12.00, Minggu libur; 17 Agustus libur.
const office: OpeningHours = {
  weekly: [
    [{ opens: '08:00', closes: '16:00' }],
    [{ opens: '08:00', closes: '16:00' }],
    [{ opens: '08:00', closes: '16:00' }],
    [{ opens: '08:00', closes: '16:00' }],
    [{ opens: '08:00', closes: '16:00' }],
    [{ opens: '08:00', closes: '12:00' }],
    [],
  ],
  special: { '2026-08-17': [] },
};
// 2026-10-05 adalah Senin. 01.00Z = 08.00 WIB = 10.00 WIT.
const at = (iso: string) => new Date(iso);

describe('isOpenAt', () => {
  it('menurut zona waktu venue, bukan zona perangkat', () => {
    expect(isOpenAt(office, 'Asia/Jakarta', at('2026-10-05T01:00:00Z'))).toEqual({
      open: true,
      closesAt: '16:00',
    });
    expect(isOpenAt(office, 'Asia/Jakarta', at('2026-10-05T00:59:00Z'))).toEqual({
      open: false,
      opensAt: { time: '08:00', daysAhead: 0 },
    });
    // 08.30 WIT = 06.30 WIB: buka di Jayapura, belum buka di Jakarta.
    expect(isOpenAt(office, 'Asia/Jayapura', at('2026-10-04T23:30:00Z')).open).toBe(true);
    expect(isOpenAt(office, 'Asia/Jakarta', at('2026-10-04T23:30:00Z')).open).toBe(false);
  });

  it('tutup sore hari menunjuk pembukaan besok; libur dilompati', () => {
    // Sabtu 13.00 WIB → Minggu libur → Senin 08.00.
    expect(isOpenAt(office, 'Asia/Jakarta', at('2026-10-10T06:00:00Z'))).toEqual({
      open: false,
      opensAt: { time: '08:00', daysAhead: 2 },
    });
  });

  it('tanggal khusus menggantikan jadwal mingguan', () => {
    expect(isOpenAt(office, 'Asia/Jakarta', at('2026-08-17T03:00:00Z')).open).toBe(false);
  });

  it('rentang melewati tengah malam dan buka 24 jam', () => {
    const night: OpeningHours = {
      weekly: Array.from({ length: 7 }, () => [{ opens: '20:00', closes: '02:00' }]),
      special: {},
    };
    // Selasa 01.00 WIB masih bagian rentang Senin 20.00–02.00.
    expect(isOpenAt(night, 'Asia/Jakarta', at('2026-10-05T18:00:00Z'))).toEqual({
      open: true,
      closesAt: '02:00',
    });
    expect(isOpenAt(night, 'Asia/Jakarta', at('2026-10-05T20:00:00Z')).open).toBe(false);
    const always: OpeningHours = {
      weekly: Array.from({ length: 7 }, () => [{ opens: '00:00', closes: '00:00' }]),
      special: {},
    };
    expect(isOpenAt(always, 'Asia/Makassar', at('2026-10-05T16:00:00Z'))).toEqual({
      open: true,
      closesAt: null,
    });
  });

  it('tanpa jadwal sama sekali: tutup tanpa jadwal buka', () => {
    const none: OpeningHours = { weekly: Array.from({ length: 7 }, () => []), special: {} };
    expect(isOpenAt(none, 'Asia/Jakarta', at('2026-10-05T01:00:00Z'))).toEqual({
      open: false,
      opensAt: null,
    });
  });
});

describe('checkOpeningHours', () => {
  it('format jam HH:MM dan rentang sah', () => {
    expect(checkOpeningHours(office)).toEqual([]);
    const bad: OpeningHours = {
      weekly: [[{ opens: '8:00', closes: '16:00' }], [], [], [], [], [], []],
      special: { '2026-13-01': [] },
    };
    expect(checkOpeningHours(bad)).toEqual(['time_format', 'date_format']);
  });
});
