import type { Profile } from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@indoor/ui';
import { useResetUserMfa } from './queries';

/** Untuk pemilik akun yang kehilangan ponsel dan kode cadangannya. */
export function ResetMfaDialog({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const reset = useResetUserMfa();

  function submit() {
    reset.mutate(profile.userId, {
      onSuccess: () => {
        toast.success(`Verifikasi dua langkah ${profile.fullName} direset`);
        onClose();
      },
      onError: (error) => toast.error('2FA tidak direset', { description: error.message }),
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset verifikasi dua langkah {profile.fullName}?</DialogTitle>
          <DialogDescription>
            Aplikasi autentikator dan kode cadangan akun ini dilepas, dan semua sesinya dikeluarkan.
            Bila role-nya wajib 2FA, ia mendaftarkan aplikasi baru saat masuk berikutnya. Pastikan
            dulu bahwa yang meminta memang pemilik akun, misalnya lewat telepon atau tatap muka.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="danger" disabled={reset.isPending} onClick={submit}>
            {reset.isPending ? 'Mereset…' : 'Reset 2FA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
