import type { LifecycleRun } from '@indoor/data';
import type { TrialLead, VenueId } from '@indoor/domain';
import { toast } from '@indoor/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../copy';
import { data } from '../data-client';

const keys = {
  leads: ['vendor', 'leads'],
  capacity: ['vendor', 'capacity'],
  blocklist: ['vendor', 'blocklist'],
} as const;

export const useLeads = () =>
  useQuery({ queryKey: keys.leads, queryFn: () => data.vendor.leads(), refetchInterval: 60_000 });

export const useCapacity = () =>
  useQuery({ queryKey: keys.capacity, queryFn: () => data.vendor.capacity() });

export const useBlocklist = () =>
  useQuery({ queryKey: keys.blocklist, queryFn: () => data.vendor.blocklist() });

const failed = (error: unknown) =>
  toast.error(error instanceof Error ? error.message : 'Tindakan gagal. Coba lagi.');

/**
 * Kunci dan hapus hanya memajukan tanggal di database; siklus hidup yang mengerjakan email,
 * penanda Visitor, dan berkas. Bila panggilan seketika gagal, jadwal tiap jam menyelesaikannya.
 */
async function finishWithLifecycle(done: string) {
  let run: LifecycleRun | null = null;
  try {
    run = await data.vendor.runLifecycle();
  } catch {
    run = null;
  }
  if (run && run.failed === 0) toast.success(done);
  else toast.warning(`${done} Sebagian langkah menunggu siklus hidup berikutnya (≤ 1 jam).`);
}

export type TrialAction =
  | { kind: 'extend'; lead: TrialLead; venueId: VenueId; days: number }
  | { kind: 'lock'; lead: TrialLead; venueId: VenueId }
  | { kind: 'delete'; lead: TrialLead; venueId: VenueId };

export function useTrialAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: TrialAction) => {
      const name = action.lead.institution;
      switch (action.kind) {
        case 'extend': {
          const endsAt = await data.vendor.extend(action.venueId, action.days);
          toast.success(`Trial ${name} diperpanjang sampai ${formatDate(endsAt)}.`);
          return;
        }
        case 'lock':
          await data.vendor.lock(action.venueId);
          return finishWithLifecycle(`Trial ${name} dikunci.`);
        case 'delete':
          await data.vendor.remove(action.venueId);
          return finishWithLifecycle(`Ruang kerja ${name} dihapus.`);
      }
    },
    onError: failed,
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.leads }),
  });
}

export function useBlockActions() {
  const queryClient = useQueryClient();
  const onSettled = () => queryClient.invalidateQueries({ queryKey: keys.blocklist });
  const block = useMutation({
    mutationFn: ({ value, note }: { value: string; note: string }) =>
      data.vendor.block(value, note),
    onSuccess: (_kind, { value }) => toast.success(`${value} diblokir.`),
    onError: failed,
    onSettled,
  });
  const unblock = useMutation({
    mutationFn: (value: string) => data.vendor.unblock(value),
    onSuccess: (_result, value) => toast.success(`Blokir ${value} dibuka.`),
    onError: failed,
    onSettled,
  });
  return { block, unblock };
}
