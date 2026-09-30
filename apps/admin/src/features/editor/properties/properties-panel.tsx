import type { FloorFeature } from '@indoor/data';
import { type DrawKind, drawKindsFor, KIND_SHAPE, type ValidationIssue } from '@indoor/domain';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@indoor/ui';
import { drawKindLabel, drawKindValue, FEATURE_KIND_LABELS } from '../labels';
import { singleSelected, useEditorStore } from '../store/editor-store';
import type { EditorSession } from '../use-editor-session';
import { CommitInput } from './commit-input';
import { FacilityFields } from './facility-fields';
import { MultiSelectionPanel } from './multi-selection-panel';
import { RotateControl } from './rotate-control';
import { UnitFields } from './unit-fields';

function vertexCount(geometry: FloorFeature['geometry']): number {
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

function KindSelect({
  feature,
  session,
  canEdit,
}: {
  feature: FloorFeature;
  session: EditorSession;
  canEdit: boolean;
}) {
  const p = feature.properties;
  const current: DrawKind = p.subtype ? { kind: p.kind, subtype: p.subtype } : { kind: p.kind };
  // Fasilitas butuh jenis fasilitas; tanpa jenis di venue pilihan itu tidak ditawarkan.
  const options = drawKindsFor(KIND_SHAPE[p.kind], session.isOutdoor).filter(
    (o) => o.kind !== 'facility' || session.facilityTypes.length > 0 || p.kind === 'facility',
  );
  const inList = options.some((o) => drawKindValue(o) === drawKindValue(current));
  return (
    <div className="grid gap-1">
      <Label htmlFor="feature-kind">Jenis</Label>
      <Select
        value={drawKindValue(current)}
        disabled={!canEdit || !inList}
        onValueChange={(value) => {
          const next = options.find((o) => drawKindValue(o) === value);
          if (next) session.changeKind(p.id, next);
        }}
      >
        <SelectTrigger id="feature-kind">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(inList ? options : [current]).map((option) => (
            <SelectItem key={drawKindValue(option)} value={drawKindValue(option)}>
              {drawKindLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Panel properti kontekstual (kosong saat tidak ada seleksi). */
/** FR-MAP-09: temuan validasi fitur terpilih, dengan penyebab dan cara memperbaiki. */
function IssueList({ issues }: { issues: readonly ValidationIssue[] }) {
  return (
    <div role="alert" className="grid gap-1 border-danger border-l-4 bg-surface py-1 pl-3">
      <p className="font-bold text-danger">
        {issues.length === 1 ? 'Ada masalah geometri' : `${issues.length} masalah geometri`}
      </p>
      <ul className="grid gap-1 text-sm">
        {issues.map((issue) => (
          <li key={`${issue.code}-${issue.featureIds.join('-')}`}>{issue.message}</li>
        ))}
      </ul>
    </div>
  );
}

export function PropertiesPanel({
  session,
  canEdit,
  issues,
}: {
  session: EditorSession;
  canEdit: boolean;
  issues: ReadonlyMap<string, ValidationIssue[]>;
}) {
  const feature = useEditorStore(singleSelected);
  const count = useEditorStore((s) => s.selectedIds.length);
  if (count > 1) return <MultiSelectionPanel session={session} canEdit={canEdit} />;
  if (!feature) {
    return (
      <p className="p-(--panel-padding) text-ink-muted text-sm">
        Pilih fitur di peta atau di daftar untuk melihat propertinya. Shift+klik atau Shift+tarik
        untuk memilih beberapa fitur.
      </p>
    );
  }
  const p = feature.properties;
  return (
    <section
      aria-label="Properti fitur"
      className="grid min-w-0 content-start gap-4 p-(--panel-padding)"
    >
      <h2 className="font-bold text-lg">
        {p.subtype
          ? drawKindLabel({ kind: p.kind, subtype: p.subtype })
          : FEATURE_KIND_LABELS[p.kind]}
        {p.unitCode ? (
          <span className="ml-2 font-mono font-normal text-ink-muted">{p.unitCode}</span>
        ) : null}
      </h2>
      {issues.get(p.id)?.length ? <IssueList issues={issues.get(p.id) ?? []} /> : null}
      <KindSelect feature={feature} session={session} canEdit={canEdit} />
      <div className="grid gap-1">
        <Label htmlFor="feature-name">Nama</Label>
        <CommitInput
          key={`${p.id}-name`}
          id="feature-name"
          value={p.name ?? ''}
          placeholder="Opsional"
          disabled={!canEdit}
          onCommit={(value) => {
            session.update(p.id, { name: value.trim() || undefined });
            return null;
          }}
        />
      </div>
      {p.kind === 'unit' ? (
        <UnitFields feature={feature} session={session} canEdit={canEdit} />
      ) : null}
      {p.kind === 'facility' ? (
        <FacilityFields feature={feature} session={session} canEdit={canEdit} />
      ) : null}
      {canEdit && feature.geometry.type !== 'Point' ? (
        <RotateControl onRotate={(deg) => session.rotateMany([p.id], deg)} />
      ) : null}
      <p className="text-ink-muted text-sm">
        {vertexCount(feature.geometry)} titik · {feature.geometry.type}
      </p>
      {canEdit ? (
        <Button
          variant="ghost"
          className="justify-self-start text-danger"
          onClick={() => session.remove(p.id)}
        >
          Hapus fitur
        </Button>
      ) : null}
    </section>
  );
}
