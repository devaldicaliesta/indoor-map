import type { MfaGateStep } from '@indoor/domain';
import { Button, toast } from '@indoor/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { data } from '../../app/data-client';
import { AuthLayout } from '../auth/auth-layout';
import { RecoveryCodeForm, RecoveryCodesList, TotpCodeForm, TotpEnrollPanel } from './mfa-forms';
import { useGenerateRecoveryCodes, useRefreshMfa } from './queries';

type Screen = 'code' | 'recovery';

/**
 * Layar sesudah password bila sesi belum lolos 2FA. Hanya pengarah: selama belum lolos, server
 * menolak semua data Admin (`app.user_role()` NULL, migrasi 0059).
 */
export function MfaGate({
  step,
  factorId,
  onRecoveryCodes,
}: {
  step: Exclude<MfaGateStep, 'ok'>;
  factorId: string | null;
  /** Kode cadangan pertama; disimpan pemanggil karena gerbang hilang begitu sesi aal2. */
  onRecoveryCodes: (codes: string[]) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const refresh = useRefreshMfa();
  const generate = useGenerateRecoveryCodes();
  const [screen, setScreen] = useState<Screen>('code');

  async function signOut() {
    await data.auth.signOut().catch(() => undefined);
    queryClient.clear();
    navigate('/login', { replace: true });
  }

  async function enrolled() {
    try {
      onRecoveryCodes(await generate.mutateAsync());
    } catch {
      // Kode cadangan bisa dibuat nanti dari Keamanan akun; 2FA sudah aktif.
    }
    await refresh();
  }

  async function recovered() {
    toast.success('Aplikasi autentikator lama dilepas', {
      description: 'Daftarkan aplikasi baru di menu akun → Keamanan akun.',
    });
    await refresh();
  }

  const signOutButton = (
    <Button type="button" variant="link" onClick={() => void signOut()}>
      Keluar
    </Button>
  );

  if (step === 'enroll') {
    return (
      <AuthLayout
        title="Pasang verifikasi dua langkah"
        description="Role Anda wajib memakai aplikasi autentikator untuk masuk ke Admin. Pasang sekali, lalu setiap masuk cukup masukkan kodenya."
      >
        <TotpEnrollPanel onVerified={enrolled} />
        {signOutButton}
      </AuthLayout>
    );
  }

  if (screen === 'recovery' || !factorId) {
    return (
      <AuthLayout
        title="Masuk dengan kode cadangan"
        description="Gunakan salah satu kode cadangan yang Anda simpan saat mengaktifkan verifikasi dua langkah."
      >
        <RecoveryCodeForm onRecovered={recovered} />
        {factorId ? (
          <Button type="button" variant="link" onClick={() => setScreen('code')}>
            Pakai kode dari aplikasi
          </Button>
        ) : null}
        {signOutButton}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verifikasi dua langkah"
      description="Buka aplikasi autentikator, lalu masukkan kode PanduArah Admin."
    >
      <TotpCodeForm factorId={factorId} onVerified={refresh} />
      <Button type="button" variant="link" onClick={() => setScreen('recovery')}>
        Ponsel hilang? Pakai kode cadangan
      </Button>
      {signOutButton}
    </AuthLayout>
  );
}

export function RecoveryCodesScreen({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  return (
    <AuthLayout
      title="Simpan kode cadangan"
      description="Verifikasi dua langkah aktif. Kode ini dipakai bila Anda kehilangan ponsel."
    >
      <RecoveryCodesList codes={codes} onDone={onDone} />
    </AuthLayout>
  );
}
