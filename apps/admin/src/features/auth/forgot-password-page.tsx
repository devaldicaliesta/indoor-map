import { Button, Input, Label } from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { data } from '../../app/data-client';
import { AuthLayout, FormNotice } from './auth-layout';

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email'));
    setPending(true);
    setError(null);
    try {
      await data.auth.requestPasswordReset(email, `${window.location.origin}/reset-password`);
      setSentTo(email);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal mengirim tautan. Coba lagi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Atur ulang password"
      description="Masukkan email akun Anda. Kami kirim tautan untuk membuat password baru."
    >
      {sentTo ? (
        // Pesan sama untuk email terdaftar maupun tidak, agar daftar pengguna tidak bocor.
        <FormNotice tone="info">
          Jika {sentTo} terdaftar, tautan reset sudah dikirim. Tautan berlaku 1 jam dan hanya bisa
          dipakai sekali.
        </FormNotice>
      ) : (
        <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              autoFocus
            />
          </div>
          {error ? <FormNotice tone="error">{error}</FormNotice> : null}
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? 'Mengirim…' : 'Kirim tautan reset'}
          </Button>
        </form>
      )}
      <Link to="/login" className="text-ink underline underline-offset-4">
        Kembali ke halaman masuk
      </Link>
    </AuthLayout>
  );
}
