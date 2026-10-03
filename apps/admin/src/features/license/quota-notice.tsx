import { isQuotaFull, QUOTA_LABELS, type QuotaKind } from '@indoor/domain';
import { useLicenseUsage } from './queries';

/** Pesan saat kuota penuh, atau `null`. Server tetap menolak bila tombol diakali. */
export function useQuotaBlock(kind: QuotaKind): string | null {
  const usage = useLicenseUsage().data?.find((u) => u.kind === kind);
  if (!usage || !isQuotaFull(usage)) return null;
  return `Kuota paket tercapai (${QUOTA_LABELS[kind]} ${usage.used}/${usage.quota}).`;
}

export function QuotaNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return <span className="text-ink-muted text-sm">{message}</span>;
}
