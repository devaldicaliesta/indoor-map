import type { FieldDefinition, LocationType, VenueId } from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  toast,
} from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { FormNotice } from '../auth/auth-layout';
import { fieldUsage, useRemoveField } from '../locations/queries';

/** Hapus field; bila sudah berisi data, jumlah lokasi terdampak disebut sebelum dihapus. */
export function RemoveFieldDialog({
  venueId,
  type,
  field,
  onClose,
}: {
  venueId: VenueId;
  type: LocationType;
  field: FieldDefinition;
  onClose: () => void;
}) {
  const remove = useRemoveField(venueId);
  const usage = useQuery({
    queryKey: ['field-usage', type.id, field.key],
    queryFn: () => fieldUsage(type.id, field.key),
    gcTime: 0,
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus field “{field.label}”?</DialogTitle>
          <DialogDescription asChild>
            <div>
              {usage.isPending ? (
                <Skeleton className="h-5 w-2/3" />
              ) : usage.data ? (
                <p>
                  <strong>{usage.data} lokasi</strong> bertipe {type.name} sudah mengisi field ini.
                  Isiannya ikut terhapus dan tidak bisa dikembalikan.
                </p>
              ) : (
                <p>Belum ada lokasi yang mengisi field ini.</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        {usage.error ? <FormNotice tone="error">{usage.error.message}</FormNotice> : null}
        {remove.error ? <FormNotice tone="error">{remove.error.message}</FormNotice> : null}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="danger"
            disabled={remove.isPending || usage.isPending}
            onClick={() =>
              remove.mutate(field.id, {
                onSuccess: () => {
                  toast.success('Field dihapus', { description: field.label });
                  onClose();
                },
              })
            }
          >
            Hapus field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
