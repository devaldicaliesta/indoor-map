import { checkNewPassword, PASSWORD_MIN_LENGTH } from '@indoor/domain';
import { Button, Input, Label, Skeleton } from '@indoor/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { data, initialAuthRedirectHash } from '../../app/data-client';
import { AuthLayout, FormNotice } from './auth-layout';
import { NOTICES, setLoginNotice } from './navigation-notice';
import { parseAuthRedirectError } from './redirect-error';

const PROBLEM_MESSAGES = {
  too_short: `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`,
  mismatch: 'Konfirmasi password tidak sama.',
} as const;

const linkError = parseAuthRedirectError(initialAuthRedirectHash);

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Sesi pemulihan dibuat supabase-js dari hash tautan reset.
  const session = useQuery({
    queryKey: ['auth', 'recovery-session'],
    queryFn: () => data.auth.hasSession(),
    enabled: linkError === null,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    const problem = checkNewPassword(password, String(form.get('confirmation')));
    if (problem) {
      setError(PROBLEM_MESSAGES[problem]);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await data.auth.updatePassword(password);
      await data.auth.signOut();
      queryClient.clear();
      setLoginNotice(NOTICES.passwordChanged);
      navigate('/login', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal menyimpan password. Coba lagi.');
    } finally {
      setPending(false);
    }
  }

  const invalidLink =
    linkError ?? (session.data === false ? 'Tautan reset tidak berlaku. Minta tautan baru.' : null);

  return (
    <AuthLayout
      title="Buat password baru"
      description={`Password minimal ${PASSWORD_MIN_LENGTH} karakter.`}
    >
      {invalidLink ? (
        <>
          <FormNotice tone="error">{invalidLink}</FormNotice>
          <Link to="/forgot-password" className="text-ink underline underline-offset-4">
            Minta tautan reset baru
          </Link>
        </>
      ) : session.isPending ? (
        <Skeleton className="h-40" />
      ) : (
        <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-1">
            <Label htmlFor="password">Password baru</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
              autoFocus
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="confirmation">Ulangi password baru</Label>
            <Input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          {error ? <FormNotice tone="error">{error}</FormNotice> : null}
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? 'Menyimpan…' : 'Simpan password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
