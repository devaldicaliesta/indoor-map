import { toast } from '@indoor/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../copy';
import { data } from '../data-client';
import { downloadLicense } from './use-licenses';

const keys = {
  requests: ['vendor', 'trial-requests'],
  clients: ['vendor', 'clients'],
  installations: ['vendor', 'installations'],
} as const;

const failed = (error: unknown) =>
  toast.error(error instanceof Error ? error.message : 'Tindakan gagal. Coba lagi.');

export const useTrialRequests = () =>
  useQuery({
    queryKey: keys.requests,
    queryFn: () => data.vendor.trialRequests(),
    refetchInterval: 60_000,
  });

export function useTrialDecisions() {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all(Object.values(keys).map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  const approve = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number; email: string }) =>
      data.vendor.approveTrial(id, days),
    onSuccess: ({ license, emailed }, { email }) => {
      const until = formatDate(license.validUntil);
      if (emailed) {
        toast.success(`Trial ${license.licenseId} terbit sampai ${until} dan dikirim ke ${email}.`);
        return;
      }
      downloadLicense(license);
      toast.warning(
        `Trial ${license.licenseId} terbit sampai ${until}, tetapi email gagal terkirim. Berkas diunduh; kirimkan manual ke ${email}.`,
      );
    },
    onError: failed,
    onSettled: refresh,
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string; email: string }) =>
      data.vendor.rejectTrial(id, reason),
    onSuccess: ({ emailed }, { email }) =>
      emailed
        ? toast.success(`Permintaan ditolak; pemberitahuan dikirim ke ${email}.`)
        : toast.warning(`Permintaan ditolak, tetapi email ke ${email} gagal terkirim.`),
    onError: failed,
    onSettled: refresh,
  });
  return { approve, reject };
}
