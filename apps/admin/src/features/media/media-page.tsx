import {
  canDeleteMedia,
  checkImageFile,
  describeUsage,
  formatBytes,
  inUseMessage,
  MEDIA_KIND_LABELS,
  MEDIA_KINDS,
  type MediaAsset,
  type VenueId,
} from '@indoor/domain';
import {
  Badge,
  Button,
  type DataColumn,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  type FilterDef,
  queryRows,
  toast,
} from '@indoor/ui';
import { FileIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Can, useCan, useRole } from '../../app/auth/can';
import { inVenueTime } from '../../app/format';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { useTableState } from '../../hooks/use-table-state';
import { FormNotice } from '../auth/auth-layout';
import { useVenueTimezone } from '../closures/queries';
import { useMediaAssets, useMediaMutations, useMediaPreviews } from './queries';
import { MEDIA_TOUR } from './tour';

const FILTERS: FilterDef[] = [
  {
    kind: 'multi',
    key: 'jenis',
    label: 'Jenis',
    options: MEDIA_KINDS.map((value) => ({ value, label: MEDIA_KIND_LABELS[value] })),
  },
  {
    kind: 'select',
    key: 'pemakaian',
    label: 'Pemakaian',
    allLabel: 'Semua pemakaian',
    options: [
      { value: 'dipakai', label: 'Dipakai' },
      { value: 'belum', label: 'Tidak terpakai' },
    ],
  },
];

const IMAGE_PROBLEMS = {
  empty: 'berkas kosong',
  too_large: 'lebih dari 5 MB',
  unsupported_type: 'bukan PNG, JPG, atau WebP',
} as const;

export function MediaThumb({ asset, url }: { asset: MediaAsset; url: string | undefined }) {
  return url ? (
    <img
      src={url}
      alt=""
      loading="lazy"
      className="size-14 rounded-sm border border-line bg-canvas object-contain"
    />
  ) : (
    <span className="grid size-14 place-items-center rounded-sm border border-line bg-canvas">
      <FileIcon aria-hidden="true" strokeWidth={1.75} className="size-6 text-ink-muted" />
      <span className="sr-only">{asset.mimeType || 'Berkas'}</span>
    </span>
  );
}

function UsageCell({ asset }: { asset: MediaAsset }) {
  if (asset.usages.length === 0) return <span className="text-ink-muted">Tidak terpakai</span>;
  const shown = asset.usages.slice(0, 3);
  return (
    <ul className="grid gap-0.5">
      {shown.map((usage) => (
        <li key={`${usage.kind}-${usage.id}-${usage.role}`}>{describeUsage(usage)}</li>
      ))}
      {asset.usages.length > shown.length ? (
        <li className="text-ink-muted">dan {asset.usages.length - shown.length} lainnya</li>
      ) : null}
    </ul>
  );
}

function DeleteMediaDialog({
  venueId,
  asset,
  onClose,
}: {
  venueId: VenueId;
  asset: MediaAsset;
  onClose: () => void;
}) {
  const { remove } = useMediaMutations(venueId);
  const inUse = asset.usages.length > 0;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {inUse ? `${asset.fileName} masih dipakai` : `Hapus ${asset.fileName}?`}
          </DialogTitle>
          <DialogDescription>
            {inUse
              ? inUseMessage(asset.usages)
              : 'Aset ini tidak dipakai data mana pun. Berkasnya dihapus permanen dari server.'}
          </DialogDescription>
        </DialogHeader>
        {remove.error ? <FormNotice tone="error">{remove.error.message}</FormNotice> : null}
        <DialogFooter>
          <Button onClick={onClose}>{inUse ? 'Tutup' : 'Batal'}</Button>
          {inUse ? null : (
            <Button
              variant="danger"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(asset, {
                  onSuccess: () => {
                    toast.success(`${asset.fileName} dihapus`);
                    onClose();
                  },
                })
              }
            >
              Hapus aset
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadButton({ venueId }: { venueId: VenueId }) {
  const input = useRef<HTMLInputElement>(null);
  const { upload } = useMediaMutations(venueId);
  const choose = (files: File[]) => {
    const rejected = files.flatMap((file) => {
      const check = checkImageFile(file);
      return check.ok ? [] : [`${file.name}: ${IMAGE_PROBLEMS[check.problem]}`];
    });
    if (rejected.length) {
      toast.error('Sebagian berkas ditolak', { description: rejected.join('; ') });
    }
    const accepted = files.filter((file) => checkImageFile(file).ok);
    if (accepted.length === 0) return;
    upload.mutate(accepted, {
      onSuccess: (paths) => toast.success(`${paths.length} gambar diunggah ke pustaka`),
      onError: (error) => toast.error('Gambar tidak diunggah', { description: error.message }),
    });
  };
  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        aria-label="Berkas gambar"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={(e) => {
          choose([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
      <Button
        variant="primary"
        data-tour="media-upload"
        disabled={upload.isPending}
        onClick={() => input.current?.click()}
      >
        {upload.isPending ? 'Mengunggah…' : 'Unggah gambar'}
      </Button>
    </>
  );
}

function MediaLibrary({ venueId }: { venueId: VenueId }) {
  const role = useRole();
  const canEdit = useCan('media.edit');
  const timezone = useVenueTimezone(venueId);
  const assets = useMediaAssets(venueId);
  const previews = useMediaPreviews(venueId, assets.data);
  const [deleting, setDeleting] = useState<MediaAsset | null>(null);
  const table = useTableState({ filters: FILTERS });
  const result = assets.data
    ? queryRows(assets.data, table.state, {
        text: (asset) => [asset.fileName, ...asset.usages.map((u) => u.name)],
        filters: {
          jenis: (asset, values) => values.includes(asset.kind),
          pemakaian: (asset, values) =>
            values.includes(asset.usages.length > 0 ? 'dipakai' : 'belum'),
        },
      })
    : undefined;

  const columns: DataColumn<MediaAsset>[] = [
    {
      id: 'preview',
      header: 'Pratinjau',
      className: 'w-20',
      cell: (asset) => <MediaThumb asset={asset} url={previews.data?.get(asset.path)} />,
    },
    {
      id: 'name',
      header: 'Berkas',
      className: 'min-w-48 whitespace-normal',
      cell: (asset) => (
        <>
          <span className="block break-all font-mono text-sm">{asset.fileName}</span>
          <span className="text-ink-muted text-sm">
            {formatBytes(asset.sizeBytes)} · {inVenueTime(asset.createdAt, timezone)}
          </span>
        </>
      ),
    },
    {
      id: 'kind',
      header: 'Jenis',
      cell: (asset) => <Badge>{MEDIA_KIND_LABELS[asset.kind]}</Badge>,
    },
    {
      id: 'usage',
      header: 'Dipakai oleh',
      className: 'min-w-56 whitespace-normal',
      cell: (asset) => <UsageCell asset={asset} />,
    },
    {
      id: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (asset) =>
        canEdit && role && canDeleteMedia(role, asset) ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-danger"
            onClick={() => setDeleting(asset)}
          >
            Hapus
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="grid gap-4">
      <DataTable
        label="Aset media"
        columns={columns}
        rows={result?.rows}
        rowKey={(asset) => `${asset.bucket}/${asset.path}`}
        total={result?.total ?? 0}
        table={table}
        search={{ placeholder: 'Cari nama berkas atau pemakainya' }}
        filters={FILTERS}
        loading={assets.isFetching && !assets.data}
        error={assets.error?.message ?? null}
        onRetry={() => void assets.refetch()}
        actions={
          <Can action="media.edit">
            <UploadButton venueId={venueId} />
          </Can>
        }
        empty={
          <EmptyState
            title="Belum ada aset"
            description="Logo, foto lokasi, ikon unggahan, dan denah venue ini tampil di sini. Unggah gambar untuk dipakai ulang di banyak lokasi."
          />
        }
      />
      {deleting ? (
        <DeleteMediaDialog venueId={venueId} asset={deleting} onClose={() => setDeleting(null)} />
      ) : null}
    </div>
  );
}

export function MediaPage() {
  const { venue } = useSelectedVenue();
  return (
    <ModuleRoute module="media">
      {(access) => (
        <ModulePage module="media" access={access} tour={MEDIA_TOUR}>
          {venue ? (
            <MediaLibrary key={venue.id} venueId={venue.id} />
          ) : (
            <EmptyState
              title="Belum ada venue"
              description="Buat venue lebih dulu di menu Venue. Aset venue tampil di sini."
            />
          )}
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
