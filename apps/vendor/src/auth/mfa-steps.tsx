import { Button, Input, Label, Skeleton } from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { data } from '../data-client';
import { AuthShell, errorText, FormNotice } from './auth-shell';

const ISSUER = 'PanduArah Vendor';

function CodeForm({
  factorId,
  onVerified,
  onSignOut,
}: {
  factorId: string;
  onVerified: () => void;
  onSignOut: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get('code'));
    setPending(true);
    setError(null);
    try {
      await data.mfa.verifyTotp(factorId, code);
      onVerified();
    } catch (cause) {
      setError(errorText(cause, 'Kode tidak bisa diperiksa. Coba lagi.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
      <div className="grid gap-1">
        <Label htmlFor="code">Kode 6 digit</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          className="font-mono tracking-widest"
        />
      </div>
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? 'Memeriksa…' : 'Verifikasi'}
      </Button>
      <Button type="button" variant="link" onClick={onSignOut}>
        Keluar
      </Button>
    </form>
  );
}

/** Akun vendor yang sudah punya aplikasi autentikator: cukup kode saat ini. */
export function MfaVerify(props: {
  factorId: string;
  onVerified: () => void;
  onSignOut: () => void;
}) {
  return (
    <AuthShell
      title="Verifikasi dua langkah"
      description="Buka aplikasi autentikator, lalu masukkan kode PanduArah Vendor."
    >
      <CodeForm {...props} />
    </AuthShell>
  );
}

/**
 * Pendaftaran pertama: QR untuk Google Authenticator, Microsoft Authenticator, 1Password, dsb.
 * Dibuat sekali per tampilan; pendaftaran yang ditinggalkan dihapus saat layar ini dibuka lagi.
 */
export function MfaEnroll({
  onVerified,
  onSignOut,
}: {
  onVerified: () => void;
  onSignOut: () => void;
}) {
  const enrollment = useQuery({
    queryKey: ['vendor', 'mfa-enroll'],
    queryFn: () => data.mfa.enrollTotp(ISSUER),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    retry: false,
  });

  return (
    <AuthShell
      title="Pasang verifikasi dua langkah"
      description="Dasbor berisi data calon klien, jadi wajib memakai aplikasi autentikator. Pindai QR ini sekali, lalu masukkan kode yang muncul."
    >
      {enrollment.isPending ? <Skeleton className="size-48 justify-self-center" /> : null}
      {enrollment.isError ? (
        <FormNotice tone="error">
          {errorText(enrollment.error, 'Pendaftaran tidak bisa dimulai. Muat ulang halaman.')}
        </FormNotice>
      ) : null}
      {enrollment.data ? (
        <>
          <img
            src={enrollment.data.qrCode}
            alt="QR untuk aplikasi autentikator"
            className="size-48 justify-self-center bg-white p-2"
          />
          <div className="grid gap-1">
            <span className="text-ink-muted text-sm">Tidak bisa memindai? Ketik kunci ini:</span>
            <code data-testid="totp-secret" className="break-all font-mono text-sm">
              {enrollment.data.secret}
            </code>
          </div>
          <CodeForm
            factorId={enrollment.data.factorId}
            onVerified={onVerified}
            onSignOut={onSignOut}
          />
        </>
      ) : null}
    </AuthShell>
  );
}
