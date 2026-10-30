import type { Profile } from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
} from '@indoor/ui';
import { useState } from 'react';
import { Field } from '../../app/components/field';
import { useDeleteUser } from './queries';

/** Penghapusan permanen (hak hapus UU PDP); email diketik ulang agar tidak salah akun. */
export function DeleteUserDialog({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const remove = useDeleteUser();
  const [typed, setTyped] = useState('');
  const confirmed = typed.trim().toLowerCase() === profile.email.toLowerCase();

  function submit() {
    remove.mutate(profile.userId, {
      onSuccess: () => {
        toast.success(`Akun ${profile.fullName} dihapus`);
        onClose();
      },
      onError: (error) => toast.error('Akun tidak dihapus', { description: error.message }),
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus akun {profile.fullName}?</DialogTitle>
          <DialogDescription>
            Akun, profil, keanggotaan venue, dan status tur dihapus permanen dan tidak bisa
            dipulihkan. Konten yang pernah dibuatnya tetap ada tanpa nama pembuat. Log audit
            menyimpan catatan penghapusan tanpa nama atau email. Ekspor datanya lebih dulu bila
            diminta pemilik akun.
          </DialogDescription>
        </DialogHeader>
        <Field id="confirm-email" label={`Ketik ${profile.email} untuk mengonfirmasi`}>
          <Input
            id="confirm-email"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            className="font-mono"
          />
        </Field>
        <DialogFooter>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="danger" disabled={!confirmed || remove.isPending} onClick={submit}>
            {remove.isPending ? 'Menghapus…' : 'Hapus akun'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
