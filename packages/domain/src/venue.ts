import type { VenueId } from './ids';

/** Ringkasan venue untuk pemilih venue; data lengkap venue ditambah di T-101. */
export interface VenueSummary {
  id: VenueId;
  name: string;
}
