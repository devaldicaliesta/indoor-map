import type { CadInspection } from '@indoor/data';
import { defaultCadLayers, naturalWidthM } from '@indoor/domain';
import { useEffect, useRef, useState } from 'react';
import { data } from '../../app/data-client';
import { svgToPng } from './cad';

export interface CadDraft {
  file: File;
  inspection: CadInspection;
  layers: string[];
  /** Raster layer terpilih; `null` saat sedang dirender atau belum ada layer. */
  raster: Blob | null;
  previewUrl: string | null;
  naturalWidthM: number | null;
}

// Pilihan layer sering diubah beruntun; render menunggu jeda singkat.
const RENDER_DELAY_MS = 400;

/** DXF: daftar layer dari layanan konversi, lalu raster layer terpilih untuk pratinjau dan unggah. */
export function useCadFile(onProblem: (message: string | null) => void) {
  const [draft, setDraft] = useState<CadDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const run = useRef(0);

  const previewUrl = draft?.previewUrl ?? null;
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const file = draft?.file;
  const layerKey = draft?.layers.join('\n') ?? '';
  useEffect(() => {
    if (!file || !layerKey) return;
    const layers = layerKey.split('\n');
    const id = ++run.current;
    const timer = window.setTimeout(async () => {
      setBusy(true);
      try {
        const rendered = await data.cadConverter.render(file, layers);
        const raster = await svgToPng(rendered.svg, rendered.widthPx, rendered.heightPx);
        if (id !== run.current) return;
        setDraft(
          (d) =>
            d && {
              ...d,
              raster,
              previewUrl: URL.createObjectURL(raster),
              naturalWidthM: naturalWidthM(rendered.extents, d.inspection.metersPerUnit),
            },
        );
        onProblem(null);
      } catch (error) {
        if (id === run.current) onProblem(error instanceof Error ? error.message : String(error));
      } finally {
        if (id === run.current) setBusy(false);
      }
    }, RENDER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [file, layerKey, onProblem]);

  async function open(next: File) {
    setBusy(true);
    try {
      const inspection = await data.cadConverter.inspect(next);
      const layers = defaultCadLayers(inspection.layers);
      if (layers.length === 0) {
        onProblem('DXF ini tidak berisi gambar di model space.');
        return;
      }
      setDraft({
        file: next,
        inspection,
        layers,
        raster: null,
        previewUrl: null,
        naturalWidthM: null,
      });
    } catch (error) {
      onProblem(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  function setLayers(layers: string[]) {
    run.current++;
    setDraft((d) => d && { ...d, layers, raster: null, previewUrl: null });
    if (layers.length === 0) onProblem('Pilih minimal satu layer.');
  }

  return { draft, busy, open, setLayers, clear: () => setDraft(null) };
}
