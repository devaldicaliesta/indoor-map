import type { FloorFeature } from '@indoor/data';
import { areaM2, roundAreaM2, UNIT_STATUSES, type UnitStatus } from '@indoor/domain';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@indoor/ui';
import { UNIT_STATUS_LABELS } from '../labels';
import type { EditorSession } from '../use-editor-session';
import { CommitInput } from './commit-input';

const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const parseDecimal = (value: string) => Number(value.trim().replace(/\./g, '').replace(',', '.'));

/** FR-MAP-06: kode unit, luas (otomatis, bisa dikoreksi), dan status. */
export function UnitFields({
  feature,
  session,
  canEdit,
}: {
  feature: FloorFeature;
  session: EditorSession;
  canEdit: boolean;
}) {
  const p = feature.properties;
  const computed = roundAreaM2(areaM2(feature.geometry));
  const manual = p.areaM2 !== undefined;
  return (
    <>
      <div className="grid gap-1">
        <Label htmlFor="unit-code">Kode unit</Label>
        <CommitInput
          key={`${p.id}-code`}
          id="unit-code"
          errorId="unit-code-error"
          className="font-mono uppercase"
          value={p.unitCode ?? ''}
          disabled={!canEdit}
          onCommit={(value) => session.setUnitCode(p.id, value)}
        />
      </div>
      <div className="grid gap-1">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="unit-area">Luas (m²)</Label>
          <span className="text-ink-muted text-sm">{manual ? 'Koreksi manual' : 'Otomatis'}</span>
        </div>
        <CommitInput
          key={`${p.id}-area-${manual}`}
          id="unit-area"
          errorId="unit-area-error"
          inputMode="decimal"
          className="font-mono tabular-nums"
          value={number.format(p.areaM2 ?? computed)}
          disabled={!canEdit}
          onCommit={(value) => {
            const area = parseDecimal(value);
            if (!(area > 0 && area < 1e8)) return 'Luas harus angka lebih dari 0.';
            session.update(p.id, { areaM2: roundAreaM2(area) });
            return null;
          }}
        />
        {manual ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Hitungan peta: {number.format(computed)} m²</span>
            {canEdit ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => session.update(p.id, { areaM2: undefined })}
              >
                Pakai otomatis
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="grid gap-1">
        <Label htmlFor="unit-status">Status</Label>
        <Select
          value={p.unitStatus ?? 'occupied'}
          disabled={!canEdit}
          onValueChange={(value) => session.update(p.id, { unitStatus: value as UnitStatus })}
        >
          <SelectTrigger id="unit-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {UNIT_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
