import { confirmsVenueDeletion, type Venue } from '@indoor/domain';
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
import { FormNotice } from '../auth/auth-layout';
import { useRemoveVenue } from './queries';

export function DeleteVenueDialog({ venue, onClose }: { venue: Venue; onClose: () => void }) {
  const [typed, setTyped] = useState('');
  const remove = useRemoveVenue();
  const confirmed = confirmsVenueDeletion(typed, venue.name);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus {venue.name}?</DialogTitle>
          <DialogDescription>
            Semua gedung, lantai, denah, peta, jalur, lokasi, titik asal, dan versi published venue
            ini ikut terhapus. Tindakan ini tidak bisa dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <Field id="confirm-venue" label={`Ketik "${venue.name}" untuk mengonfirmasi`}>
          <Input
            id="confirm-venue"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
          />
        </Field>
        {remove.error ? <FormNotice tone="error">{remove.error.message}</FormNotice> : null}
        <DialogFooter>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="danger"
            disabled={!confirmed || remove.isPending}
            onClick={() =>
              remove.mutate(venue.id, {
                onSuccess: () => {
                  toast.success(`${venue.name} dihapus`);
                  onClose();
                },
              })
            }
          >
            {remove.isPending ? 'Menghapus…' : 'Hapus venue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
