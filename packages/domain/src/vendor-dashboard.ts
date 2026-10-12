// Dasbor vendor trial ter-hosting (T-617): status leads, ringkasan kapasitas, perpanjangan,
// daftar blokir, dan ekspor CSV. Otorisasi dan aturan yang mengikat ada di SQL (migrasi 0053);
// di sini hanya cerminannya untuk tampilan dan validasi di peramban.
import { toCsv } from './csv';
import type { VenueId } from './ids';

export const TRIAL_REQUEST_STATUSES = [
  'unverified',
  'queued',
  'active',
  'locked',
  'deleted',
  'rejected',
] as const;
export type TrialRequestStatus = (typeof TRIAL_REQUEST_STATUSES)[number];

/** Ruang kerja trial yang belum dihapus. */
export interface TrialWorkspace {
  venueId: VenueId;
  slug: string | null;
  startedAt: string;
  endsAt: string;
  lockedAt: string | null;
  extendedDays: number;
  /** Versi 1 dibuat saat provisioning; lebih dari itu berarti pemohon publish sendiri. */
  publishedVersions: number;
  lastPublishedAt: string | null;
}

/** Satu permintaan trial (lead) beserta ruang kerjanya, bila masih ada. */
export interface TrialLead {
  id: string;
  createdAt: string;
  name: string;
  institution: string;
  title: string;
  email: string;
  phone: string;
  buildingType: string;
  buildingSize: string;
  language: string;
  status: TrialRequestStatus;
  rejectReason: 'blocked' | 'duplicate' | null;
  verifiedAt: string | null;
  queuedAt: string | null;
  trial: TrialWorkspace | null;
}

/**
 * Tahap yang ditampilkan. Selain status permintaan: `ending` = masa trial habis tetapi siklus
 * hidup (tiap jam) belum menguncinya; `deleting` = jatuh tempo dihapus, menunggu siklus hidup.
 */
export type LeadStage = TrialRequestStatus | 'ending' | 'deleting';

const DAY_MS = 86_400_000;
/** Sama dengan `hosting_lifecycle_purge`: dihapus 7 hari setelah terkunci. */
const DELETE_AFTER_LOCK_MS = 7 * DAY_MS;

export function leadStage(lead: TrialLead, now: number): LeadStage {
  const { trial } = lead;
  if (!trial || (lead.status !== 'active' && lead.status !== 'locked')) return lead.status;
  if (trial.lockedAt) {
    return Date.parse(trial.lockedAt) + DELETE_AFTER_LOCK_MS <= now ? 'deleting' : 'locked';
  }
  return Date.parse(trial.endsAt) <= now ? 'ending' : 'active';
}

/** Sisa hari trial, dibulatkan ke atas; 0 bila sudah lewat. */
export function trialDaysLeft(endsAt: string, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(endsAt) - now) / DAY_MS));
}

/** Total perpanjangan dari vendor per trial (FR-HT-14), sama dengan `vendor_trial_extend`. */
export const MAX_TRIAL_EXTENSION_DAYS = 17;

/** Hari perpanjangan yang masih boleh diberikan; 0 untuk trial yang terkunci. */
export function extensionDaysLeft(trial: TrialWorkspace): number {
  if (trial.lockedAt) return 0;
  return Math.max(0, MAX_TRIAL_EXTENSION_DAYS - trial.extendedDays);
}

export interface VendorSummary {
  capacity: number;
  /** Slot terpakai: permintaan `active` (termasuk yang sedang dibuatkan ruang kerja). */
  active: number;
  free: number;
  queued: number;
  locked: number;
  unverified: number;
  /** Ruang kerja aktif atau terkunci yang sudah dipublish sendiri oleh pemohonnya. */
  publishedByApplicant: number;
  leads: number;
}

export function summarizeLeads(leads: readonly TrialLead[], capacity: number): VendorSummary {
  const count = (status: TrialRequestStatus) => leads.filter((l) => l.status === status).length;
  const active = count('active');
  return {
    capacity,
    active,
    free: Math.max(0, capacity - active),
    queued: count('queued'),
    locked: count('locked'),
    unverified: count('unverified'),
    publishedByApplicant: leads.filter((l) => (l.trial?.publishedVersions ?? 0) > 1).length,
    leads: leads.length,
  };
}

// ---------------------------------------------------------------------------
// Daftar blokir
// ---------------------------------------------------------------------------

export type BlockKind = 'email' | 'domain';

/** Domain email umum, sama dengan `hosting.public_email_domain` (migrasi 0048). */
export const PUBLIC_EMAIL_DOMAINS: readonly string[] = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.id',
  'ymail.com',
  'rocketmail.com',
  'outlook.com',
  'outlook.co.id',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'mail.com',
  'gmx.com',
  'zoho.com',
  'yandex.com',
];

export type BlockValueCheck =
  | { ok: true; value: string; kind: BlockKind }
  | { ok: false; problem: 'invalid' | 'public_domain' };

const BLOCK_EMAIL = /^[^@\s]+@([a-z0-9-]+\.)+[a-z]{2,}$/;
const BLOCK_DOMAIN = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

/**
 * Isian daftar blokir: alamat email, atau domain kantor. Domain email umum ditolak karena
 * memblokirnya menolak hampir semua pemohon. Aturan yang sama ditegakkan `vendor_block`.
 */
export function parseBlockValue(input: string): BlockValueCheck {
  const value = input.trim().toLowerCase();
  if (BLOCK_EMAIL.test(value)) return { ok: true, value, kind: 'email' };
  if (!BLOCK_DOMAIN.test(value)) return { ok: false, problem: 'invalid' };
  if (PUBLIC_EMAIL_DOMAINS.includes(value)) return { ok: false, problem: 'public_domain' };
  return { ok: true, value, kind: 'domain' };
}

// ---------------------------------------------------------------------------
// Ekspor leads
// ---------------------------------------------------------------------------

/**
 * Isian pemohon dibuka vendor di spreadsheet; sel yang diawali `= + - @` (atau tab/CR) dibaca
 * sebagai rumus, jadi diberi awalan kutip tunggal (rekomendasi OWASP CSV injection).
 */
export function spreadsheetSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export interface LeadsCsvLabels {
  stage: Record<LeadStage, string>;
  buildingType: Record<string, string>;
  buildingSize: Record<string, string>;
}

const LEADS_CSV_HEADER = [
  'Tanggal permintaan',
  'Nama',
  'Instansi',
  'Jabatan',
  'Email',
  'Telepon',
  'Jenis gedung',
  'Luas',
  'Bahasa',
  'Tahap',
  'Slug',
  'Trial mulai',
  'Trial berakhir',
  'Perpanjangan (hari)',
  'Versi terbit',
  'Publish terakhir',
];

/** Leads untuk ditindaklanjuti di spreadsheet; tanggal ISO 8601 agar bisa diurutkan. */
export function leadsCsv(leads: readonly TrialLead[], labels: LeadsCsvLabels, now: number): string {
  const rows = leads.map((lead) => {
    const { trial } = lead;
    return [
      lead.createdAt,
      lead.name,
      lead.institution,
      lead.title,
      lead.email,
      lead.phone,
      labels.buildingType[lead.buildingType] ?? lead.buildingType,
      labels.buildingSize[lead.buildingSize] ?? lead.buildingSize,
      lead.language,
      labels.stage[leadStage(lead, now)],
      trial?.slug ?? '',
      trial?.startedAt ?? '',
      trial?.endsAt ?? '',
      trial ? String(trial.extendedDays) : '',
      trial ? String(trial.publishedVersions) : '',
      trial?.lastPublishedAt ?? '',
    ].map(spreadsheetSafe);
  });
  return toCsv([LEADS_CSV_HEADER, ...rows]);
}
