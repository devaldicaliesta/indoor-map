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
