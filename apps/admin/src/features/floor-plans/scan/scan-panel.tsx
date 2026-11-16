import {
  type FloorId,
  lockedFeatureMessage,
  SCAN_CONFIDENCE_LABELS,
  SCAN_SENSITIVITIES,
  SCAN_SENSITIVITY_LABELS,
  type ScanCandidate,
  type ScanSensitivity,
  scanCandidates,
} from '@indoor/domain';
import { SCAN_LEVEL_COLORS } from '@indoor/map-core';
import { Button, toast } from '@indoor/ui';
import { useMutation } from '@tanstack/react-query';
import { ScanLineIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { data } from '../../../app/data-client';
import { useFeature } from '../../license/queries';
import { type FloorPlanVersion, useFloorPlans } from '../queries';
import { useScanStore } from './scan-store';

const KIND_LABELS: Record<ScanCandidate['kind'], string> = { unit: 'Ruang', wall: 'Dinding' };

function useActivePlan(floorId: FloorId): FloorPlanVersion | null {
  const plans = useFloorPlans(floorId);
  return plans.data?.find((p) => p.isActive && p.corners?.length === 4) ?? null;
}

function useScan(floorId: FloorId, plan: FloorPlanVersion | null) {
  const setResult = useScanStore((s) => s.setResult);
  return useMutation({
    mutationFn: async (sensitivity: ScanSensitivity) => {
      if (!plan?.corners) throw new Error('Denah belum ditempatkan di peta.');
      const image = await data.floorPlans.downloadImage(plan);
      const result = await data.cadConverter.scan(image, sensitivity);
      return scanCandidates(result, plan.corners);
    },
    onSuccess: (result) => setResult(floorId, result),
  });
}

function candidateLabels(candidates: readonly ScanCandidate[]) {
  const counters: Record<ScanCandidate['kind'], number> = { unit: 0, wall: 0 };
  return new Map(
    candidates.map((candidate) => {
      counters[candidate.kind] += 1;
      return [candidate.id, `${KIND_LABELS[candidate.kind]} ${counters[candidate.kind]}`];
    }),
  );
}

function CandidateList({ candidates }: { candidates: readonly ScanCandidate[] }) {
  const selectedIds = useScanStore((s) => s.selectedIds);
  const toggle = useScanStore((s) => s.toggle);
  const labels = candidateLabels(candidates);
  return (
    <ul aria-label="Hasil scan" className="grid max-h-64 gap-1 overflow-y-auto pr-1">
      {candidates.map((candidate) => (
        <li key={candidate.id}>
          <label className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-0.5 hover:bg-canvas">
            <input
              type="checkbox"
              className="size-4 accent-ink"
              checked={selectedIds.has(candidate.id)}
              onChange={() => toggle(candidate.id)}
            />
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: SCAN_LEVEL_COLORS[candidate.level] }}
            />
            <span className="flex-1">{labels.get(candidate.id)}</span>
            <span className="text-ink-muted text-xs">
              {SCAN_CONFIDENCE_LABELS[candidate.level]}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function Results({ onImport }: { onImport: (candidates: ScanCandidate[]) => void }) {
  const candidates = useScanStore((s) => s.candidates);
  const rejected = useScanStore((s) => s.rejected);
  const selectedIds = useScanStore((s) => s.selectedIds);
  const selectAll = useScanStore((s) => s.selectAll);
  const selectNone = useScanStore((s) => s.selectNone);
  const discard = useScanStore((s) => s.discard);
  const rooms = candidates.filter((c) => c.kind === 'unit').length;
  const selected = candidates.filter((c) => selectedIds.has(c.id));

  if (candidates.length === 0) {
    return (
      <p role="status" className="text-ink-muted text-sm">
        Tidak ada ruang atau dinding yang terdeteksi. Coba kepekaan lebih tinggi.
      </p>
    );
  }
  return (
    <div className="grid gap-3">
      <p role="status" className="text-sm">
        {rooms} ruang dan {candidates.length - rooms} dinding terdeteksi
        {rejected > 0 ? `; ${rejected} bentuk tidak valid dibuang` : ''}. Keyakinan rendah tidak
        dipilih otomatis.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={selectAll}>
          Pilih semua
        </Button>
        <Button size="sm" onClick={selectNone}>
          Kosongkan
        </Button>
      </div>
      <CandidateList candidates={candidates} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" onClick={discard}>
          Buang hasil
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={selected.length === 0}
          onClick={() => onImport(selected)}
        >
          Impor {selected.length} sebagai draft
        </Button>
      </div>
    </div>
  );
}

export function ScanPanel({
  floorId,
  onImport,
}: {
  floorId: FloorId;
  onImport: (candidates: ScanCandidate[]) => string[];
}) {
  const open = useScanStore((s) => s.open);
  const setOpen = useScanStore((s) => s.setOpen);
  const resultFloor = useScanStore((s) => s.floorId);
  const discard = useScanStore((s) => s.discard);
  const plan = useActivePlan(floorId);
  const allowed = useFeature('cad_import');
  const scan = useScan(floorId, plan);
  const [sensitivity, setSensitivity] = useState<ScanSensitivity>('medium');

  if (!open) return null;

  const importSelected = (candidates: ScanCandidate[]) => {
    const ids = onImport(candidates);
    discard();
    toast.success(`${ids.length} fitur diimpor sebagai draft.`, {
      description: 'Rapikan lalu publish. Urungkan (Ctrl+Z) membatalkan impor ini.',
    });
  };

  return (
    <section
      aria-labelledby="scan-title"
      className="absolute top-3 right-3 z-10 grid w-80 gap-3 rounded-lg border border-line bg-surface p-4 shadow-lg"
    >
      <div className="flex items-center gap-2">
        <h2 id="scan-title" className="font-bold">
          Scan denah
        </h2>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          aria-label="Tutup scan denah"
          onClick={() => setOpen(false)}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      {!allowed ? (
        <p className="text-ink-muted text-sm">{lockedFeatureMessage('cad_import')}</p>
      ) : !plan ? (
        <p className="text-ink-muted text-sm">
          Unggah denah lantai ini lalu tempatkan di peta (georeferensi) sebelum memindai.
        </p>
      ) : (
        <>
          <p className="text-ink-muted text-sm">
            Dinding dan ruang dideteksi dari gambar denah aktif di server ini, lalu bisa dipilih dan
            diimpor sebagai draft.
          </p>
          <fieldset className="grid gap-1">
            <legend className="mb-1 font-medium text-sm">Kepekaan</legend>
            <div className="flex gap-3">
              {SCAN_SENSITIVITIES.map((value) => (
                <label key={value} className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    name="scan-sensitivity"
                    className="size-4 accent-ink"
                    checked={sensitivity === value}
                    onChange={() => setSensitivity(value)}
                  />
                  {SCAN_SENSITIVITY_LABELS[value]}
                </label>
              ))}
            </div>
          </fieldset>
          <Button
            variant="primary"
            disabled={scan.isPending}
            onClick={() => scan.mutate(sensitivity)}
          >
            <ScanLineIcon aria-hidden="true" />
            {scan.isPending ? 'Memindai…' : 'Scan'}
          </Button>
          {scan.error ? (
            <p role="alert" className="border-danger border-l-4 py-1 pl-3 text-danger text-sm">
              {scan.error.message}
            </p>
          ) : null}
          {resultFloor === floorId && !scan.isPending ? (
            <Results onImport={importSelected} />
          ) : null}
        </>
      )}
    </section>
  );
}
