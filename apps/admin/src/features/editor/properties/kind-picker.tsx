import { type DrawKind, drawKindsFor, type FacilityType, type FeatureShape } from '@indoor/domain';
import { cn } from '@indoor/ui';
import { FacilityTypeSelect } from '../../facilities/facility-type-select';
import { drawKindLabel, drawKindValue } from '../labels';
import { pickFacilityTypeId } from '../session-helpers';
import { useEditorStore } from '../store/editor-store';

/**
 * Pilihan jenis untuk alat gambar aktif; tampil mengambang di pojok kiri atas kanvas.
 * Fasilitas (FR-MAP-07) memilih jenis fasilitasnya di sebelah pilihan jenis fitur.
 */
export function KindPicker({
  isOutdoor,
  facilityTypes,
}: {
  isOutdoor: boolean;
  facilityTypes: readonly FacilityType[];
}) {
  const tool = useEditorStore((s) => s.tool);
  const drawKinds = useEditorStore((s) => s.drawKinds);
  const setDrawKind = useEditorStore((s) => s.setDrawKind);
  if (tool === 'select') return null;
  const shape: FeatureShape = tool;
  const options = drawKindsFor(shape, isOutdoor);
  const current = drawKinds[shape];
  const active = drawKindValue(current);
  const facilityTypeId =
    current.kind === 'facility'
      ? (pickFacilityTypeId(current.facilityTypeId, facilityTypes) ?? undefined)
      : undefined;

  function choose(option: DrawKind) {
    if (option.kind !== 'facility') return setDrawKind(shape, option);
    const id = pickFacilityTypeId(drawKinds.point.facilityTypeId, facilityTypes);
    if (id) setDrawKind(shape, { kind: 'facility', facilityTypeId: id });
  }

  return (
    <div className="absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 rounded-md bg-surface p-1 shadow-(--shadow-float)">
      <div
        role="radiogroup"
        aria-label="Jenis fitur yang digambar"
        className="flex flex-wrap gap-1"
      >
        {options.map((option) => {
          const value = drawKindValue(option);
          const unavailable = option.kind === 'facility' && facilityTypes.length === 0;
          return (
            // biome-ignore lint/a11y/useSemanticElements: tombol segmen, bukan radio bawaan browser
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={value === active}
              disabled={unavailable}
              title={
                unavailable ? 'Belum ada jenis fasilitas. Tambahkan di Pengaturan.' : undefined
              }
              onClick={() => choose(option)}
              className={cn(
                'cursor-pointer rounded-sm px-3 py-1.5 hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40',
                value === active && 'bg-ink font-bold text-on-strong hover:bg-ink',
              )}
            >
              {drawKindLabel(option)}
            </button>
          );
        })}
      </div>
      {current.kind === 'facility' ? (
        <FacilityTypeSelect
          className="h-8 w-52"
          types={facilityTypes}
          value={facilityTypeId}
          onChange={(id) => setDrawKind(shape, { kind: 'facility', facilityTypeId: id })}
        />
      ) : null}
    </div>
  );
}
