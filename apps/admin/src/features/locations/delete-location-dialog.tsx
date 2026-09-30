import { type Location, orderedUnits, type VenueId } from '@indoor/domain';
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
import { useRemoveLocation } from './queries';

export function DeleteLocationDialog({
  venueId,
  location,
  onClose,
}: {
  venueId: VenueId;
  location: Location;
  onClose: () => void;
}) {
  const remove = useRemoveLocation(venueId);
  const codes = orderedUnits(location.units).map((u) => u.unitCode);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus lokasi {location.name}?</DialogTitle>
          <DialogDescription>
            {codes.length
              ? `Tautan ke unit ${codes.join(', ')} ikut dilepas, sehingga unit itu bisa dipakai lokasi lain.`
              : 'Lokasi ini belum tertaut ke unit.'}{' '}
            Logo dan fotonya ikut terhapus.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="danger"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(location.id, {
                onSuccess: () => {
                  toast.success(`Lokasi ${location.name} dihapus`);
                  onClose();
                },
                onError: (error) =>
                  toast.error('Lokasi tidak dihapus', { description: error.message }),
              })
            }
          >
            Hapus lokasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
