import type { AppRole, ProfilePatch, UserId } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { currentProfileKey } from '../../app/auth/current-profile';
import { data } from '../../app/data-client';

const usersKey = ['profiles', 'list'] as const;

export function useUsers() {
  return useQuery({ queryKey: usersKey, queryFn: () => data.profiles.list() });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, patch }: { userId: UserId; patch: ProfilePatch }) =>
      data.profiles.update(userId, patch),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: usersKey });
      await queryClient.invalidateQueries({ queryKey: currentProfileKey });
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; fullName: string; role: AppRole }) =>
      data.users.invite({ ...input, redirectTo: `${window.location.origin}/reset-password` }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey }),
  });
}

export function useExportUserData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: UserId) => data.users.exportData(userId),
    // Export tercatat di log audit.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit'] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: UserId) => data.users.remove(userId),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: usersKey });
      await queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

const mfaUsersKey = ['profiles', 'mfa'] as const;

/** Super Admin: siapa yang sudah memakai 2FA. */
export function useMfaUserIds(enabled: boolean) {
  return useQuery({ queryKey: mfaUsersKey, queryFn: () => data.mfa.enabledUserIds(), enabled });
}

export function useResetUserMfa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: UserId) => data.mfa.resetForUser(userId),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: mfaUsersKey });
      await queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}
