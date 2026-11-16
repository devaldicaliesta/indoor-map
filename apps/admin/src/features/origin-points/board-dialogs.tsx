import {
  normalizeSearchText,
  type OriginPoint,
  type Snapshot,
  type SnapshotLocation,
  type VenueSummary,
} from '@indoor/domain';
import type { PaperSize } from '@indoor/map-core';
import {
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
  Label,
  queryRows,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
  useLocalTableState,
} from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { type FormEvent, useMemo, useState } from 'react';
import { data } from '../../app/data-client';
import { FormNotice } from '../auth/auth-layout';
import { boardsPdf, savePdf, stickersPdf, venueTitle } from './board-print';
import { qrFilename } from './qr-download';

export type BoardTarget = { kind: 'point'; point: OriginPoint } | { kind: 'floor' } | null;

const PAPERS: readonly PaperSize[] = ['A4', 'A3', 'A2'];
const UNPUBLISHED = 'Venue belum dipublish. Publish dulu agar papan sama dengan peta pengunjung.';

function useLatestSnapshot(venueId: VenueSummary['id'], enabled: boolean) {
  return useQuery({
    queryKey: ['snapshot-latest', venueId],
    queryFn: () => data.snapshots.latest(venueId),
    enabled,
    retry: false,
    staleTime: 0,
  });
}

function PaperChoice({ value, onChange }: { value: PaperSize; onChange: (v: PaperSize) => void }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 font-bold text-sm">Ukuran kertas</legend>
      <div className="flex gap-4">
        {PAPERS.map((paper) => (
          <Label key={paper} className="flex cursor-pointer items-center gap-2 font-normal">
            <input
              type="radio"
              name="board-paper"
              value={paper}
              checked={value === paper}
              onChange={() => onChange(paper)}
              className="size-4 accent-(--color-ink)"
            />
            {paper}
          </Label>
        ))}
      </div>
    </fieldset>
  );
}

export function BoardDialog({
  target,
  venue,
  points,
  publicUrl,
  floorName,
  onClose,
}: {
  target: BoardTarget;
  venue: VenueSummary;
  points: readonly OriginPoint[];
  publicUrl: string;
  floorName: (floorId: string) => string;
  onClose: () => void;
}) {
  const [paper, setPaper] = useState<PaperSize>('A3');
  const floorIds = useMemo(() => [...new Set(points.map((p) => p.floorId))], [points]);
  const [floorId, setFloorId] = useState<string>('');
  const snapshot = useLatestSnapshot(venue.id, target !== null);
  const chosenFloor = floorId || floorIds[0] || '';
  const selected =
    target?.kind === 'point'
      ? [target.point]
      : points.filter((point) => point.floorId === chosenFloor);
  const published = snapshot.data;
  const missing = published
    ? selected.filter((p) => !published.floors.some((f) => f.id === p.floorId))
    : [];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!published) return;
    const printable = selected.filter((p) => published.floors.some((f) => f.id === p.floorId));
    if (printable.length === 0) return;
    const bytes = boardsPdf({
      snapshot: published,
      points: printable,
      paper,
      publicUrl,
      venueId: venue.id,
      floorName,
    });
    const base =
      target?.kind === 'point'
        ? qrFilename(target.point.name).replace(/^qr-/, 'papan-')
        : `papan-${qrFilename(floorName(chosenFloor)).replace(/^qr-/, '')}`;
    savePdf(bytes, `${base}-${paper.toLowerCase()}.pdf`);
    toast.success('Papan dibuat', {
      description: `${printable.length} halaman ${paper}`,
    });
    onClose();
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>
              {target?.kind === 'point'
                ? `Cetak papan “${target.point.name}”`
                : 'Cetak papan massal'}
            </DialogTitle>
            <DialogDescription>
              Papan &quot;Anda di sini&quot;: peta lantai menghadap arah hadap titik, legenda,
              lokasi utama, dan QR rute dari titik itu. Isinya mengikuti peta yang terakhir
              dipublish.
            </DialogDescription>
          </DialogHeader>
          {target?.kind === 'floor' ? (
            <div className="grid gap-1">
              <Label htmlFor="board-floor">Lantai</Label>
              <Select value={chosenFloor} onValueChange={setFloorId}>
                <SelectTrigger id="board-floor">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {floorIds.map((id) => (
                    <SelectItem key={id} value={id}>
                      {floorName(id)} ({points.filter((p) => p.floorId === id).length} titik)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <PaperChoice value={paper} onChange={setPaper} />
          {snapshot.isError ? <FormNotice tone="error">{UNPUBLISHED}</FormNotice> : null}
          {missing.length > 0 ? (
            <FormNotice tone="error">
              {missing.length} titik ada di lantai yang belum dipublish dan dilewati.
            </FormNotice>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!published || selected.length === missing.length}
            >
              {snapshot.isPending ? 'Memuat peta…' : 'Buat PDF'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function locationFloors(snapshot: Snapshot, location: SnapshotLocation): string {
  const floorOf = new Map(
    snapshot.features.features.map((f) => [f.properties.id, f.properties.floorId]),
  );
  const names = location.unitIds.flatMap((id) => {
    const floor = snapshot.floors.find((f) => f.id === floorOf.get(id));
    return floor ? [floor.name] : [];
  });
  return [...new Set(names)].join(', ');
}

export function StickerDialog({
  open,
  venue,
  publicUrl,
  onClose,
}: {
  open: boolean;
  venue: VenueSummary;
  publicUrl: string;
  onClose: () => void;
}) {
  const snapshot = useLatestSnapshot(venue.id, open);
  const table = useLocalTableState();
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const published = snapshot.data;
  const locations = published?.locations ?? [];
  const query = { text: (l: SnapshotLocation) => [l.name, l.code ?? ''] };
  const result = published ? queryRows(locations, table.state, query) : undefined;
  const needle = normalizeSearchText(table.state.q);
  const allMatching = locations.filter(
    (l) =>
      !needle || query.text(l).some((text) => text && normalizeSearchText(text).includes(needle)),
  );

  const toggle = (id: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const columns: DataColumn<SnapshotLocation>[] = [
    {
      id: 'pick',
      header: <span className="sr-only">Pilih</span>,
      className: 'w-10',
      cell: (location) => (
        <input
          type="checkbox"
          aria-label={`Pilih ${location.name}`}
          checked={chosen.has(location.id)}
          onChange={() => toggle(location.id)}
          className="size-4 accent-(--color-ink)"
        />
      ),
    },
    { id: 'name', header: 'Nama', className: 'font-bold', cell: (l) => l.name },
    {
      id: 'floor',
      header: 'Lantai',
      cell: (l) => (published ? locationFloors(published, l) : ''),
    },
  ];

  function download() {
    if (!published) return;
    const picked = locations.filter((l) => chosen.has(l.id));
    const bytes = stickersPdf({
      snapshot: published,
      locations: picked,
      publicUrl,
      venueId: venue.id,
    });
    savePdf(bytes, `stiker-qr-${qrFilename(venueTitle(published)).replace(/^qr-/, '')}.pdf`);
    toast.success('Lembar stiker dibuat', { description: `${picked.length} stiker A4` });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Stiker QR lokasi</DialogTitle>
          <DialogDescription>
            Stiker 5 × 5 cm di lembar A4. Saat dipindai, Visitor membuka lokasi itu, meminta titik
            asal, lalu memberi rute.
          </DialogDescription>
        </DialogHeader>
        {snapshot.isError ? <FormNotice tone="error">{UNPUBLISHED}</FormNotice> : null}
        <DataTable
          label="Lokasi untuk stiker"
          columns={columns}
          rows={result?.rows}
          rowKey={(l) => l.id}
          total={result?.total ?? 0}
          table={table}
          search={{ placeholder: 'Cari nama atau kode lokasi' }}
          loading={snapshot.isPending}
          actions={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={allMatching.length === 0}
              onClick={() => setChosen(new Set(allMatching.map((l) => l.id)))}
            >
              Pilih semua hasil ({allMatching.length})
            </Button>
          }
          empty={<EmptyState title="Tidak ada lokasi" description="Ubah kata pencarian." />}
        />
        <DialogFooter>
          <span className="mr-auto self-center text-ink-muted text-sm">
            {chosen.size} lokasi dipilih
          </span>
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!published || chosen.size === 0}
            onClick={download}
          >
            Buat lembar stiker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
