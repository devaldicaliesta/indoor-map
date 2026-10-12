import { DataError } from '@indoor/data';
import { Skeleton } from '@indoor/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { LoginForm } from './auth/login-form';
import { MfaEnroll, MfaVerify } from './auth/mfa-steps';
import { DashboardPage } from './dashboard/dashboard-page';
import { data } from './data-client';
import { markActivity } from './idle-sign-out';

type Gate =
  | { step: 'login'; notice: string | null }
  | { step: 'enroll' }
  | { step: 'verify'; factorId: string }
  | { step: 'ok' };

const gateKey = ['vendor', 'gate'] as const;

/**
 * Urutan masuk: password → kode aplikasi autentikator (atau pendaftarannya) → dasbor. Ini hanya
 * pengarah layar; setiap fungsi dasbor di server sendiri menolak sesi tanpa aal2.
 */
async function readGate(): Promise<Gate> {
  if (!(await data.auth.hasSession())) return { step: 'login', notice: null };
  let access: Awaited<ReturnType<typeof data.vendor.access>>;
  try {
    access = await data.vendor.access();
  } catch (cause) {
    if (!(cause instanceof DataError && cause.kind === 'forbidden')) throw cause;
    await data.auth.signOut();
    return { step: 'login', notice: 'Sesi berakhir. Silakan masuk lagi.' };
  }
  if (access === 'ok') return { step: 'ok' };
  if (access === 'denied') {
    // Akun trial atau Admin biasa tidak dibiarkan mendaftarkan autentikator di sini.
    await data.auth.signOut();
    return { step: 'login', notice: 'Akun ini bukan akun staf vendor.' };
  }
  const mfa = await data.mfa.status();
  return mfa.factorId ? { step: 'verify', factorId: mfa.factorId } : { step: 'enroll' };
}

export function App() {
  const queryClient = useQueryClient();
  const gate = useQuery({
    queryKey: gateKey,
    queryFn: readGate,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: gateKey });

  useEffect(
    () =>
      data.auth.onChange((event) => {
        if (event === 'signed_out') {
          // Data calon klien tidak boleh tertinggal di cache setelah keluar.
          queryClient.removeQueries({ predicate: (query) => query.queryKey[1] !== 'gate' });
          // Keluar dari tab lain atau sesi habis: kembali ke layar masuk. Bukan memuat ulang
          // gerbang — `readGate` sendiri juga mengeluarkan akun bukan staf beserta pesannya.
          queryClient.setQueryData<Gate>(gateKey, (gate) =>
            gate?.step === 'login' ? gate : { step: 'login', notice: null },
          );
        }
      }),
    [queryClient],
  );

  const signOut = () => void data.auth.signOut().finally(refresh);
  const signedIn = () => {
    markActivity();
    refresh();
  };
  const idleSignOut = useCallback(() => {
    const idle: Gate = {
      step: 'login',
      notice: 'Anda dikeluarkan setelah 30 menit tidak aktif. Silakan masuk lagi.',
    };
    void data.auth.signOut().finally(() => queryClient.setQueryData<Gate>(gateKey, idle));
  }, [queryClient]);

  if (gate.isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas">
        <Skeleton className="h-40 w-full max-w-sm" />
      </main>
    );
  }
  if (gate.isError) {
    return (
      <LoginForm
        notice="Server tidak terjangkau. Periksa koneksi, lalu muat ulang halaman."
        onSignedIn={signedIn}
      />
    );
  }
  switch (gate.data.step) {
    case 'login':
      return <LoginForm notice={gate.data.notice} onSignedIn={signedIn} />;
    case 'enroll':
      return <MfaEnroll onVerified={signedIn} onSignOut={signOut} />;
    case 'verify':
      return <MfaVerify factorId={gate.data.factorId} onVerified={signedIn} onSignOut={signOut} />;
    case 'ok':
      return <DashboardPage onSignOut={signOut} onIdle={idleSignOut} />;
  }
}
