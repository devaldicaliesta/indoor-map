import {
  PICTOGRAM_CATEGORIES,
  PICTOGRAM_CATEGORY_LABELS,
  PICTOGRAMS,
  type PictogramCategory,
  type PictogramKey,
  searchPictograms,
} from '@indoor/domain';
import {
  cn,
  Input,
  Pictogram,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@indoor/ui';
import { BanIcon } from 'lucide-react';
import { type ReactNode, useDeferredValue, useId, useMemo, useState } from 'react';

const ALL = 'semua';

function Option({
  name,
  label,
  title,
  checked,
  disabled,
  onSelect,
  children,
}: {
  name: string;
  label: string;
  title: string;
  checked: boolean;
  disabled: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <label
      title={title}
      className={cn(
        'relative flex h-10 cursor-pointer items-center justify-center rounded-sm text-ink hover:bg-canvas has-disabled:cursor-not-allowed has-focus-visible:outline-2 has-focus-visible:outline-ink',
        checked && 'bg-signal-soft shadow-[inset_0_0_0_1px_var(--ink)] hover:bg-signal-soft',
      )}
    >
      <input
        type="radio"
        name={name}
        aria-label={label}
        className="absolute inset-0 m-0 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
      />
      {children}
    </label>
  );
}

export function PictogramPicker({
  value,
  disabled,
  onChange,
  allowNone = false,
}: {
  value: PictogramKey | null;
  disabled: boolean;
  onChange: (key: PictogramKey | null) => void;
  allowNone?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PictogramCategory | typeof ALL>(ALL);
  const deferredQuery = useDeferredValue(query);
  const keys = useMemo(
    () => searchPictograms({ query: deferredQuery, category: category === ALL ? null : category }),
    [deferredQuery, category],
  );
  const selected = value ? PICTOGRAMS[value] : null;

  return (
    <div className="grid gap-2 rounded-md border border-line p-2">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Input
          type="search"
          aria-label="Cari ikon"
          placeholder="Cari ikon (Indonesia/Inggris)…"
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          value={category}
          disabled={disabled}
          onValueChange={(next) => setCategory(next as PictogramCategory | typeof ALL)}
        >
          <SelectTrigger aria-label="Kategori ikon" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua kategori</SelectItem>
            {PICTOGRAM_CATEGORIES.map((key) => (
              <SelectItem key={key} value={key}>
                {PICTOGRAM_CATEGORY_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p id={`${id}-status`} role="status" className="text-ink-muted text-xs">
        {keys.length} ikon
        {selected ? ` · dipilih: ${selected.id}` : ''}
      </p>
      <div
        role="radiogroup"
        aria-label="Ikon bawaan"
        aria-describedby={`${id}-status`}
        className="grid max-h-52 grid-cols-7 gap-1 overflow-y-auto"
      >
        {allowNone ? (
          <Option
            name={id}
            label="Tanpa ikon"
            title="Tanpa ikon"
            checked={value === null}
            disabled={disabled}
            onSelect={() => onChange(null)}
          >
            <BanIcon aria-hidden="true" className="size-5 text-ink-muted" strokeWidth={1.75} />
          </Option>
        ) : null}
        {keys.map((key) => (
          <Option
            key={key}
            name={id}
            label={PICTOGRAMS[key].id}
            title={`${PICTOGRAMS[key].id} · ${PICTOGRAMS[key].en}`}
            checked={value === key}
            disabled={disabled}
            onSelect={() => onChange(key)}
          >
            <Pictogram name={key} className="size-6" />
          </Option>
        ))}
      </div>
      {keys.length === 0 ? (
        <p className="text-ink-muted text-sm">Tidak ada ikon yang cocok. Coba kata lain.</p>
      ) : null}
    </div>
  );
}
