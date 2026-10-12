import { Button, Input, Label } from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { data } from '../data-client';
import { AuthShell, errorText, FormNotice } from './auth-shell';

export function LoginForm({
  notice,
  onSignedIn,
}: {
  notice: string | null;
  onSignedIn: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await data.auth.signIn(String(form.get('email')), String(form.get('password')));
      onSignedIn();
    } catch (cause) {
      setError(errorText(cause, 'Gagal masuk. Coba lagi.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Masuk ke dasbor vendor"
      description="Khusus staf PanduArah. Setelah password, Anda diminta kode dari aplikasi autentikator."
    >
      {notice ? <FormNotice tone="error">{notice}</FormNotice> : null}
      <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
        <div className="grid gap-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {error ? <FormNotice tone="error">{error}</FormNotice> : null}
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Memeriksa…' : 'Masuk'}
        </Button>
      </form>
    </AuthShell>
  );
}
