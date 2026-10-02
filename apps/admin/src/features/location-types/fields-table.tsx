import {
  type FieldDefinition,
  type LocationType,
  reorderFields,
  type VenueId,
} from '@indoor/domain';
import {
  Badge,
  Button,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@indoor/ui';
import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon } from 'lucide-react';
import { useState } from 'react';
import { useReorderFields } from '../locations/queries';
import { FIELD_TYPE_LABELS } from './labels';

/**
 * Field tipe lokasi dalam urutan tampil. Urutan diubah dengan menyeret baris, atau tombol
 * naik/turun untuk keyboard; urutan yang sama dipakai formulir lokasi dan Visitor.
 */
export function FieldsTable({
  venueId,
  type,
  canEdit,
  onEdit,
  onRemove,
}: {
  venueId: VenueId;
  type: LocationType;
  canEdit: boolean;
  onEdit: (field: FieldDefinition) => void;
  onRemove: (field: FieldDefinition) => void;
}) {
  const reorder = useReorderFields(venueId);
  const [dragging, setDragging] = useState<string | null>(null);
  const fields = type.fields;

  function moveTo(id: string, index: number) {
    reorder.mutate(reorderFields(fields, id, index), {
      onError: (error) => toast.error('Urutan tidak disimpan', { description: error.message }),
    });
  }

  if (fields.length === 0) {
    return (
      <EmptyState
        title="Belum ada field"
        description="Tambah field untuk informasi khusus tipe ini, misalnya nomor telepon."
      />
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {canEdit ? <TableHead className="w-8" /> : null}
          <TableHead>Label</TableHead>
          <TableHead>Jenis</TableHead>
          <TableHead>Sifat</TableHead>
          {canEdit ? <TableHead className="text-right">Aksi</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field, index) => (
          <TableRow
            key={field.id}
            draggable={canEdit}
            onDragStart={() => setDragging(field.id)}
            onDragEnd={() => setDragging(null)}
            onDragOver={(e) => {
              if (dragging) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging && dragging !== field.id) moveTo(dragging, index);
              setDragging(null);
            }}
            className={dragging === field.id ? 'opacity-50' : undefined}
          >
            {canEdit ? (
              <TableCell className="cursor-grab text-ink-muted">
                <GripVerticalIcon aria-hidden="true" className="size-4" />
              </TableCell>
            ) : null}
            <TableCell>
              <span className="font-bold">{field.label}</span>
              <span className="block font-mono text-ink-muted text-sm">{field.key}</span>
            </TableCell>
            <TableCell>
              {FIELD_TYPE_LABELS[field.type]}
              {field.type === 'select' ? (
                <span className="block text-ink-muted text-sm">{field.options.join(', ')}</span>
              ) : null}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {field.isRequired ? <Badge>Wajib</Badge> : null}
                {field.isVisible ? <Badge>Tampil</Badge> : <Badge>Internal</Badge>}
                {field.isSearchable ? <Badge>Dapat dicari</Badge> : null}
              </div>
            </TableCell>
            {canEdit ? (
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Naikkan ${field.label}`}
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => moveTo(field.id, index - 1)}
                  >
                    <ArrowUpIcon aria-hidden="true" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Turunkan ${field.label}`}
                    disabled={index === fields.length - 1 || reorder.isPending}
                    onClick={() => moveTo(field.id, index + 1)}
                  >
                    <ArrowDownIcon aria-hidden="true" />
                  </Button>
                  <Button size="sm" onClick={() => onEdit(field)}>
                    Ubah
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onRemove(field)}>
                    Hapus
                  </Button>
                </div>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
