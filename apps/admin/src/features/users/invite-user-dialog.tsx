import type { AppRole } from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  toast,
} from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { FormNotice } from '../auth/auth-layout';
import { QuotaNotice, useQuotaBlock } from '../license/quota-notice';
import { useInviteUser } from './queries';
import { RoleSelect } from './role-select';

/** `roles`: role yang boleh diberikan pengundang ini (Admin venue tanpa Super Admin). */
export function InviteUserDialog({ roles }: { roles: readonly AppRole[] }) {
  const [open, setOpen] = useState(false);
  const userQuota = useQuotaBlock('users');
  const [role, setRole] = useState<AppRole>('editor');
  const invite = useInviteUser();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    invite.mutate(
      { email, fullName: String(form.get('fullName')), role },
      {
        onSuccess: () => {
          toast.success('Undangan terkirim', {
            description: `${email} menerima tautan untuk membuat password.`,
          });
          setOpen(false);
          setRole('editor');
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) invite.reset();
      }}
    >
      <QuotaNotice message={userQuota} />
      <DialogTrigger asChild>
        <Button variant="primary" disabled={userQuota !== null}>
          Tambah pengguna
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah pengguna</DialogTitle>
          <DialogDescription>
            Pengguna menerima email undangan untuk membuat password sendiri.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-1">
            <Label htmlFor="invite-name">Nama lengkap</Label>
            <Input id="invite-name" name="fullName" required autoFocus />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" name="email" type="email" required />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="invite-role">Role</Label>
            <RoleSelect
              id="invite-role"
              label="Role"
              value={role}
              onChange={setRole}
              roles={roles}
            />
          </div>
          {invite.error ? <FormNotice tone="error">{invite.error.message}</FormNotice> : null}
          <DialogFooter>
            <Button type="submit" variant="primary" disabled={invite.isPending}>
              {invite.isPending ? 'Mengirim…' : 'Kirim undangan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
