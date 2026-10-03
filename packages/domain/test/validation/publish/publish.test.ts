import { describe, expect, it } from 'vitest';
import {
  hasBlockingFindings,
  type PublishContext,
  type PublishFindingCode,
  type SnapshotSource,
  validateVenue,
  venueToday,
} from '../../../src';
import { sampleSnapshotSource } from '../../fixtures/snapshot-source';
import { at, ID, rect, validSource } from './fixture';

const CONTEXT: PublishContext = { today: '2026-10-03', floorPlans: [] };

function codes(source: SnapshotSource, context: PublishContext = CONTEXT) {
  return validateVenue(source, context).map((f) => `${f.severity}:${f.code}`);
}

function findingOf(source: SnapshotSource, code: PublishFindingCode, context = CONTEXT) {
  const found = validateVenue(source, context).filter((f) => f.code === code);
  expect(found, `temuan ${code}`).toHaveLength(1);
  return found[0] as NonNullable<(typeof found)[0]>;
}

describe('validasi publish: venue bersih', () => {
  it('fixture lolos tanpa temuan', () => {
    expect(codes(validSource())).toEqual([]);
    expect(hasBlockingFindings(validateVenue(validSource(), CONTEXT))).toBe(false);
  });
});

describe('validasi publish: Error', () => {
  it('geometri tidak valid: poligon memotong diri', () => {
    const s = validSource();
    s.features = s.features.map((f, i) =>
      i === 0
        ? {
            ...f,
            geometry: {
              type: 'Polygon',
              coordinates: [[at(0, 0), at(10, 10), at(10, 0), at(0, 10), at(0, 0)]],
            },
          }
        : f,
    );
    const f = findingOf(s, 'polygon_self_intersection');
    expect(f).toMatchObject({
      severity: 'error',
      floorId: ID.gf,
      buildingId: ID.building,
      featureIds: [ID.u1],
    });
  });

  it('unit tumpang tindih', () => {
    const s = validSource();
    s.features = s.features.map((f, i) => (i === 1 ? { ...f, geometry: rect(5, 0, 10, 10) } : f));
    expect(findingOf(s, 'unit_overlap')).toMatchObject({ severity: 'error', floorId: ID.gf });
  });

  it('kode unit ganda dalam satu lantai', () => {
    const s = validSource();
    s.features = s.features.map((f, i) => (i === 1 ? { ...f, unitCode: 'gf-01 ' } : f));
    expect(findingOf(s, 'duplicate_unit_code').featureIds.sort()).toEqual([ID.u1, ID.u2].sort());
  });

  it('unit atau fasilitas tanpa titik masuk', () => {
    const s = validSource();
    s.graph = {
      ...s.graph,
      nodes: s.graph.nodes.filter((n) => n.id !== 'e2' && n.id !== 'e-toilet'),
    };
    s.graph = {
      ...s.graph,
      edges: s.graph.edges.filter((e) => e.to !== 'e2' && e.to !== 'e-toilet'),
    };
    const f = findingOf(s, 'missing_entrance');
    expect(f).toMatchObject({ severity: 'error', floorId: ID.gf });
    expect(f.featureIds.sort()).toEqual([ID.u2, ID.toilet].sort());
  });

  it('lokasi aktif tanpa unit; lokasi segera buka tanpa unit tidak', () => {
    const s = validSource();
    s.locations = [
      { ...s.locations[0], unitIds: [], primaryUnitId: null } as (typeof s.locations)[0],
    ];
    expect(findingOf(s, 'location_without_unit')).toMatchObject({
      severity: 'error',
      locationId: ID.location,
    });
    s.locations = [
      {
        ...s.locations[0],
        status: 'coming_soon',
        openingDate: '2026-12-01',
      } as (typeof s.locations)[0],
    ];
    expect(codes(s)).not.toContain('error:location_without_unit');
  });

  it('jalur tidak terjangkau dari titik asal mana pun', () => {
    const s = validSource();
    // Lift dilepas dari jalur GF: seluruh L1 terputus dari titik asal di GF.
    s.graph = { ...s.graph, edges: s.graph.edges.filter((e) => e.id !== 'p2-c-gf') };
    const f = findingOf(s, 'unreachable');
    expect(f).toMatchObject({ severity: 'error', floorId: ID.l1 });
    expect(f.featureIds).toEqual([ID.u3]);
  });

  it('tanpa titik asal: bagian graf di luar jaringan terbesar dianggap tidak terjangkau', () => {
    const s = validSource();
    s.originPoints = [];
    expect(codes(s)).toEqual([]);
    s.graph = { ...s.graph, edges: s.graph.edges.filter((e) => e.id !== 'p3-e3') };
    expect(findingOf(s, 'unreachable').featureIds).toEqual([ID.u3]);
  });

  it('Info Point yang menempel ke graf ikut menjadi acuan keterjangkauan', () => {
    const s = validSource();
    // L1 terputus dari titik asal di GF, tetapi dijangkau Info Point di L1.
    s.graph = { ...s.graph, edges: s.graph.edges.filter((e) => e.id !== 'p2-c-gf') };
    s.infoPoints = [
      {
        id: 'ip-1',
        code: 'IP1',
        name: 'Info L1',
        floorId: ID.l1,
        coordinates: at(5, -5),
        headingDeg: 0,
        defaultMode: '2d',
        force2d: false,
        defaultLanguage: 'id',
        idleSeconds: 60,
        nodeId: 'p3',
      },
    ] as SnapshotSource['infoPoints'];
    const floors = validateVenue(s, CONTEXT)
      .filter((f) => f.code === 'unreachable')
      .map((f) => f.floorId);
    expect(floors).toEqual([]);
  });

  it('titik asal tidak terhubung graf', () => {
    const s = validSource();
    s.originPoints = [{ ...s.originPoints[0], nodeId: null } as (typeof s.originPoints)[0]];
    expect(findingOf(s, 'origin_not_connected')).toMatchObject({
      severity: 'error',
      floorId: ID.gf,
    });
  });

  it('konektor hanya terhubung di satu sisi', () => {
    const s = validSource();
    s.graph = { ...s.graph, edges: s.graph.edges.filter((e) => e.id !== 'c-l1-p3') };
    const f = findingOf(s, 'connector_one_sided');
    expect(f).toMatchObject({ severity: 'error', floorId: ID.l1, connectorId: ID.lift });
  });

  it('eskalator tanpa dua pemberhentian', () => {
    const s = validSource();
    s.graph = {
      ...s.graph,
      connectors: [
        ...s.graph.connectors,
        {
          id: 'esc',
          kind: 'escalator',
          name: 'Eskalator',
          direction: 'up',
          accessible: false,
          stops: [{ floorId: ID.gf, nodeId: 'p2' }],
        },
      ],
    };
    expect(findingOf(s, 'escalator_stops')).toMatchObject({
      severity: 'error',
      connectorId: 'esc',
    });
  });

  it('Error memblokir publish', () => {
    const s = validSource();
    s.originPoints = [{ ...s.originPoints[0], nodeId: null } as (typeof s.originPoints)[0]];
    expect(hasBlockingFindings(validateVenue(s, CONTEXT))).toBe(true);
  });
});

describe('validasi publish: Peringatan', () => {
  it('lantai tanpa akses lift', () => {
    const s = validSource();
    s.graph = {
      ...s.graph,
      connectors: [
        {
          ...s.graph.connectors[0],
          kind: 'stairs',
          accessible: false,
        } as (typeof s.graph.connectors)[0],
      ],
    };
    const f = findingOf(s, 'floor_without_lift');
    expect(f).toMatchObject({ severity: 'warning', floorId: ID.l1 });
    expect(hasBlockingFindings(validateVenue(s, CONTEXT))).toBe(false);
  });

  it('lokasi dengan field wajib kosong', () => {
    const s = validSource();
    s.locations = [
      { ...s.locations[0], customFields: { telepon: '  ' } } as (typeof s.locations)[0],
    ];
    expect(findingOf(s, 'required_field_empty')).toMatchObject({
      severity: 'warning',
      locationId: ID.location,
    });
  });

  it('template instruksi EN kosong', () => {
    const s = validSource();
    s.instructionTemplates = s.instructionTemplates.map((t) =>
      t.action === 'arrive' ? { ...t, en: ' ' } : t,
    );
    expect(findingOf(s, 'instruction_en_empty').message).toContain('Tiba');
  });

  it('denah belum digeoreferensi', () => {
    const f = findingOf(validSource(), 'plan_not_georeferenced', {
      ...CONTEXT,
      floorPlans: [
        { floorId: ID.gf, georeferenced: true },
        { floorId: ID.l1, georeferenced: false },
      ],
    });
    expect(f).toMatchObject({ severity: 'warning', floorId: ID.l1 });
  });

  it('status segera buka dengan tanggal lewat', () => {
    const s = validSource();
    s.locations = [
      {
        ...s.locations[0],
        status: 'coming_soon',
        openingDate: '2026-10-02',
      } as (typeof s.locations)[0],
    ];
    expect(findingOf(s, 'opening_date_passed')).toMatchObject({
      severity: 'warning',
      locationId: ID.location,
    });
    s.locations = [{ ...s.locations[0], openingDate: '2026-10-03' } as (typeof s.locations)[0]];
    expect(codes(s)).not.toContain('warning:opening_date_passed');
  });
});

describe('validasi publish: venue contoh', () => {
  it('selesai jauh di bawah 5 detik', () => {
    const source = sampleSnapshotSource();
    const start = Date.now();
    validateVenue(source, CONTEXT);
    expect(Date.now() - start).toBeLessThan(5000);
  });
});

describe('tanggal venue', () => {
  it('hari ini menurut zona waktu venue, bukan UTC', () => {
    const now = new Date('2026-10-02T18:30:00Z');
    expect(venueToday(now, 'Asia/Jakarta')).toBe('2026-10-03');
    expect(venueToday(now, 'America/New_York')).toBe('2026-10-02');
  });
});
