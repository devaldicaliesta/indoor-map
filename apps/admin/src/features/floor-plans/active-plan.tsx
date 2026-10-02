import { Badge, EmptyState } from '@indoor/ui';
import type { FloorPlanVersion } from './queries';

export function PlanPreview({ url, label }: { url: string; label: string }) {
  return (
    <div className="h-72 overflow-hidden rounded-md border border-line bg-canvas p-2">
      <img src={url} alt={label} className="size-full object-contain" />
    </div>
  );
}

export function ActivePlan({ plan }: { plan: FloorPlanVersion | undefined }) {
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
          {plan.cadLayers.length ? ` · ${plan.cadLayers.length} layer` : ''}
        </span>
      </div>
      <PlanPreview url={plan.imageUrl} label="Denah aktif" />
    </div>
  );
}
