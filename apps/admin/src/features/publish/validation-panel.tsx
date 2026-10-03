import type { PublishFinding } from '@indoor/domain';
import { Button, StatusDot } from '@indoor/ui';
import { ArrowUpRightIcon } from 'lucide-react';
import { Link } from 'react-router';
import { OUTDOOR } from '../editor/editor-topbar';

const count = new Intl.NumberFormat('id-ID');

/** Tempat memperbaiki temuan: lantai di editor (fitur disorot), lokasi, atau pengaturan. */
function fixLink(finding: PublishFinding): { to: string; label: string } | null {
  if (finding.floorId) {
    const params = new URLSearchParams({
      building: finding.buildingId ?? OUTDOOR,
      floor: finding.floorId,
    });
    const feature = finding.featureIds[0];
    if (feature) params.set('feature', feature);
    return { to: `/map-editor?${params}`, label: 'Buka di editor' };
  }
  if (finding.locationId) {
    return { to: `/locations?location=${finding.locationId}`, label: 'Buka lokasi' };
  }
  if (finding.code === 'instruction_en_empty') {
    return { to: '/settings?tab=instructions', label: 'Buka Instruksi' };
  }
  return null;
}

function FindingList({
  title,
  tone,
  findings,
}: {
  title: string;
  tone: 'danger' | 'warn';
  findings: readonly PublishFinding[];
}) {
  if (findings.length === 0) return null;
  const heading = `${title} (${count.format(findings.length)})`;
  return (
    <section aria-label={heading} className="grid gap-2">
      <h3 className="font-bold">
        <StatusDot tone={tone}>{heading}</StatusDot>
      </h3>
      <ul className="grid gap-1">
        {findings.map((finding, i) => {
          const link = fixLink(finding);
          return (
            // Temuan tidak punya id; urutannya tetap untuk satu hasil validasi.
            <li
              key={`${finding.code}-${i}`}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-line border-b py-2"
            >
              <span className="min-w-0 flex-1">{finding.message}</span>
              {link ? (
                <Link
                  to={link.to}
                  className="inline-flex shrink-0 items-center gap-1 font-bold text-sm underline-offset-4 hover:underline"
                >
                  {link.label}
                  <ArrowUpRightIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Hasil validasi publish dikelompokkan Error (memblokir publish) dan Peringatan (boleh lanjut).
 * Validasi dijalankan server dengan aturan yang sama yang memblokir publish.
 */
export function ValidationPanel({
  findings,
  pending,
  error,
  onValidate,
}: {
  findings: readonly PublishFinding[] | undefined;
  pending: boolean;
  error: string | null;
  onValidate: () => void;
}) {
  const errors = findings?.filter((f) => f.severity === 'error') ?? [];
  const warnings = findings?.filter((f) => f.severity === 'warning') ?? [];
  return (
    <section
      aria-labelledby="validation-title"
      className="grid max-w-3xl gap-4 rounded-md border border-line bg-surface p-(--panel-padding)"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="validation-title" className="font-bold">
          Validasi draft
        </h2>
        <Button onClick={onValidate} disabled={pending}>
          {pending ? 'Memvalidasi…' : 'Validasi'}
        </Button>
      </div>
      <div aria-live="polite" className="grid gap-4">
        {error ? <p className="text-danger">{error}</p> : null}
        {!findings && !error ? (
          <p className="text-ink-muted">
            Periksa draft sebelum menerbitkan. Error memblokir publish; Peringatan boleh diterima.
          </p>
        ) : null}
        {findings && findings.length === 0 ? (
          <StatusDot tone="ok">Lolos validasi, tidak ada Error atau Peringatan.</StatusDot>
        ) : null}
        <FindingList title="Error" tone="danger" findings={errors} />
        <FindingList title="Peringatan" tone="warn" findings={warnings} />
      </div>
    </section>
  );
}
