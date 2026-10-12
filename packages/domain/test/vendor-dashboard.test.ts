import { describe, expect, it } from 'vitest';
import {
  extensionDaysLeft,
  type LeadStage,
  leadStage,
  leadsCsv,
  parseBlockValue,
  parseCsv,
  spreadsheetSafe,
  summarizeLeads,
  type TrialLead,
  type TrialWorkspace,
  trialDaysLeft,
  VenueIdSchema,
} from '../src';

const NOW = Date.parse('2026-10-12T10:00:00Z');
const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(NOW + offsetDays * DAY).toISOString();

function workspace(overrides: Partial<TrialWorkspace> = {}): TrialWorkspace {
  return {
    venueId: VenueIdSchema.parse('d3000000-0000-4000-8000-0000000000aa'),
    slug: 'rs-uji',
    startedAt: iso(-3),
    endsAt: iso(14),
    lockedAt: null,
    extendedDays: 0,
    publishedVersions: 1,
    lastPublishedAt: iso(-3),
    ...overrides,
  };
}

function lead(overrides: Partial<TrialLead> = {}): TrialLead {
  return {
    id: 'e3000000-0000-4000-8000-0000000000aa',
    createdAt: iso(-3),
    name: 'Rina',
    institution: 'RS Uji',
    title: 'Manajer',
    email: 'rina@rsuji.co.id',
    phone: '+62 812 0000 0000',
    buildingType: 'hospital',
    buildingSize: 'lt5k',
    language: 'id',
    status: 'active',
    rejectReason: null,
    verifiedAt: iso(-3),
    queuedAt: null,
    trial: workspace(),
    ...overrides,
  };
}

describe('leadStage', () => {
  it('status permintaan tanpa ruang kerja apa adanya', () => {
    expect(leadStage(lead({ status: 'queued', trial: null }), NOW)).toBe('queued');
    expect(leadStage(lead({ status: 'rejected', trial: null }), NOW)).toBe('rejected');
    expect(leadStage(lead({ status: 'deleted', trial: null }), NOW)).toBe('deleted');
  });

  it('trial aktif, habis menunggu dikunci, terkunci, dan menunggu dihapus', () => {
    expect(leadStage(lead(), NOW)).toBe('active');
    expect(leadStage(lead({ trial: workspace({ endsAt: iso(-0.01) }) }), NOW)).toBe('ending');
    const locked = workspace({ endsAt: iso(-2), lockedAt: iso(-2) });
    expect(leadStage(lead({ status: 'locked', trial: locked }), NOW)).toBe('locked');
    const due = workspace({ endsAt: iso(-7), lockedAt: iso(-7) });
    expect(leadStage(lead({ status: 'locked', trial: due }), NOW)).toBe('deleting');
  });
});

describe('sisa hari dan perpanjangan', () => {
  it('sisa hari dibulatkan ke atas dan tidak negatif', () => {
    expect(trialDaysLeft(iso(2.2), NOW)).toBe(3);
    expect(trialDaysLeft(iso(-1), NOW)).toBe(0);
  });

  it('total perpanjangan paling lama 17 hari; trial terkunci tidak diperpanjang', () => {
    expect(extensionDaysLeft(workspace())).toBe(17);
    expect(extensionDaysLeft(workspace({ extendedDays: 12 }))).toBe(5);
    expect(extensionDaysLeft(workspace({ extendedDays: 17 }))).toBe(0);
    expect(extensionDaysLeft(workspace({ lockedAt: iso(-1) }))).toBe(0);
  });
});

describe('summarizeLeads', () => {
  it('slot terpakai dihitung dari permintaan aktif, sama dengan kapasitas di server', () => {
    const summary = summarizeLeads(
      [
        lead(),
        lead({ trial: workspace({ publishedVersions: 3 }) }),
        lead({ status: 'queued', trial: null }),
        lead({ status: 'locked', trial: workspace({ lockedAt: iso(-1), publishedVersions: 2 }) }),
        lead({ status: 'unverified', trial: null }),
      ],
      15,
    );
    expect(summary).toEqual({
      capacity: 15,
      active: 2,
      free: 13,
      queued: 1,
      locked: 1,
      unverified: 1,
      publishedByApplicant: 2,
      leads: 5,
    });
  });

  it('slot kosong tidak negatif saat kapasitas diturunkan', () => {
    expect(summarizeLeads([lead(), lead()], 1).free).toBe(0);
  });
});

describe('parseBlockValue', () => {
  it('alamat email dan domain kantor, huruf kecil tanpa spasi', () => {
    expect(parseBlockValue('  Spam@Contoh.ID ')).toEqual({
      ok: true,
      value: 'spam@contoh.id',
      kind: 'email',
    });
    expect(parseBlockValue('pesaing.co.id')).toEqual({
      ok: true,
      value: 'pesaing.co.id',
      kind: 'domain',
    });
  });

  it('domain email umum dan isian lain ditolak', () => {
    expect(parseBlockValue('gmail.com')).toEqual({ ok: false, problem: 'public_domain' });
    expect(parseBlockValue('bukan domain')).toEqual({ ok: false, problem: 'invalid' });
    expect(parseBlockValue('-awal.com')).toEqual({ ok: false, problem: 'invalid' });
    expect(parseBlockValue('')).toEqual({ ok: false, problem: 'invalid' });
  });
});

describe('ekspor leads', () => {
  const labels = {
    stage: {
      unverified: 'Belum verifikasi',
      queued: 'Antre',
      active: 'Aktif',
      ending: 'Berakhir',
      locked: 'Terkunci',
      deleting: 'Menunggu dihapus',
      deleted: 'Dihapus',
      rejected: 'Ditolak',
    } satisfies Record<LeadStage, string>,
    buildingType: { hospital: 'Rumah sakit' },
    buildingSize: { lt5k: 'Di bawah 5.000 m²' },
  };

  it('sel yang dibaca spreadsheet sebagai rumus diberi awalan kutip', () => {
    expect(spreadsheetSafe('=HYPERLINK("http://x")')).toBe(`'=HYPERLINK("http://x")`);
    expect(spreadsheetSafe('+62 812')).toBe("'+62 812");
    expect(spreadsheetSafe('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(spreadsheetSafe('-1')).toBe("'-1");
    expect(spreadsheetSafe('RS Uji')).toBe('RS Uji');
  });

  it('satu baris per lead dengan label, ruang kerja kosong untuk antrean', () => {
    const csv = leadsCsv(
      [lead({ institution: '=cmd|"/c calc"!A1' }), lead({ status: 'queued', trial: null })],
      labels,
      NOW,
    );
    const [header, active, queued] = parseCsv(csv);
    expect(header?.[0]).toBe('Tanggal permintaan');
    expect(active?.slice(1, 10)).toEqual([
      'Rina',
      `'=cmd|"/c calc"!A1`,
      'Manajer',
      'rina@rsuji.co.id',
      "'+62 812 0000 0000",
      'Rumah sakit',
      'Di bawah 5.000 m²',
      'id',
      'Aktif',
    ]);
    expect(active?.slice(10)).toEqual(['rs-uji', iso(-3), iso(14), '0', '1', iso(-3)]);
    expect(queued?.slice(9)).toEqual(['Antre', '', '', '', '', '', '']);
  });
});
