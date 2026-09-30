import type { FacilityType } from '@indoor/domain';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@indoor/ui';
import { FacilityIconPreview } from './facility-icon-preview';
import { iconSource } from './icons';

/** Pilihan jenis fasilitas dengan ikonnya, seperti tampil di peta. */
export function FacilityTypeSelect({
  id,
  types,
  value,
  disabled,
  onChange,
  className,
}: {
  id?: string;
  types: readonly FacilityType[];
  value: string | undefined;
  disabled?: boolean;
  onChange: (typeId: string) => void;
  className?: string;
}) {
  const known = types.some((t) => t.id === value);
  return (
    <Select
      value={known && value ? value : ''}
      disabled={disabled ?? false}
      onValueChange={onChange}
    >
      <SelectTrigger id={id} className={className} aria-label="Jenis fasilitas">
        <SelectValue placeholder={value ? 'Jenis tidak dikenal' : 'Pilih jenis'} />
      </SelectTrigger>
      <SelectContent>
        {types.map((type) => (
          <SelectItem key={type.id} value={type.id}>
            <span className="flex items-center gap-2">
              <FacilityIconPreview
                source={iconSource(type.icon)}
                isSafety={type.isSafety}
                scale={0.75}
              />
              {type.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
