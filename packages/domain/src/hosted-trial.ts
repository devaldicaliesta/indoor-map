import type { VenueId } from './ids';

/**
 * Trial ter-hosting milik pengguna (F2-K, `trial_status()` migrasi 0045). Pengguna on-premise
 * dan staf vendor tidak punya; di sana nilainya selalu `null`.
 */
export interface HostedTrialStatus {
  venueId: VenueId;
  endsAt: string;
  locked: boolean;
}

/** Ruang kerja dihapus 7 hari setelah terkunci (§1: terkunci hari 17, dihapus hari 24). */
export const HOSTED_TRIAL_DELETE_AFTER_DAYS = 7;

/** Tanggal ruang kerja trial dihapus, dihitung dari tanggal berakhirnya. */
export function hostedTrialDeleteAt(endsAt: string): string {
  return new Date(Date.parse(endsAt) + HOSTED_TRIAL_DELETE_AFTER_DAYS * 86_400_000).toISOString();
}
