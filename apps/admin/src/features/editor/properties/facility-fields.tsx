import type { FloorFeature } from '@indoor/data';
import { Label } from '@indoor/ui';
import { FacilityTypeSelect } from '../../facilities/facility-type-select';
import type { EditorSession } from '../use-editor-session';

export function FacilityFields({
  feature,
  session,
  canEdit,
}: {
  feature: FloorFeature;
  session: EditorSession;
  canEdit: boolean;
}) {
  const p = feature.properties;
  const type = session.facilityTypes.find((t) => t.id === p.facilityTypeId);
  return (
    <div className="grid gap-1">
      <Label htmlFor="facility-type">Jenis fasilitas</Label>
      <FacilityTypeSelect
        id="facility-type"
        types={session.facilityTypes}
        value={p.facilityTypeId}
        disabled={!canEdit}
        onChange={(facilityTypeId) => session.update(p.id, { facilityTypeId })}
      />
      {type?.isSafety ? (
        <p className="text-ink-muted text-sm">Fasilitas keselamatan: ikon berlatar merah.</p>
      ) : null}
    </div>
  );
}
