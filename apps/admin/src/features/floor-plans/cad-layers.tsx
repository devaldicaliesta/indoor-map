import type { CadInspection } from '@indoor/data';
import { Button } from '@indoor/ui';

const UNIT_LABELS: Record<string, string> = {
  mm: 'milimeter',
  cm: 'sentimeter',
  m: 'meter',
  in: 'inci',
  ft: 'kaki',
};

const meters = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

/** Daftar layer DXF untuk dipilih; layer CAD hanya menjadi gambar, bukan fitur peta. */
export function CadLayers({
  inspection,
  selected,
  widthM,
  disabled,
  onChange,
}: {
  inspection: CadInspection;
  selected: readonly string[];
  widthM: number | null;
  disabled: boolean;
  onChange: (layers: string[]) => void;
}) {
  const chosen = new Set(selected);
  const all = inspection.layers.filter((l) => l.entities > 0).map((l) => l.name);
  const unit = inspection.unit ? (UNIT_LABELS[inspection.unit] ?? inspection.unit) : null;
  const toggle = (name: string) =>
    onChange(
      inspection.layers
        .map((l) => l.name)
        .filter((n) => (n === name ? !chosen.has(n) : chosen.has(n))),
    );

  return (
    <fieldset className="grid gap-2" disabled={disabled}>
      <legend className="mb-1 font-bold">Layer DXF</legend>
      <p className="text-ink-muted text-sm">
        {unit
          ? `Satuan berkas: ${unit}.${widthM ? ` Lebar gambar ${meters.format(widthM)} m menjadi skala awal saat ditempatkan.` : ''}`
          : 'Berkas tidak mencatat satuan; ukuran diatur saat menempatkan denah di peta.'}
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange(all)}>
          Pilih semua
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>
          Kosongkan
        </Button>
      </div>
      <ul className="grid max-h-48 gap-1 overflow-y-auto rounded-sm border border-line p-2">
        {inspection.layers.map((layer) => (
          <li key={layer.name}>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-ink"
                checked={chosen.has(layer.name)}
                disabled={layer.entities === 0}
                onChange={() => toggle(layer.name)}
              />
              <span className="font-mono text-sm">{layer.name}</span>
              <span className="text-ink-muted text-sm">{layer.entities} objek</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
