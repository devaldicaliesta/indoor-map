import { describe, expect, it } from 'vitest';
import {
  API_UPSERT_MAX,
  checkIntegrationName,
  checkWebhookUrl,
  parseClosureInput,
  parseLocationUpsert,
  WEBHOOK_MAX_ATTEMPTS,
  WEBHOOK_RETRY_DELAYS_S,
} from '../src';

describe('upsert lokasi lewat API', () => {
  it('mengubah jam per hari dan tanggal khusus menjadi baris opening_hours', () => {
    const parsed = parseLocationUpsert({
      locations: [
        {
          code: ' poli-01 ',
          status: 'active',
          categories: ['Umum', 'Umum', ' Anak '],
          hours: {
            weekly: { mon: ['08:00-12:00', '13:00-16:00'], sat: [] },
            special: [
              { date: '2026-12-25', spans: [] },
              { date: '2026-12-31', spans: ['08:00-11:00'] },
            ],
          },
        },
      ],
    });
    expect(parsed).toEqual({
      ok: true,
      value: [
        {
          code: 'POLI-01',
          status: 'active',
          categories: ['Umum', 'Anak'],
          weekly_hours: [
            {
              weekday: 1,
              special_date: null,
              opens_at: '08:00',
              closes_at: '12:00',
              is_closed: false,
            },
            {
              weekday: 1,
              special_date: null,
              opens_at: '13:00',
              closes_at: '16:00',
              is_closed: false,
            },
          ],
          special_hours: [
            {
              weekday: null,
              special_date: '2026-12-25',
              opens_at: null,
              closes_at: null,
              is_closed: true,
            },
            {
              weekday: null,
              special_date: '2026-12-31',
              opens_at: '08:00',
              closes_at: '11:00',
              is_closed: false,
            },
          ],
        },
      ],
    });
  });

  it('rentang lewat tengah malam dan 24 jam diterima seperti di formulir Admin', () => {
    const parsed = parseLocationUpsert({
      locations: [
        { code: 'IGD', hours: { weekly: { mon: ['00:00-00:00'], tue: ['22:00-06:00'] } } },
      ],
    });
    expect(
      parsed.ok && parsed.value[0]?.weekly_hours?.map((h) => [h.opens_at, h.closes_at]),
    ).toEqual([
      ['00:00', '00:00'],
      ['22:00', '06:00'],
    ]);
  });

  it('kolom yang tidak dikirim tidak ikut diubah', () => {
    expect(parseLocationUpsert({ locations: [{ code: 'A1' }] })).toEqual({
      ok: true,
      value: [{ code: 'A1' }],
    });
  });

  it('menolak bentuk yang salah dengan pesan per baris', () => {
    const parsed = parseLocationUpsert({
      locations: [
        { code: '', name: 'x' },
        { code: 'B', status: 'buka', hours: { weekly: { senin: ['08:00-16:00'], mon: ['8-16'] } } },
        { code: 'C', status: 'coming_soon', warna: 'merah' },
        { code: 'b' },
      ],
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.errors).toEqual([
      'locations[0].code wajib diisi.',
      'locations[1].status harus salah satu dari active, coming_soon, inactive_temporary, inactive_permanent.',
      'locations[1].hours.weekly: hari tidak dikenal senin.',
      'locations[1].hours.weekly.mon: "8-16" bukan rentang jam JJ:MM-JJ:MM.',
      'locations[2].openingDate wajib untuk status coming_soon.',
      'locations[2]: kolom tidak dikenal warna.',
    ]);
  });

  it('menolak kode ganda, daftar kosong, dan lebih dari batas', () => {
    const dup = parseLocationUpsert({ locations: [{ code: 'a' }, { code: 'A' }] });
    expect(dup).toEqual({ ok: false, errors: ['Kode A disebut lebih dari sekali.'] });
    expect(parseLocationUpsert({ locations: [] }).ok).toBe(false);
    expect(parseLocationUpsert([]).ok).toBe(false);
    const many = Array.from({ length: API_UPSERT_MAX + 1 }, (_, i) => ({ code: `L${i}` }));
    expect(parseLocationUpsert({ locations: many })).toEqual({
      ok: false,
      errors: [`Paling banyak ${API_UPSERT_MAX} lokasi per permintaan.`],
    });
  });
});

describe('penutupan lewat API', () => {
  it('lokasi atau unit, alasan wajib, waktu ISO berzona', () => {
    expect(
      parseClosureInput({
        locationCode: 'rad-01',
        reason: ' Perawatan ',
        endsAt: '2026-12-01T15:00:00+07:00',
      }),
    ).toEqual({
      ok: true,
      value: {
        location_code: 'RAD-01',
        unit_code: null,
        reason: 'Perawatan',
        starts_at: null,
        ends_at: '2026-12-01T15:00:00+07:00',
      },
    });
    const bad = parseClosureInput({
      locationCode: 'A',
      unitCode: 'U-1',
      startsAt: '2026-12-01 08:00',
      endsAt: '2026-12-01T07:00:00Z',
    });
    expect(bad.ok ? [] : bad.errors).toEqual([
      'Isi salah satu: locationCode atau unitCode.',
      'reason wajib diisi.',
      'startsAt harus waktu ISO 8601 dengan zona, mis. 2026-12-01T08:00:00+07:00.',
    ]);
    const order = parseClosureInput({
      unitCode: 'U-1',
      reason: 'x',
      startsAt: '2026-12-01T08:00:00Z',
      endsAt: '2026-12-01T07:00:00Z',
    });
    expect(order.ok ? [] : order.errors).toEqual(['endsAt harus setelah startsAt.']);
  });
});

describe('isian kunci API dan webhook', () => {
  it('nama dan alamat penerima', () => {
    expect(checkIntegrationName('  ')).toBe('required');
    expect(checkIntegrationName('x'.repeat(81))).toBe('too_long');
    expect(checkIntegrationName('SIMRS')).toBeNull();
    expect(checkWebhookUrl('')).toBe('required');
    expect(checkWebhookUrl('ftp://contoh.id')).toBe('invalid');
    expect(checkWebhookUrl('contoh.id/hook')).toBe('invalid');
    expect(checkWebhookUrl('https://user:pw@contoh.id/hook')).toBe('credentials');
    expect(checkWebhookUrl('https://simrs.rs.id/panduarah')).toBeNull();
    expect(checkWebhookUrl('http://10.0.0.5:8080/hook')).toBeNull();
  });

  it('jadwal coba ulang sama dengan app.webhook_retry_delays()', () => {
    expect(WEBHOOK_RETRY_DELAYS_S).toEqual([60, 300, 1800, 7200, 21600]);
    expect(WEBHOOK_MAX_ATTEMPTS).toBe(6);
  });
});
