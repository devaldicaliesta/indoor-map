import {
  buildPrintLayout,
  layoutToPdf,
  layoutToSvg,
  type MapDisplay,
  type PaperOrientation,
  type PaperSize,
} from '@indoor/map-core';
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
  toast,
} from '@indoor/ui';
import { Printer } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Field } from '../../app/components/field';
import { FEATURE_KIND_LABELS } from './labels';
import { featureList, useEditorStore } from './store/editor-store';

type Format = 'pdf' | 'svg';

const slug = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'peta';

function save(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

const printDate = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' });

function Choice<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
}: {
  name: string;
  legend: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 font-bold text-sm">{legend}</legend>
      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <Label key={option.value} className="flex cursor-pointer items-center gap-2 font-normal">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-4 accent-(--color-ink)"
            />
            {option.label}
          </Label>
        ))}
      </div>
    </fieldset>
  );
}

export function PrintExport({
  venueName,
  placeName,
  floorName,
  display,
}: {
  venueName: string;
  placeName: string;
  floorName: string;
  display: MapDisplay;
}) {
  const [open, setOpen] = useState(false);
  const defaultTitle = `${venueName} — ${placeName} ${floorName}`.trim();
  const [title, setTitle] = useState(defaultTitle);
  const [format, setFormat] = useState<Format>('pdf');
  const [paper, setPaper] = useState<PaperSize>('A3');
  const [orientation, setOrientation] = useState<PaperOrientation>('landscape');
  const features = useEditorStore((s) => s.features);

  function exportMap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const list = featureList(features);
    const layout = buildPrintLayout(
      { type: 'FeatureCollection', features: list },
      {
        title: title.trim() || defaultTitle,
        subtitle: `Denah lantai ${floorName}`,
        footer: `Dicetak ${printDate.format(new Date())} · PanduArah`,
        paper,
        orientation,
        kindLabels: FEATURE_KIND_LABELS,
        legendTitle: 'Legenda',
        northLabel: 'U',
        ...(display.colors ? { colors: display.colors } : {}),
      },
    );
    const name = `${slug(title || defaultTitle)}-${paper.toLowerCase()}`;
    if (format === 'pdf') {
      const bytes = layoutToPdf(layout);
      save(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), `${name}.pdf`);
    } else {
      save(new Blob([layoutToSvg(layout)], { type: 'image/svg+xml' }), `${name}.svg`);
    }
    toast.success('Peta diekspor', { description: `${name}.${format}` });
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          setTitle(defaultTitle);
          setOpen(true);
        }}
      >
        <Printer aria-hidden className="size-4" />
        Export peta
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form className="grid gap-4" onSubmit={exportMap}>
            <DialogHeader>
              <DialogTitle>Export peta lantai {floorName}</DialogTitle>
              <DialogDescription>
                Untuk dicetak: judul, legenda, arah utara, dan skala ikut dalam berkas.
              </DialogDescription>
            </DialogHeader>
            <Field id="print-title" label="Judul">
              <Input id="print-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Choice
              name="print-format"
              legend="Format"
              value={format}
              onChange={setFormat}
              options={[
                { value: 'pdf', label: 'PDF' },
                { value: 'svg', label: 'SVG' },
              ]}
            />
            <Choice
              name="print-paper"
              legend="Ukuran kertas"
              value={paper}
              onChange={setPaper}
              options={[
                { value: 'A3', label: 'A3' },
                { value: 'A4', label: 'A4' },
              ]}
            />
            <Choice
              name="print-orientation"
              legend="Orientasi"
              value={orientation}
              onChange={setOrientation}
              options={[
                { value: 'landscape', label: 'Lanskap' },
                { value: 'portrait', label: 'Potret' },
              ]}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Ekspor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
