import { checkNewRelease, type VendorRelease } from '@indoor/domain/vendor-release';
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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@indoor/ui';
import { CopyIcon, DownloadIcon, PlusIcon } from 'lucide-react';
import { type ChangeEvent, type ComponentProps, type FormEvent, useState } from 'react';
import { formatDate } from '../copy';
import { useReleaseActions, useReleases } from './use-releases';

const todayInJakarta = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

const EMPTY = { version: '', releasedOn: '', notes: '', downloadUrl: '', sha256: '' };

function AddReleaseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = useReleaseActions();
  const today = todayInJakarta();
  const [form, setForm] = useState({ ...EMPTY, releasedOn: today });
  const [problem, setProblem] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const check = checkNewRelease(form, today);
    setProblem(check.ok ? null : check.message);
    if (!check.ok) return;
    add.mutate(check.release, {
      onSuccess: () => {
        setForm({ ...EMPTY, releasedOn: today });
        onClose();
      },
    });
  };
  const field = (
    key: keyof typeof form,
    label: string,
    props: Partial<ComponentProps<typeof Input>> = {},
  ) => (
    <div className="grid gap-1">
      <Label htmlFor={`release-${key}`}>{label}</Label>
      <Input id={`release-${key}`} value={form[key]} onChange={set(key)} {...props} />
    </div>
  );
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Tambah rilis</DialogTitle>
            <DialogDescription>
              Arsip dari <span className="font-mono">deploy/build-release.sh</span> diunggah ke
              penyimpanan vendor; portal mencatat alamat unduh dan SHA-256-nya untuk dikirim ke
              klien.
            </DialogDescription>
          </DialogHeader>
          {field('version', 'Versi', { placeholder: '1.2.0', maxLength: 64, required: true })}
          {field('releasedOn', 'Tanggal rilis', { type: 'date', max: today, required: true })}
          {field('downloadUrl', 'Alamat unduh arsip', {
            type: 'url',
            placeholder: 'https://',
            required: true,
          })}
          {field('sha256', 'SHA-256 (isi berkas .sha256)', {
            className: 'font-mono',
            required: true,
          })}
          {field('notes', 'Catatan rilis', { maxLength: 2000 })}
          {problem ? (
            <p role="alert" className="text-danger text-sm">
              {problem}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" variant="primary" disabled={add.isPending}>
              {add.isPending ? 'Menyimpan…' : 'Tambah rilis'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveDialog({
  release,
  pending,
  onClose,
  onConfirm,
}: {
  release: VendorRelease | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (release: VendorRelease) => void;
}) {
  return (
    <Dialog open={release !== null} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent>
        {release ? (
          <>
            <DialogHeader>
              <DialogTitle>Hapus rilis {release.version}?</DialogTitle>
              <DialogDescription>
                Hanya catatan di portal yang dihapus; arsip di penyimpanan vendor dan instalasi
                klien tidak berubah.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={onClose}>
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={pending}
                onClick={() => onConfirm(release)}
              >
                {pending ? 'Menghapus…' : 'Hapus rilis'}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ReleasesTable({
  releases,
  onRemove,
}: {
  releases: VendorRelease[];
  onRemove: (release: VendorRelease) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Versi</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Catatan</TableHead>
            <TableHead>SHA-256</TableHead>
            <TableHead>
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {releases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-ink-muted">
                Belum ada rilis tercatat.
              </TableCell>
            </TableRow>
          ) : (
            releases.map((release, index) => (
              <TableRow key={release.id}>
                <TableCell className="font-medium">
                  {release.version}
                  {index === 0 ? (
                    <span className="block text-ink-muted text-sm">Terbaru</span>
                  ) : null}
                </TableCell>
                <TableCell>
                  {formatDate(release.releasedOn)}
                  {release.createdByEmail ? (
                    <span className="block text-ink-muted text-sm">{release.createdByEmail}</span>
                  ) : null}
                </TableCell>
                <TableCell className="max-w-xs whitespace-normal">{release.notes || '–'}</TableCell>
                <TableCell>
                  <span className="font-mono text-xs" title={release.sha256}>
                    {release.sha256.slice(0, 12)}…
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Salin SHA-256 rilis ${release.version}`}
                    onClick={() => void navigator.clipboard.writeText(release.sha256)}
                  >
                    <CopyIcon aria-hidden="true" />
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" asChild>
                      <a href={release.downloadUrl} target="_blank" rel="noopener noreferrer">
                        <DownloadIcon aria-hidden="true" /> Unduh {release.version}
                      </a>
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onRemove(release)}>
                      Hapus
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function ReleasesPanel() {
  const releases = useReleases();
  const { remove } = useReleaseActions();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<VendorRelease | null>(null);
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <h2 className="font-bold text-2xl">Rilis on-premise</h2>
          <p className="text-ink-muted">
            Arsip rilis per versi untuk dikirim ke klien. Instalasi melaporkan versinya saat
            check-in.
          </p>
        </div>
        <Button size="sm" variant="primary" className="ml-auto" onClick={() => setAdding(true)}>
          <PlusIcon aria-hidden="true" /> Tambah rilis
        </Button>
      </div>
      {releases.isError ? (
        <p role="alert" className="border-danger border-l-4 bg-surface py-2 pl-3 text-danger">
          Daftar rilis tidak bisa dimuat.
        </p>
      ) : releases.data ? (
        <ReleasesTable releases={releases.data} onRemove={setRemoving} />
      ) : (
        <Skeleton className="h-32" />
      )}
      <AddReleaseDialog open={adding} onClose={() => setAdding(false)} />
      <RemoveDialog
        release={removing}
        pending={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={(release) =>
          remove.mutate(
            { id: release.id, version: release.version },
            { onSettled: () => setRemoving(null) },
          )
        }
      />
    </div>
  );
}
