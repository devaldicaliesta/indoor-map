import type { CategoryWithUsage } from '@indoor/data';
import type { CategoryId } from '@indoor/domain';
import { FacilityIconPreview } from '../facilities/facility-icon-preview';
import { iconSource } from '../facilities/icons';

/** Kategori tipe lokasi terpilih sebagai kotak centang. */
export function CategoryChecklist({
  categories,
  value,
  disabled,
  onChange,
}: {
  categories: readonly CategoryWithUsage[];
  value: readonly CategoryId[];
  disabled: boolean;
  onChange: (value: CategoryId[]) => void;
}) {
  return (
    <fieldset className="grid gap-1" disabled={disabled}>
      <legend className="mb-1 font-bold">Kategori</legend>
      {categories.length === 0 ? (
        <p className="text-ink-muted text-sm">
          Tipe ini belum punya kategori. Tambahkan di tab Tipe lokasi.
        </p>
      ) : (
        <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-line p-2">
          {categories.map((category) => (
            <label key={category.id} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-ink"
                checked={value.includes(category.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...value, category.id]
                      : value.filter((id) => id !== category.id),
                  )
                }
              />
              <FacilityIconPreview
                source={iconSource(category.icon)}
                isSafety={false}
                scale={0.75}
              />
              <span className="truncate">{category.name}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
