/**
 * Penutupan sementara (tabel `closures`): tepat satu sasaran, yaitu area/fitur, edge jalur, atau
 * konektor. Berlaku sejak `startsAt` sampai sebelum `endsAt` (`null` = sampai diakhiri).
 */
export interface Closure {
  id: string;
  featureId: string | null;
  edgeId: string | null;
  connectorId: string | null;
  reason: string;
  startsAt: string;
  endsAt: string | null;
}

export type ClosureTarget =
  | { kind: 'feature'; id: string }
  | { kind: 'edge'; id: string }
  | { kind: 'connector'; id: string };

export interface ClosureInput {
  target: ClosureTarget;
  reason: string;
  startsAt: string;
  endsAt: string | null;
}

/** `active` = sedang berlaku, `scheduled` = belum mulai, `ended` = sudah berakhir pada `now`. */
export type ClosureStatus = 'active' | 'scheduled' | 'ended';

export function closureStatus(
  closure: Pick<Closure, 'startsAt' | 'endsAt'>,
  now: Date,
): ClosureStatus {
  const at = now.getTime();
  if (closure.endsAt !== null && Date.parse(closure.endsAt) <= at) return 'ended';
  return Date.parse(closure.startsAt) > at ? 'scheduled' : 'active';
}

export function closureTarget(
  closure: Pick<Closure, 'featureId' | 'edgeId' | 'connectorId'>,
): ClosureTarget {
  if (closure.connectorId) return { kind: 'connector', id: closure.connectorId };
  if (closure.edgeId) return { kind: 'edge', id: closure.edgeId };
  return { kind: 'feature', id: closure.featureId ?? '' };
}

export type ClosureInputErrors = Partial<Record<'reason' | 'startsAt' | 'endsAt', string>>;

/** Aturan yang sama dengan constraint tabel `closures`, dengan pesan untuk formulir. */
export function validateClosureInput(
  input: Pick<ClosureInput, 'reason' | 'startsAt' | 'endsAt'>,
): ClosureInputErrors {
  const errors: ClosureInputErrors = {};
  if (!input.reason.trim()) errors.reason = 'Alasan wajib diisi.';
  const starts = Date.parse(input.startsAt);
  if (Number.isNaN(starts)) errors.startsAt = 'Waktu mulai tidak valid.';
  if (input.endsAt !== null) {
    const ends = Date.parse(input.endsAt);
    if (Number.isNaN(ends)) errors.endsAt = 'Waktu selesai tidak valid.';
    else if (!Number.isNaN(starts) && ends <= starts) {
      errors.endsAt = 'Waktu selesai harus setelah waktu mulai.';
    }
  }
  return errors;
}
