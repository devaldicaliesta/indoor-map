import { can, type FieldDefinition, type LocationType, type VenueId } from '@indoor/domain';
import { Button, cn, EmptyState, Skeleton } from '@indoor/ui';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useRole } from '../../app/auth/can';
import { CategoriesPanel } from '../locations/categories-panel';
import { useLocationTypes } from '../locations/queries';
import { FieldDialog } from './field-dialog';
import { FieldsTable } from './fields-table';
import { RemoveFieldDialog } from './remove-field-dialog';
import { TypeDialog } from './type-dialog';

type Open =
  | { kind: 'type'; type: LocationType | null }
  | { kind: 'field'; field: FieldDefinition | null }
  | { kind: 'remove-field'; field: FieldDefinition }
  | null;

/** Lokasi → Tipe lokasi: daftar tipe, lalu field dan kategori tipe yang dipilih. */
export function LocationTypesPanel({ venueId }: { venueId: VenueId }) {
  const role = useRole();
  const canEdit = role !== null && can(role, 'location.edit');
  const types = useLocationTypes(venueId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState<Open>(null);

  if (types.isPending) return <Skeleton className="h-64 w-full" />;
  if (types.error) return <p className="text-danger">{types.error.message}</p>;
  const list = types.data;
  const type = list.find((t) => t.id === selectedId) ?? list[0] ?? null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <nav aria-label="Tipe lokasi" className="grid gap-1">
        {list.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-current={t.id === type?.id ? 'true' : undefined}
            onClick={() => setSelectedId(t.id)}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-left hover:bg-canvas',
              t.id === type?.id && 'bg-canvas font-bold',
            )}
          >
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-full border border-line"
              style={{ background: t.color ?? 'transparent' }}
            />
            <span className="min-w-0 flex-1 truncate">{t.name}</span>
            <span className="text-ink-muted text-sm">{t.fields.length} field</span>
          </button>
        ))}
        {canEdit ? (
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => setOpen({ kind: 'type', type: null })}
          >
            <PlusIcon aria-hidden="true" />
            Tambah tipe
          </Button>
        ) : null}
      </nav>
      {type ? (
        <div className="grid gap-8">
          <section className="grid gap-3" aria-labelledby="type-fields">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="type-fields" className="font-bold text-lg">
                Field {type.name}
              </h2>
              {canEdit ? (
                <div className="flex gap-2">
                  <Button onClick={() => setOpen({ kind: 'type', type })}>Ubah tipe</Button>
                  <Button variant="primary" onClick={() => setOpen({ kind: 'field', field: null })}>
                    Tambah field
                  </Button>
                </div>
              ) : null}
            </div>
            <FieldsTable
              venueId={venueId}
              type={type}
              canEdit={canEdit}
              onEdit={(field) => setOpen({ kind: 'field', field })}
              onRemove={(field) => setOpen({ kind: 'remove-field', field })}
            />
          </section>
          <section className="grid gap-3" aria-labelledby="type-categories">
            <h2 id="type-categories" className="font-bold text-lg">
              Kategori {type.name}
            </h2>
            <CategoriesPanel venueId={venueId} typeId={type.id} />
          </section>
        </div>
      ) : (
        <EmptyState title="Belum ada tipe lokasi" description="Tambah tipe untuk mulai." />
      )}
      {open?.kind === 'type' ? (
        <TypeDialog
          venueId={venueId}
          type={open.type}
          others={list}
          onClose={() => setOpen(null)}
        />
      ) : null}
      {open?.kind === 'field' && type ? (
        <FieldDialog
          venueId={venueId}
          type={type}
          field={open.field}
          onClose={() => setOpen(null)}
        />
      ) : null}
      {open?.kind === 'remove-field' && type ? (
        <RemoveFieldDialog
          venueId={venueId}
          type={type}
          field={open.field}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
