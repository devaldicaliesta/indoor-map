import { Button, Input, Label } from '@indoor/ui';
import { useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { currentProfileKey, useCurrentProfile } from '../../app/auth/current-profile';
import { data } from '../../app/data-client';
import { AuthLayout, FormNotice } from './auth-layout';
import { markActivity } from './idle-sign-out';
import { clearLoginNotice, peekLoginNotice, readFromPath } from './navigation-notice';

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useCurrentProfile();
  const from = readFromPath(location.state);
  // Dibaca sekali saat halaman dibuka, lalu dihapus agar tidak muncul lagi.
  const [notice] = useState(peekLoginNotice);
  useEffect(() => clearLoginNotice(), []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (profile.data) return <Navigate to={from ?? '/'} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await data.auth.signIn(String(form.get('email')), String(form.get('password')));
      markActivity();
      await queryClient.invalidateQueries({ queryKey: currentProfileKey });
      navigate(from ?? '/', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal masuk. Coba lagi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout title="Masuk ke Admin" description="Gunakan email dan password akun Anda.">
      {notice ? <FormNotice tone="info">{notice}</FormNotice> : null}
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
        <Link to="/forgot-password" className="text-ink underline underline-offset-4">
          Lupa password?
        </Link>
      </form>
    </AuthLayout>
  );
}
