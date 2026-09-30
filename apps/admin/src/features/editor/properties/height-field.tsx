import type { FloorFeature } from '@indoor/data';
import { HEIGHT_KINDS, type HeightInputProblem, parseHeightInput } from '@indoor/domain';
import { type MapDisplay, venueHeights } from '@indoor/map-core';
import { Button, Label } from '@indoor/ui';
import type { EditorSession } from '../use-editor-session';
import { CommitInput } from './commit-input';

const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2, useGrouping: false });
const MESSAGES: Record<HeightInputProblem, string> = {
  not_number: 'Isi angka dalam meter, misalnya 4 atau 3,5.',
  negative: 'Tinggi tidak boleh negatif.',
  too_high: 'Tinggi maksimal 100 m.',
};

export const hasHeight = (feature: FloorFeature) =>
  (HEIGHT_KINDS as readonly string[]).includes(feature.properties.kind);

/**
 * FR-VIS-02: tinggi 3D fitur ini. Kosong = mengikuti tinggi bawaan jenisnya di Pengaturan →
 * Tampilan; tinggi sendiri tetap berlaku walau bawaan jenisnya diubah.
 */
export function HeightField({
  feature,
  session,
  canEdit,
  display,
}: {
  feature: FloorFeature;
  session: EditorSession;
  canEdit: boolean;
  display: MapDisplay;
}) {
  const p = feature.properties;
  const fallback = venueHeights(display)[p.kind] ?? 0;
  const overridden = p.height !== undefined;
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between">
        <Label htmlFor="feature-height">Tinggi 3D (m)</Label>
        <span className="text-ink-muted text-sm">
          {overridden ? 'Tinggi sendiri' : `Bawaan jenis: ${number.format(fallback)} m`}
        </span>
      </div>
      <CommitInput
        key={`${p.id}-height-${overridden}`}
        id="feature-height"
        errorId="feature-height-error"
        inputMode="decimal"
        className="font-mono tabular-nums"
        placeholder={`${number.format(fallback)} (bawaan)`}
        value={overridden ? number.format(p.height as number) : ''}
        disabled={!canEdit}
        onCommit={(value) => {
          const parsed = parseHeightInput(value);
          if (!parsed.ok) return MESSAGES[parsed.problem];
          session.update(p.id, { height: parsed.value ?? undefined });
          return null;
        }}
      />
      {overridden && canEdit ? (
        <Button
          size="sm"
          variant="ghost"
          className="justify-self-start"
          onClick={() => session.update(p.id, { height: undefined })}
        >
          Pakai bawaan jenis
        </Button>
      ) : null}
    </div>
  );
}
