import {
  type AppRole,
  type NotificationKind,
  type NotificationPreferences,
  notificationKindsFor,
} from '@indoor/domain';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
  toast,
} from '@indoor/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';
import { FormNotice } from '../auth/auth-layout';
import { NOTIFICATION_LABELS } from './labels';

const preferencesKey = ['notification-preferences'] as const;

/** Email operasional per jenis; peringatan server dan keamanan akun selalu dikirim. */
export function NotificationsDialog({ role, onClose }: { role: AppRole; onClose: () => void }) {
  const queryClient = useQueryClient();
  const preferences = useQuery({
    queryKey: preferencesKey,
    queryFn: () => data.notifications.preferences(),
  });
  const save = useMutation({
    mutationFn: ({ kind, enabled }: { kind: NotificationKind; enabled: boolean }) =>
      data.notifications.setPreference(kind, enabled),
    // Kotak centang langsung berubah; dikembalikan bila server menolak.
    onMutate: async ({ kind, enabled }) => {
      await queryClient.cancelQueries({ queryKey: preferencesKey });
      const previous = queryClient.getQueryData<NotificationPreferences>(preferencesKey);
      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(preferencesKey, {
          ...previous,
          [kind]: enabled,
        });
      }
      return { previous };
    },
    onSuccess: (_, { kind, enabled }) =>
      toast.success(
        `${NOTIFICATION_LABELS[kind].label}: email ${enabled ? 'dinyalakan' : 'dimatikan'}`,
      ),
    onError: (error, _, context) => {
      if (context?.previous) queryClient.setQueryData(preferencesKey, context.previous);
      toast.error('Preferensi tidak disimpan', { description: error.message });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: preferencesKey }),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notifikasi email</DialogTitle>
          <DialogDescription>
            Pilih email yang Anda terima. Email keamanan akun dan peringatan server untuk Super
            Admin selalu dikirim.
          </DialogDescription>
        </DialogHeader>
        {preferences.isPending ? <Skeleton className="h-24" /> : null}
        {preferences.error ? (
          <FormNotice tone="error">{preferences.error.message}</FormNotice>
        ) : null}
        {preferences.data ? (
          <fieldset className="grid gap-3">
            <legend className="sr-only">Jenis email</legend>
            {notificationKindsFor(role).map((kind) => (
              <label key={kind} className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-ink"
                  checked={preferences.data[kind]}
                  onChange={(event) => save.mutate({ kind, enabled: event.target.checked })}
                />
                <span>
                  {NOTIFICATION_LABELS[kind].label}
                  <span className="block text-ink-muted text-sm">
                    {NOTIFICATION_LABELS[kind].hint}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
