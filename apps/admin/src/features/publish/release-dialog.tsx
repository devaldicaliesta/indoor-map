import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '@indoor/ui';
import { type ReactNode, useState } from 'react';
import { FormNotice } from '../auth/auth-layout';

// Sama dengan batas di fungsi SQL `publish_begin`.
const NOTES_MAX = 500;

/** Konfirmasi publish atau rollback dengan catatan rilis opsional. */
export function ReleaseDialog({
  title,
  description,
  confirmLabel,
  pending,
  error,
  onConfirm,
  onClose,
}: {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pending: boolean;
  error: string | null;
  onConfirm: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState('');
  const tooLong = notes.trim().length > NOTES_MAX;
  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1">
          <Label htmlFor="release-notes">
            Catatan rilis (opsional, {notes.trim().length}/{NOTES_MAX})
          </Label>
          <textarea
            id="release-notes"
            rows={3}
            value={notes}
            disabled={pending}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-sm border border-ink-muted bg-surface px-3 py-2 text-ink disabled:cursor-not-allowed disabled:opacity-50"
          />
          {tooLong ? (
            <p className="text-danger text-sm">Catatan rilis paling banyak 500 karakter.</p>
          ) : null}
        </div>
        {error ? <FormNotice tone="error">{error}</FormNotice> : null}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button variant="primary" disabled={pending || tooLong} onClick={() => onConfirm(notes)}>
            {pending ? 'Memproses…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
