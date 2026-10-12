import type { LeadStage, LeadsCsvLabels } from '@indoor/domain';
import type { BuildingSize, BuildingType } from '@indoor/domain/trial-request';

/** Teks tahap lead; nada titik status dipilih agar warna bukan satu-satunya pembeda. */
export const STAGES: Record<
  LeadStage,
  { label: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' }
> = {
  unverified: { label: 'Belum verifikasi', tone: 'neutral' },
  queued: { label: 'Antre', tone: 'warn' },
  active: { label: 'Aktif', tone: 'ok' },
  ending: { label: 'Berakhir, segera dikunci', tone: 'warn' },
  locked: { label: 'Terkunci', tone: 'danger' },
  deleting: { label: 'Segera dihapus', tone: 'danger' },
  deleted: { label: 'Dihapus', tone: 'neutral' },
  rejected: { label: 'Ditolak', tone: 'neutral' },
};

export const REJECT_REASONS: Record<'blocked' | 'duplicate', string> = {
  blocked: 'diblokir',
  duplicate: 'sudah pernah trial',
};

// Sama dengan pilihan form trial di landing (apps/landing/src/trial/copy.ts).
export const BUILDING_TYPES: Record<BuildingType, string> = {
  mall: 'Mal / pusat belanja',
  hospital: 'Rumah sakit',
  campus: 'Kampus / sekolah',
  office: 'Perkantoran',
  airport: 'Bandara / terminal',
  industrial: 'Kawasan industri / pabrik',
  event: 'Event / konser / pameran',
  other: 'Lainnya',
};

export const BUILDING_SIZES: Record<BuildingSize, string> = {
  lt5k: 'Di bawah 5.000 m²',
  '5k-20k': '5.000–20.000 m²',
  '20k-50k': '20.000–50.000 m²',
  gt50k: 'Di atas 50.000 m²',
};

export const CSV_LABELS: LeadsCsvLabels = {
  stage: Object.fromEntries(
    Object.entries(STAGES).map(([stage, { label }]) => [stage, label]),
  ) as Record<LeadStage, string>,
  buildingType: BUILDING_TYPES,
  buildingSize: BUILDING_SIZES,
};

const dateTime = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
});
const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' });

export const formatDateTime = (iso: string) => `${dateTime.format(new Date(iso))} WIB`;
export const formatDate = (iso: string) => date.format(new Date(iso));
