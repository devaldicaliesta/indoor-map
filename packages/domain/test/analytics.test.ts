import { describe, expect, it } from 'vitest';
import {
  analyticsCsv,
  analyticsDays,
  analyticsDevice,
  analyticsSource,
  normalizeAnalyticsQuery,
  sanitizeAnalyticsEvents,
  summarizeAnalytics,
} from '../src/analytics';

const ID = '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a0a';
const base = { source: 'direct', sourceRef: null, language: 'id', device: 'mobile' };

describe('sanitizeAnalyticsEvents', () => {
  it('menerima event sah dan menormalkan kata kunci', () => {
    expect(
      sanitizeAnalyticsEvents([
        { ...base, kind: 'visit' },
        { ...base, kind: 'search', query: '  Toilet   LANTAI 2 ', resultCount: 3 },
        { ...base, kind: 'location', targetKind: 'location', targetId: ID },
        {
          ...base,
          source: 'info_point',
          sourceRef: 'IP-LOBI',
          kind: 'route',
          targetKind: 'unit',
          targetId: ID,
          originKind: 'info_point',
          originRef: 'IP-LOBI',
        },
      ]),
    ).toEqual([
      { ...base, kind: 'visit' },
      { ...base, kind: 'search', query: 'toilet lantai 2', resultCount: 3 },
      { ...base, kind: 'location', targetKind: 'location', targetId: ID },
      {
        ...base,
        source: 'info_point',
        sourceRef: 'IP-LOBI',
        kind: 'route',
        targetKind: 'unit',
        targetId: ID,
        originKind: 'info_point',
        originRef: 'IP-LOBI',
      },
    ]);
  });

  it('membuang event tidak sah dan field asing (tanpa IP atau identitas)', () => {
    const [kept] = sanitizeAnalyticsEvents([
      { ...base, kind: 'visit', ip: '10.0.0.1', userAgent: 'x', sessionId: 'abc' },
    ]);
    expect(kept).toEqual({ ...base, kind: 'visit' });
    expect(
      sanitizeAnalyticsEvents([
        { ...base, kind: 'search', query: 'a', resultCount: 1 },
        { ...base, kind: 'search', query: 'toilet', resultCount: -1 },
        { ...base, kind: 'location', targetKind: 'location', targetId: 'bukan-uuid' },
        { ...base, source: 'origin_qr', kind: 'visit' },
        { ...base, sourceRef: 'X', kind: 'visit' },
        { ...base, language: 'fr', kind: 'visit' },
        { ...base, kind: 'hapus' },
        null,
        'visit',
      ]),
    ).toEqual([]);
    expect(sanitizeAnalyticsEvents('bukan larik')).toEqual([]);
  });

  it('paling banyak 50 event per kiriman', () => {
    const many = Array.from({ length: 60 }, () => ({ ...base, kind: 'visit' }));
    expect(sanitizeAnalyticsEvents(many)).toHaveLength(50);
  });
});

describe('normalizeAnalyticsQuery', () => {
  it('huruf kecil, spasi dirapikan, minimal 2 karakter, maksimal 100', () => {
    expect(normalizeAnalyticsQuery('  Radio\tLogi ')).toBe('radio logi');
    expect(normalizeAnalyticsQuery(' a ')).toBeNull();
    expect(normalizeAnalyticsQuery('x'.repeat(150))).toHaveLength(100);
  });
});

describe('analyticsSource dan analyticsDevice', () => {
  it('sumber kunjungan', () => {
    expect(analyticsSource(null, {})).toEqual({ source: 'direct', sourceRef: null });
    expect(analyticsSource({ originCode: 'abc123def456' }, {})).toEqual({
      source: 'origin_qr',
      sourceRef: 'abc123def456',
    });
    expect(analyticsSource({ locationId: ID }, {})).toEqual({ source: 'link', sourceRef: null });
    expect(analyticsSource({ originCode: 'abc123def456' }, { embedded: true }).source).toBe(
      'embed',
    );
    expect(analyticsSource({ infoPointCode: 'IP-1' }, { infoPointCode: 'IP-1' })).toEqual({
      source: 'info_point',
      sourceRef: 'IP-1',
    });
  });

  it('jenis perangkat', () => {
    expect(analyticsDevice({ kiosk: true, width: 1080, coarsePointer: true })).toBe('kiosk');
    expect(analyticsDevice({ kiosk: false, width: 360, coarsePointer: true })).toBe('mobile');
    expect(analyticsDevice({ kiosk: false, width: 800, coarsePointer: true })).toBe('tablet');
    expect(analyticsDevice({ kiosk: false, width: 360, coarsePointer: false })).toBe('desktop');
  });
});

describe('summarizeAnalytics dan analyticsCsv', () => {
  const facts = [
    { day: '2026-11-14', metric: 'kind', key: 'visit', count: 2 },
    { day: '2026-11-16', metric: 'kind', key: 'visit', count: 3 },
    { day: '2026-11-16', metric: 'kind', key: 'search', count: 4 },
    { day: '2026-11-16', metric: 'search', key: 'toilet', count: 3 },
    { day: '2026-11-15', metric: 'search', key: 'toilet', count: 1 },
    { day: '2026-11-15', metric: 'search', key: 'kantin', count: 4 },
    { day: '2026-11-10', metric: 'kind', key: 'visit', count: 99 },
  ];

  it('total, tren per hari, dan peringkat dalam rentang', () => {
    const summary = summarizeAnalytics(facts, '2026-11-14', '2026-11-16');
    expect(summary.totals).toEqual({ visit: 5, search: 4, location: 0, route: 0 });
    expect(summary.trend.map((d) => [d.day, d.visit])).toEqual([
      ['2026-11-14', 2],
      ['2026-11-15', 0],
      ['2026-11-16', 3],
    ]);
    expect(summary.ranked('search')).toEqual([
      { key: 'kantin', count: 4 },
      { key: 'toilet', count: 4 },
    ]);
    expect(summary.ranked('search', 1)).toHaveLength(1);
  });

  it('CSV memuat angka yang sama dan aman untuk spreadsheet', () => {
    const summary = summarizeAnalytics(facts, '2026-11-14', '2026-11-16');
    const csv = analyticsCsv(summary, [
      { title: 'Pencarian teratas', rows: [{ label: '=cmd, "x"', count: 4 }] },
    ]);
    expect(csv).toContain('Tanggal,Kunjungan,Pencarian,Lokasi dibuka,Rute dihitung\r\n');
    expect(csv).toContain('2026-11-16,3,4,0,0\r\n');
    expect(csv).toContain('Total,5,4,0,0\r\n');
    expect(csv).toContain(`"'=cmd, ""x""",4\r\n`);
  });

  it('daftar hari inklusif', () => {
    expect(analyticsDays('2026-02-27', '2026-03-01')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
    ]);
  });
});
