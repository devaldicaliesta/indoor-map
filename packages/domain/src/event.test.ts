import { describe, expect, it } from 'vitest';
import {
  type EventInput,
  eventLastEndsAt,
  eventOccurrences,
  eventPhase,
  eventTitle,
  nextOccurrence,
  validateEventInput,
} from './event';

const JKT = 'Asia/Jakarta';

const input = (overrides: Partial<EventInput> = {}): EventInput => ({
  kind: 'event',
  status: 'active',
  title: { id: 'Seminar Kesehatan', en: '' },
  summary: { id: '', en: '' },
  description: { id: '', en: '' },
  imagePath: null,
  linkUrl: null,
  startsAt: '2026-11-02T06:00:00+07:00',
  endsAt: '2026-11-02T07:00:00+07:00',
  repeat: 'none',
  repeatUntil: null,
  point: null,
  locationIds: [],
  ...overrides,
});

describe('validateEventInput (TC-EVT-02)', () => {
  it('menerima event wajar', () => {
    expect(validateEventInput(input(), JKT)).toEqual({});
  });

  it('menolak judul ID kosong, selesai ≤ mulai, dan durasi lebih dari 1 tahun', () => {
    expect(validateEventInput(input({ title: { id: '  ', en: 'Seminar' } }), JKT).title).toBe(
      'Judul (Indonesia) wajib diisi.',
    );
    expect(validateEventInput(input({ endsAt: '2026-11-02T06:00:00+07:00' }), JKT).endsAt).toBe(
      'Waktu selesai harus setelah waktu mulai.',
    );
    expect(validateEventInput(input({ endsAt: '2027-11-02T06:00:01+07:00' }), JKT).endsAt).toBe(
      'Durasi event paling lama 1 tahun.',
    );
    expect(validateEventInput(input({ endsAt: '2027-11-02T06:00:00+07:00' }), JKT)).toEqual({});
  });

  it('memeriksa jadwal berulang dan tautan', () => {
    expect(
      validateEventInput(input({ repeat: 'weekly', repeatUntil: '2026-11-01' }), JKT).repeatUntil,
    ).toBe('Ulangi sampai harus pada atau setelah tanggal mulai.');
    expect(
      validateEventInput(input({ repeat: 'daily', repeatUntil: '2027-11-03' }), JKT).repeatUntil,
    ).toBe('Jadwal berulang paling lama 1 tahun.');
    expect(
      validateEventInput(
        input({ repeat: 'daily', repeatUntil: '2026-11-09', endsAt: '2026-11-03T07:00:00+07:00' }),
        JKT,
      ).endsAt,
    ).toBe('Durasi satu kemunculan lebih panjang dari jarak pengulangannya.');
    expect(validateEventInput(input({ linkUrl: 'javascript:alert(1)' }), JKT).linkUrl).toBe(
      'Tautan harus diawali http:// atau https://.',
    );
  });
});

describe('kemunculan berulang (TC-EVT-03)', () => {
  const weekly = input({ repeat: 'weekly', repeatUntil: '2026-11-29' });

  it('mingguan pada jam dinding venue sampai tanggal batas', () => {
    const all = eventOccurrences(weekly, JKT, new Date('2026-01-01'), new Date('2027-01-01'));
    expect(all.map((o) => o.startsAt)).toEqual([
      '2026-11-01T23:00:00.000Z',
      '2026-11-08T23:00:00.000Z',
      '2026-11-15T23:00:00.000Z',
      '2026-11-22T23:00:00.000Z',
    ]);
    expect(eventLastEndsAt(weekly, JKT)).toBe('2026-11-23T00:00:00.000Z');
  });

  it('mengikuti jam dinding saat zona venue berganti waktu musim panas', () => {
    const berlin = input({
      startsAt: '2026-10-20T09:00:00+02:00',
      endsAt: '2026-10-20T10:00:00+02:00',
      repeat: 'weekly',
      repeatUntil: '2026-11-03',
    });
    const all = eventOccurrences(
      berlin,
      'Europe/Berlin',
      new Date('2026-10-01'),
      new Date('2026-12-01'),
    );
    expect(all.map((o) => o.startsAt)).toEqual([
      '2026-10-20T07:00:00.000Z',
      '2026-10-27T08:00:00.000Z',
      '2026-11-03T08:00:00.000Z',
    ]);
  });

  it('fase dan kemunculan berikutnya terhadap waktu sekarang', () => {
    const at = (iso: string) => new Date(iso);
    expect(eventPhase(weekly, JKT, at('2026-11-09T06:30:00+07:00'))).toBe('live');
    expect(nextOccurrence(weekly, JKT, at('2026-11-09T08:00:00+07:00'))?.startsAt).toBe(
      '2026-11-15T23:00:00.000Z',
    );
    expect(eventPhase(weekly, JKT, at('2026-11-09T08:00:00+07:00'))).toBe('upcoming');
    expect(eventPhase(weekly, JKT, at('2026-11-23T07:00:00+07:00'))).toBe('ended');
    expect(eventPhase({ ...weekly, status: 'draft' }, JKT, at('2026-11-09T06:30:00+07:00'))).toBe(
      'draft',
    );
    expect(eventPhase({ ...weekly, status: 'ended' }, JKT, at('2026-11-09T06:30:00+07:00'))).toBe(
      'ended',
    );
  });
});

describe('eventTitle', () => {
  it('memakai judul EN bila ada, selain itu judul ID', () => {
    expect(eventTitle({ title: { id: 'Diskon', en: 'Sale' } }, 'en')).toBe('Sale');
    expect(eventTitle({ title: { id: 'Diskon', en: '' } }, 'en')).toBe('Diskon');
    expect(eventTitle({ title: { id: 'Diskon', en: 'Sale' } }, 'id')).toBe('Diskon');
  });
});
