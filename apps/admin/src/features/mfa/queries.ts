import type { MfaState } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { currentProfileKey } from '../../app/auth/current-profile';
import { data } from '../../app/data-client';

export const mfaKey = ['auth', 'mfa'] as const;
const codesLeftKey = ['auth', 'mfa', 'codes-left'] as const;

export const TOTP_ISSUER = 'PanduArah Admin';

export interface MfaInfo {
  state: MfaState;
  /** Aplikasi autentikator terdaftar, untuk tantangan kode. */
  factorId: string | null;
}

// Pengguna tanpa profil Admin tidak pernah sampai ke sini (RequireAuth), jadi tanpa baris
// dianggap tidak wajib: server tetap menolak datanya.
const NO_PROFILE: MfaState = {
  required: false,
  roleRequired: false,
  hasTotp: false,
  satisfied: true,
};

async function readMfa(): Promise<MfaInfo> {
  const [state, status] = await Promise.all([data.mfa.adminState(), data.mfa.status()]);
  return { state: state ?? NO_PROFILE, factorId: status.factorId };
}

export function useMfa(enabled = true) {
  return useQuery({
    queryKey: mfaKey,
    queryFn: readMfa,
    enabled,
    // Super Admin bisa mewajibkan 2FA untuk role ini kapan saja.
    refetchInterval: 60_000,
  });
}

export function useRefreshMfa() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: mfaKey });
    await queryClient.invalidateQueries({ queryKey: currentProfileKey });
  };
}

/** Pendaftaran dibuat sekali per tampilan; yang ditinggalkan dihapus saat dibuka lagi. */
export function useTotpEnrollment() {
  return useQuery({
    queryKey: ['auth', 'mfa-enroll'],
    queryFn: () => data.mfa.enrollTotp(TOTP_ISSUER),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    retry: false,
  });
}

export function useRecoveryCodesLeft(enabled: boolean) {
  return useQuery({
    queryKey: codesLeftKey,
    queryFn: () => data.mfa.recoveryCodesLeft(),
    enabled,
  });
}

export function useGenerateRecoveryCodes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => data.mfa.generateRecoveryCodes(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: codesLeftKey }),
  });
}
