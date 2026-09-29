import { areaM2 } from '@indoor/domain';
import { Button } from '@indoor/ui';
import { useEditorStore } from './editor-store';
import { FEATURE_KIND_LABELS } from './labels';

const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] items-baseline gap-2 py-1.5">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-mono tabular-nums">{children}</dd>
    </div>
  );
}

function vertexCount(geometry: GeoJSON.Geometry): number {
  switch (geometry.type) {
    case 'Point':
      return 1;
    case 'LineString':
      return geometry.coordinates.length;
    case 'Polygon':
      return (geometry.coordinates[0]?.length ?? 1) - 1;
    default:
      return 0;
  }
}

/** Panel properti kontekstual (kosong saat tidak ada seleksi). Atribut lengkap di T-109. */
export function PropertiesPanel({
  canEdit,
  onRemove,
}: {
  canEdit: boolean;
  onRemove: (id: string) => void;
}) {
  const feature = useEditorStore((s) => (s.selectedId ? s.features[s.selectedId] : undefined));
  if (!feature) {
    return (
      <p className="p-(--panel-padding) text-ink-muted text-sm">
        Pilih fitur di peta atau di daftar untuk melihat propertinya.
      </p>
    );
  }
  const p = feature.properties;
  return (
    <section aria-label="Properti fitur" className="grid content-start gap-3 p-(--panel-padding)">
      <h2 className="font-bold text-lg">{FEATURE_KIND_LABELS[p.kind]}</h2>
      <dl className="divide-y divide-line">
        {p.unitCode ? <Row label="Kode">{p.unitCode}</Row> : null}
        {p.name ? <Row label="Nama">{p.name}</Row> : null}
        {p.kind === 'unit' || feature.geometry.type === 'Polygon' ? (
          <Row label="Luas">{number.format(areaM2(feature.geometry))} m²</Row>
        ) : null}
        <Row label="Titik">{vertexCount(feature.geometry)}</Row>
      </dl>
      {canEdit ? (
        <Button
          variant="ghost"
          className="justify-self-start text-danger"
          onClick={() => onRemove(p.id)}
        >
          Hapus fitur
        </Button>
      ) : null}
    </section>
  );
}
