import { extensionDaysLeft, type TrialLead, type TrialWorkspace } from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { formatDate } from '../copy';
import type { TrialAction } from './use-vendor';

export type DialogTarget = { kind: TrialAction['kind']; lead: TrialLead; trial: TrialWorkspace };

function ExtendForm({
  target,
  pending,
  onSubmit,
}: {
  target: DialogTarget;
  pending: boolean;
  onSubmit: (days: number) => void;
}) {
  const left = extensionDaysLeft(target.trial);
  const [days, setDays] = useState(String(Math.min(7, left)));
  const value = Number(days);
  const valid = Number.isInteger(value) && value >= 1 && value <= left;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (valid) onSubmit(value);
  };
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>Perpanjang trial {target.lead.institution}</DialogTitle>
        <DialogDescription>
          Berakhir {formatDate(target.trial.endsAt)}. Total perpanjangan paling lama 17 hari; sisa{' '}
          {left} hari.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-1">
        <Label htmlFor="extend-days">Tambah (hari)</Label>
        <Input
          id="extend-days"
          type="number"
          min={1}
          max={left}
          value={days}
          onChange={(event) => setDays(event.target.value)}
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit" variant="primary" disabled={!valid || pending}>
          {pending ? 'Menyimpan…' : 'Perpanjang'}
        </Button>
      </DialogFooter>
    </form>
  );
}

const CONFIRM = {
  lock: {
    title: (name: string) => `Kunci trial ${name} sekarang?`,
    body: 'Admin dan Visitor ruang kerja ini langsung menampilkan "Trial berakhir", pemohon menerima email, dan slotnya dipakai antrean. Ruang kerja dihapus otomatis 7 hari kemudian.',
    action: 'Kunci trial',
  },
  delete: {
    title: (name: string) => `Hapus ruang kerja ${name}?`,
    body: 'Peta, berkas, dan akun pemohon dihapus permanen tanpa email ke pemohon. Data lead tetap tersimpan. Tindakan ini tidak bisa dibatalkan.',
    action: 'Hapus permanen',
  },
} as const;

export function TrialDialog({
  target,
  pending,
  onClose,
  onConfirm,
}: {
  target: DialogTarget | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (action: TrialAction) => void;
}) {
  const base = target ? { lead: target.lead, venueId: target.trial.venueId } : null;
  return (
    <Dialog open={target !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        {target && base && target.kind === 'extend' ? (
          <ExtendForm
            key={target.lead.id}
            target={target}
            pending={pending}
            onSubmit={(days) => onConfirm({ kind: 'extend', ...base, days })}
          />
        ) : null}
        {target && base && target.kind !== 'extend' ? (
          <>
            <DialogHeader>
              <DialogTitle>{CONFIRM[target.kind].title(target.lead.institution)}</DialogTitle>
              <DialogDescription>{CONFIRM[target.kind].body}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={onClose}>
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={pending}
                onClick={() =>
                  onConfirm(
                    target.kind === 'lock'
                      ? { kind: 'lock', ...base }
                      : { kind: 'delete', ...base },
                  )
                }
              >
                {pending ? 'Memproses…' : CONFIRM[target.kind].action}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
