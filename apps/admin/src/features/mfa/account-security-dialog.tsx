import { canDisableMfa, RECOVERY_CODE_COUNT } from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  StatusDot,
  toast,
} from '@indoor/ui';
import { useMutation } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { data } from '../../app/data-client';
import { FormNotice } from '../auth/auth-layout';
import { RecoveryCodesList, TotpEnrollPanel } from './mfa-forms';
import {
  type MfaInfo,
  useGenerateRecoveryCodes,
  useMfa,
  useRecoveryCodesLeft,
  useRefreshMfa,
} from './queries';

type Mode = 'view' | 'enroll' | 'confirm-disable' | { codes: string[] };

function Status({ info }: { info: MfaInfo }) {
  const codesLeft = useRecoveryCodesLeft(info.state.hasTotp);
  return (
    <div className="grid gap-1">
      {info.state.hasTotp ? (
        <StatusDot tone="ok">Verifikasi dua langkah aktif</StatusDot>
      ) : (
        <StatusDot tone="neutral" hollow>
          Verifikasi dua langkah belum aktif
        </StatusDot>
      )}
      {info.state.roleRequired ? (
        <p className="text-ink-muted text-sm">Wajib untuk role Anda (diatur Super Admin).</p>
      ) : null}
      {info.state.hasTotp && codesLeft.data !== undefined ? (
        <p className="text-ink-muted text-sm">
          Sisa kode cadangan: {codesLeft.data} dari {RECOVERY_CODE_COUNT}
        </p>
      ) : null}
    </div>
  );
}

/** Mengaktifkan, mematikan, dan membuat kode cadangan 2FA untuk akun sendiri. */
export function AccountSecurityDialog({ onClose }: { onClose: () => void }) {
  const mfa = useMfa();
  const refresh = useRefreshMfa();
  const generate = useGenerateRecoveryCodes();
  const [mode, setMode] = useState<Mode>('view');
  const disable = useMutation({
    mutationFn: (factorId: string) => data.mfa.unenrollTotp(factorId),
    onSuccess: async () => {
      toast.success('Verifikasi dua langkah dimatikan');
      setMode('view');
      await refresh();
    },
    onError: (error) => toast.error('2FA tidak dimatikan', { description: error.message }),
  });

  function newCodes() {
    generate.mutate(undefined, {
      onSuccess: (codes) => setMode({ codes }),
      onError: (error) => toast.error('Kode cadangan tidak dibuat', { description: error.message }),
    });
  }

  async function enrolled() {
    await refresh();
    newCodes();
  }

  const info = mfa.data;
  let body: ReactNode;
  if (!info) {
    body = mfa.error ? (
      <FormNotice tone="error">{mfa.error.message}</FormNotice>
    ) : (
      <Skeleton className="h-16" />
    );
  } else if (typeof mode === 'object') {
    body = <RecoveryCodesList codes={mode.codes} onDone={() => setMode('view')} />;
  } else if (mode === 'enroll') {
    body = <TotpEnrollPanel onVerified={enrolled} />;
  } else if (mode === 'confirm-disable') {
    body = (
      <>
        <FormNotice tone="info">
          Setelah dimatikan, akun ini bisa dibuka dengan password saja dan kode cadangan tidak
          berlaku lagi.
        </FormNotice>
        <DialogFooter>
          <Button onClick={() => setMode('view')}>Batal</Button>
          <Button
            variant="danger"
            disabled={disable.isPending || !info.factorId}
            onClick={() => info.factorId && disable.mutate(info.factorId)}
          >
            {disable.isPending ? 'Mematikan…' : 'Matikan 2FA'}
          </Button>
        </DialogFooter>
      </>
    );
  } else {
    body = (
      <>
        <Status info={info} />
        <DialogFooter>
          {info.state.hasTotp ? (
            <>
              {canDisableMfa(info.state) ? (
                <Button variant="danger" onClick={() => setMode('confirm-disable')}>
                  Matikan
                </Button>
              ) : null}
              <Button onClick={newCodes} disabled={generate.isPending}>
                {generate.isPending ? 'Membuat…' : 'Buat kode cadangan baru'}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setMode('enroll')}>
              Aktifkan verifikasi dua langkah
            </Button>
          )}
        </DialogFooter>
      </>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keamanan akun</DialogTitle>
          <DialogDescription>
            Verifikasi dua langkah meminta kode dari aplikasi autentikator di ponsel setiap masuk,
            jadi password yang bocor saja tidak cukup untuk membuka akun Anda.
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
