import { checkNewPassword, PASSWORD_MIN_LENGTH } from '@indoor/domain';
import { Button, Input, Label } from '@indoor/ui';
import { useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { currentProfileKey } from '../../app/auth/current-profile';
import { FormNotice } from '../auth/auth-layout';
import { useCreateFirstAdmin } from './queries';

const PASSWORD_PROBLEMS = {
  too_short: `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`,
  mismatch: 'Konfirmasi password tidak sama.',
} as const;

/** Super Admin pertama instalasi baru; langsung masuk setelah dibuat. */
export function FirstAdminForm({ onCreated }: { onCreated: () => void }) {
  const create = useCreateFirstAdmin();
  const queryClient = useQueryClient();
  const [problem, setProblem] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const check = checkNewPassword(password, String(form.get('confirmation') ?? ''));
    if (check) return setProblem(PASSWORD_PROBLEMS[check]);
    setProblem(null);
    create.mutate(
      {
        fullName: String(form.get('full-name') ?? '').trim(),
        email: String(form.get('email') ?? '').trim(),
        password,
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: currentProfileKey });
          onCreated();
        },
      },
    );
  }

  const error = problem ?? create.error?.message ?? null;
  return (
    <form className="grid gap-3" onSubmit={submit}>
      <div className="grid gap-1">
        <Label htmlFor="full-name">Nama lengkap</Label>
        <Input id="full-name" name="full-name" required autoComplete="name" />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="username" />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="confirmation">Ulangi password</Label>
        <Input
          id="confirmation"
          name="confirmation"
          type="password"
          required
          autoComplete="new-password"
        />
      </div>
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      <Button type="submit" variant="primary" disabled={create.isPending}>
        {create.isPending ? 'Membuat akun…' : 'Buat Super Admin'}
      </Button>
    </form>
  );
}
