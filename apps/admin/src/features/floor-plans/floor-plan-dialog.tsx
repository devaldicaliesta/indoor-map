import { floorPlanProblemMessage } from '@indoor/data';
import { checkFloorPlanFile, type Floor } from '@indoor/domain';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  toast,
} from '@indoor/ui';
import { useEffect, useRef, useState } from 'react';
import { Can } from '../../app/auth/can';
import { Field } from '../../app/components/field';
import { FormNotice } from '../auth/auth-layout';
import { FloorPlanHistory } from './floor-plan-history';
import { openPdf, type PdfDocument } from './pdf';
import { type FloorPlanVersion, useFloorPlans, useUploadFloorPlan } from './queries';

type Picked =
  | { kind: 'image'; file: File; previewUrl: string }
  | { kind: 'pdf'; file: File; doc: PdfDocument; page: number; previewUrl: string | null };

function PlanPreview({ url, label }: { url: string; label: string }) {
  return (
    <div className="h-72 overflow-hidden rounded-md border border-line bg-canvas p-2">
      <img src={url} alt={label} className="size-full object-contain" />
    </div>
  );
}

/** Memilih berkas; PDF dibuka dan halaman terpilih dirender ke PNG sebelum diunggah. */
function usePickedFile() {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const raster = useRef<Blob | null>(null);

  const previewUrl = picked?.previewUrl ?? null;
  const doc = picked?.kind === 'pdf' ? picked.doc : null;
  // Pratinjau dan dokumen PDF punya umur berbeda: ganti halaman membuat pratinjau baru
  // tetapi dokumennya tetap dipakai sampai berkas lain dipilih.
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  useEffect(() => () => void doc?.destroy(), [doc]);

  async function renderPdfPage(file: File, doc: PdfDocument, page: number) {
    setBusy(true);
    try {
      const blob = await doc.renderPage(page);
      raster.current = blob;
      setPicked({ kind: 'pdf', file, doc, page, previewUrl: URL.createObjectURL(blob) });
    } finally {
      setBusy(false);
    }
  }

  async function pick(file: File | undefined) {
    setProblem(null);
    raster.current = null;
    setPicked(null);
    if (!file) return;
    const check = checkFloorPlanFile(file);
    if (!check.ok) {
      setProblem(floorPlanProblemMessage(check.problem));
      return;
    }
    if (check.format !== 'pdf') {
      setPicked({ kind: 'image', file, previewUrl: URL.createObjectURL(file) });
      return;
    }
    setBusy(true);
    try {
      const doc = await openPdf(file);
      await renderPdfPage(file, doc, 1);
    } catch {
      setProblem('PDF tidak bisa dibuka. Pastikan berkas tidak rusak atau terkunci kata sandi.');
      setBusy(false);
    }
  }

  function selectPage(page: number) {
    if (picked?.kind !== 'pdf' || page === picked.page) return;
    setPicked({ ...picked, previewUrl: null, page });
    void renderPdfPage(picked.file, picked.doc, page).catch(() =>
      setProblem(`Halaman ${page} gagal dirender.`),
    );
  }

  return { picked, problem, busy, raster, pick, selectPage };
}

function UploadForm({
  floor,
  onDone,
  onCancel,
}: {
  floor: Floor;
  onDone: () => void;
  onCancel: () => void;
}) {
  const upload = useUploadFloorPlan(floor.id);
  const { picked, problem, busy, raster, pick, selectPage } = usePickedFile();

  function submit() {
    if (!picked) return;
    const input =
      picked.kind === 'pdf' && raster.current
        ? { source: picked.file, raster: raster.current, pdfPage: picked.page }
        : { source: picked.file };
    upload.mutate(input, {
      onSuccess: () => {
        toast.success(`Denah lantai ${floor.name} diperbarui`);
        onDone();
      },
    });
  }

  return (
    <div className="grid gap-3">
      <Field
        id="floor-plan-file"
        label="Berkas denah"
        hint="PNG, JPG, atau PDF, maksimal 50 MB. Denah lama tetap tersimpan di riwayat."
        error={problem ?? undefined}
      >
        <Input
          id="floor-plan-file"
          type="file"
          accept="image/png,image/jpeg,application/pdf,.dwg,.dxf"
          disabled={busy || upload.isPending}
          onChange={(event) => void pick(event.target.files?.[0])}
        />
      </Field>
      {picked?.kind === 'pdf' ? (
        <Field id="floor-plan-page" label="Halaman PDF">
          <Select
            value={String(picked.page)}
            onValueChange={(value) => selectPage(Number(value))}
            disabled={busy}
          >
            <SelectTrigger id="floor-plan-page" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: picked.doc.pageCount }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  Halaman {i + 1} dari {picked.doc.pageCount}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
      {busy ? <Skeleton className="h-72" /> : null}
      {!busy && picked?.previewUrl ? (
        <PlanPreview url={picked.previewUrl} label={`Pratinjau ${picked.file.name}`} />
      ) : null}
      {upload.error ? <FormNotice tone="error">{upload.error.message}</FormNotice> : null}
      <DialogFooter>
        <Button onClick={onCancel} disabled={upload.isPending}>
          Batal
        </Button>
        <Button variant="primary" disabled={!picked || busy || upload.isPending} onClick={submit}>
          {upload.isPending ? 'Mengunggah…' : 'Jadikan denah aktif'}
        </Button>
      </DialogFooter>
    </div>
  );
}

function ActivePlan({ plan }: { plan: FloorPlanVersion | undefined }) {
  if (!plan) {
    return (
      <EmptyState
        title="Belum ada denah"
        description="Unggah denah lantai sebagai acuan menggambar peta."
      />
    );
  }
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="signal">Aktif</Badge>
        <span className="font-mono text-ink-muted text-sm uppercase">
          {plan.sourceFormat}
          {plan.pdfPage ? ` · halaman ${plan.pdfPage}` : ''}
        </span>
      </div>
      <PlanPreview url={plan.imageUrl} label="Denah aktif" />
    </div>
  );
}

export function FloorPlanDialog({ floor, onClose }: { floor: Floor; onClose: () => void }) {
  const plans = useFloorPlans(floor.id);
  const [replacing, setReplacing] = useState(false);
  const list = plans.data ?? [];
  const active = list.find((p) => p.isActive);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Denah lantai {floor.name}</DialogTitle>
          <DialogDescription>
            Denah menjadi lapisan acuan saat menggambar peta; tidak tampil di Visitor.
          </DialogDescription>
        </DialogHeader>
        {plans.isPending ? (
          <Skeleton className="h-72" />
        ) : plans.error ? (
          <FormNotice tone="error">{plans.error.message}</FormNotice>
        ) : replacing ? (
          <UploadForm
            floor={floor}
            onDone={() => setReplacing(false)}
            onCancel={() => setReplacing(false)}
          />
        ) : (
          <>
            <ActivePlan plan={active} />
            <Can action="venue.edit">
              <DialogFooter>
                <Button variant="primary" onClick={() => setReplacing(true)}>
                  {active ? 'Ganti denah' : 'Unggah denah'}
                </Button>
              </DialogFooter>
            </Can>
          </>
        )}
        <FloorPlanHistory plans={list.filter((p) => !p.isActive)} />
      </DialogContent>
    </Dialog>
  );
}
