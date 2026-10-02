import type { CategoryWithUsage } from '@indoor/data';
import { type LocationTypeId, moveCategory, type VenueId } from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@indoor/ui';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { useState } from 'react';
import { Can } from '../../app/auth/can';
import { FacilityIconPreview } from '../facilities/facility-icon-preview';
import { iconSource } from '../facilities/icons';
import { CategoryDialog } from './category-dialog';
import { useCategories, useRemoveCategory, useReorderCategories } from './queries';

function DeleteCategoryDialog({
  venueId,
  category,
  onClose,
}: {
  venueId: VenueId;
  category: CategoryWithUsage;
  onClose: () => void;
}) {
  const remove = useRemoveCategory(venueId);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus kategori {category.name}?</DialogTitle>
          <DialogDescription>
            {category.usageCount > 0
              ? `Kategori ini dilepas dari ${category.usageCount} lokasi. Lokasinya sendiri tidak terhapus.`
              : 'Kategori ini belum dipakai lokasi mana pun.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="danger"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(category.id, {
                onSuccess: () => {
                  toast.success(`Kategori ${category.name} dihapus`);
                  onClose();
                },
                onError: (error) =>
                  toast.error('Kategori tidak dihapus', { description: error.message }),
              })
            }
          >
            Hapus kategori
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Open =
  | { kind: 'form'; category: CategoryWithUsage | null }
  | { kind: 'delete'; category: CategoryWithUsage }
  | null;

/** Kategori satu tipe lokasi; urutannya dipakai Visitor. */
export function CategoriesPanel({ venueId, typeId }: { venueId: VenueId; typeId: LocationTypeId }) {
  const categories = useCategories(venueId);
  const reorder = useReorderCategories(venueId);
  const [open, setOpen] = useState<Open>(null);
  const list = (categories.data ?? []).filter((c) => c.locationTypeId === typeId);

  function move(category: CategoryWithUsage, step: -1 | 1) {
    reorder.mutate(moveCategory(list, category.id, step), {
      onError: (error) => toast.error('Urutan tidak disimpan', { description: error.message }),
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-ink-muted">Urutan di sini dipakai sebagai urutan kategori di Visitor.</p>
        <Can action="location.edit">
          <Button variant="primary" onClick={() => setOpen({ kind: 'form', category: null })}>
            Tambah kategori
          </Button>
        </Can>
      </div>
      {categories.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : categories.error ? (
        <p className="text-danger">{categories.error.message}</p>
      ) : list.length === 0 ? (
        <EmptyState
          title="Belum ada kategori"
          description="Tambah kategori, lalu pilih kategori itu di formulir lokasi."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Ikon</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead className="text-right">Dipakai</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell>
                  <FacilityIconPreview
                    source={iconSource(category.icon)}
                    isSafety={false}
                    label={`Ikon ${category.name}`}
                  />
                </TableCell>
                <TableCell className="font-bold">{category.name}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {category.usageCount}
                </TableCell>
                <TableCell className="text-right">
                  <Can action="location.edit">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Naikkan ${category.name}`}
                        disabled={index === 0 || reorder.isPending}
                        onClick={() => move(category, -1)}
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Turunkan ${category.name}`}
                        disabled={index === list.length - 1 || reorder.isPending}
                        onClick={() => move(category, 1)}
                      >
                        <ArrowDownIcon />
                      </Button>
                      <Button size="sm" onClick={() => setOpen({ kind: 'form', category })}>
                        Ubah
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger"
                        onClick={() => setOpen({ kind: 'delete', category })}
                      >
                        Hapus
                      </Button>
                    </div>
                  </Can>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {open?.kind === 'form' ? (
        <CategoryDialog
          venueId={venueId}
          typeId={typeId}
          category={open.category}
          others={list}
          onClose={() => setOpen(null)}
        />
      ) : null}
      {open?.kind === 'delete' ? (
        <DeleteCategoryDialog
          venueId={venueId}
          category={open.category}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
