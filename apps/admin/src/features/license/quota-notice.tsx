import { isQuotaFull, type QuotaKind, quotaBlockMessage } from '@indoor/domain';
import { useLicenseStatus, useLicenseUsage } from './queries';

/**
 * Pesan saat kuota penuh, atau `null`. Lisensi trial memakai "Batas trial tercapai". Server tetap
 * menolak bila tombol diakali.
 */
export function useQuotaBlock(kind: QuotaKind): string | null {
  const usage = useLicenseUsage().data?.find((u) => u.kind === kind);
  const trial = useLicenseStatus().data?.isTrial ?? false;
  if (!usage || !isQuotaFull(usage)) return null;
  return quotaBlockMessage(usage, trial);
}

export function QuotaNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return <span className="text-ink-muted text-sm">{message}</span>;
}
