import { drawKindsFor, type FeatureShape } from '@indoor/domain';
import { cn } from '@indoor/ui';
import { drawKindLabel, drawKindValue } from '../labels';
import { useEditorStore } from '../store/editor-store';

/** Pilihan jenis untuk alat gambar aktif; tampil mengambang di pojok kiri atas kanvas. */
export function KindPicker({ isOutdoor }: { isOutdoor: boolean }) {
  const tool = useEditorStore((s) => s.tool);
  const drawKinds = useEditorStore((s) => s.drawKinds);
  const setDrawKind = useEditorStore((s) => s.setDrawKind);
  if (tool === 'select') return null;
  const shape: FeatureShape = tool;
  const options = drawKindsFor(shape, isOutdoor);
  const active = drawKindValue(drawKinds[shape]);
  return (
    <div
      role="radiogroup"
      aria-label="Jenis fitur yang digambar"
      className="absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1 rounded-md bg-surface p-1 shadow-(--shadow-float)"
    >
      {options.map((option) => {
        const value = drawKindValue(option);
        return (
          // biome-ignore lint/a11y/useSemanticElements: tombol segmen, bukan radio bawaan browser
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={value === active}
            onClick={() => setDrawKind(shape, option)}
            className={cn(
              'cursor-pointer rounded-sm px-3 py-1.5 hover:bg-canvas',
              value === active && 'bg-ink font-bold text-on-strong hover:bg-ink',
            )}
          >
            {drawKindLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
