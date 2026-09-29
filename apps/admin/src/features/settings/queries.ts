import type { SystemSettingsPatch } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';

const settingsKey = ['system-settings'] as const;
const passwordKey = ['system-settings', 'smtp-password-set'] as const;

export function useSystemSettings() {
  return useQuery({ queryKey: settingsKey, queryFn: () => data.systemSettings.get() });
}

export function useSmtpPasswordIsSet() {
  return useQuery({
    queryKey: passwordKey,
    queryFn: () => data.systemSettings.smtpPasswordIsSet(),
  });
}

export function useSaveSystemSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ patch, password }: { patch: SystemSettingsPatch; password: string }) => {
      const saved = await data.systemSettings.update(patch);
      if (password) await data.systemSettings.setSmtpPassword(password);
      return saved;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsKey, saved);
      void queryClient.invalidateQueries({ queryKey: passwordKey });
    },
  });
}

export function useSendTestEmail() {
  return useMutation({ mutationFn: () => data.systemSettings.sendTestEmail() });
}
