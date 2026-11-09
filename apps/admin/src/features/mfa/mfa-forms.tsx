import { normalizeRecoveryCode, normalizeTotpCode } from '@indoor/domain';
import { Button, Input, Skeleton } from '@indoor/ui';
import { CopyIcon, DownloadIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Field } from '../../app/components/field';
import { data } from '../../app/data-client';
import { FormNotice } from '../auth/auth-layout';
import { useTotpEnrollment } from './queries';

const message = (cause: unknown, fallback: string) =>
  cause instanceof Error && cause.message ? cause.message : fallback;

/** Kode 6 digit dari aplikasi autentikator; bila benar sesi naik ke aal2. */
export function TotpCodeForm({
  factorId,
  submitLabel = 'Verifikasi',
  onVerified,
}: {
  factorId: string;
  submitLabel?: string;
  onVerified: () => void | Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = normalizeTotpCode(String(new FormData(event.currentTarget).get('totp')));
    if (!code) {
      setError('Masukkan 6 digit angka dari aplikasi autentikator.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await data.mfa.verifyTotp(factorId, code);
      await onVerified();
    } catch (cause) {
      setError(message(cause, 'Kode tidak bisa diperiksa. Coba lagi.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void submit(event)} noValidate>
      <Field id="totp" label="Kode 6 digit">
        <Input
          id="totp"
          name="totp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          required
          autoFocus
          aria-invalid={error ? true : undefined}
          className="font-mono tracking-widest"
        />
      </Field>
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? 'Memeriksa…' : submitLabel}
      </Button>
    </form>
  );
}

/** Masuk dengan kode cadangan: aplikasi autentikator lama dilepas server. */
export function RecoveryCodeForm({ onRecovered }: { onRecovered: () => void | Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = normalizeRecoveryCode(String(new FormData(event.currentTarget).get('recovery')));
    if (!code) {
      setError('Kode cadangan terdiri dari 10 huruf dan angka, misalnya ABCDE-FGH23.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (await data.mfa.recover(code)) await onRecovered();
      else setError('Kode cadangan salah atau sudah pernah dipakai.');
    } catch (cause) {
      setError(message(cause, 'Kode cadangan tidak bisa diperiksa. Coba lagi.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void submit(event)} noValidate>
      <Field id="recovery" label="Kode cadangan">
        <Input
          id="recovery"
          name="recovery"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          autoFocus
          aria-invalid={error ? true : undefined}
          className="font-mono uppercase tracking-widest"
        />
      </Field>
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? 'Memeriksa…' : 'Pakai kode cadangan'}
      </Button>
    </form>
  );
}

/** QR untuk Google Authenticator, Microsoft Authenticator, 1Password, dsb., lalu kode pertama. */
export function TotpEnrollPanel({ onVerified }: { onVerified: () => void | Promise<void> }) {
  const enrollment = useTotpEnrollment();
  if (enrollment.isPending) return <Skeleton className="size-48 justify-self-center" />;
  if (enrollment.isError) {
    return (
      <FormNotice tone="error">
        {message(enrollment.error, 'Pendaftaran tidak bisa dimulai. Muat ulang halaman.')}
      </FormNotice>
    );
  }
  return (
    <div className="grid gap-4">
      <ol className="grid list-decimal gap-1 pl-5 text-ink-muted">
        <li>Buka aplikasi autentikator di ponsel, lalu pindai QR ini.</li>
        <li>Masukkan kode 6 digit yang muncul di aplikasi.</li>
      </ol>
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
      <TotpCodeForm
        factorId={enrollment.data.factorId}
        submitLabel="Aktifkan"
        onVerified={onVerified}
      />
    </div>
  );
}

function downloadText(text: string, filename: string) {
  const href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** Ditampilkan sekali setelah dibuat; server hanya menyimpan hash-nya. */
export function RecoveryCodesList({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = `Kode cadangan PanduArah Admin (${window.location.host})\n${codes.join('\n')}\n`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-4">
      <FormNotice tone="info">
        Simpan kode ini di tempat aman (misalnya pengelola password atau dicetak). Setiap kode hanya
        bisa dipakai sekali bila ponsel hilang, dan tidak akan ditampilkan lagi.
      </FormNotice>
      <ul
        aria-label="Kode cadangan"
        className="grid grid-cols-2 gap-2 rounded-md border border-line p-3 font-mono"
      >
        {codes.map((code) => (
          <li key={code} data-testid="recovery-code">
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void copy()}>
          <CopyIcon strokeWidth={1.75} />
          {copied ? 'Tersalin' : 'Salin'}
        </Button>
        <Button type="button" onClick={() => downloadText(text, 'kode-cadangan-panduarah.txt')}>
          <DownloadIcon strokeWidth={1.75} />
          Unduh .txt
        </Button>
        <Button type="button" variant="primary" className="ml-auto" onClick={onDone}>
          Sudah saya simpan
        </Button>
      </div>
    </div>
  );
}
