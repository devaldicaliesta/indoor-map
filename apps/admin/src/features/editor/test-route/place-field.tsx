import { Button, cn, Input, Label } from '@indoor/ui';
import { CrosshairIcon, XIcon } from 'lucide-react';
import { type KeyboardEvent, useId, useMemo, useState } from 'react';
import { type PlaceOption, searchPlaces } from './place-options';

/** Tempat terpilih yang ditampilkan di kolom. */
export interface PlaceDisplay {
  label: string;
  detail: string;
  mono: boolean;
}

/**
 * Kolom asal atau tujuan: ketik nama/kode lalu pilih saran, atau "Pilih di peta" untuk titik
 * bebas. Tempat terpilih tampil dengan tombol untuk melepasnya.
 */
export function PlaceField({
  label,
  value,
  options,
  picking,
  onChange,
  onPick,
  onClear,
}: {
  label: string;
  value: PlaceDisplay | null;
  options: readonly PlaceOption[];
  picking: boolean;
  onChange: (option: PlaceOption) => void;
  onPick: () => void;
  onClear: () => void;
}) {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [listOpen, setListOpen] = useState(true);
  const suggestions = useMemo(() => searchPlaces(options, query), [options, query]);
  const open = listOpen && suggestions.length > 0;
  const empty = query.trim() !== '' && suggestions.length === 0;

  function choose(option: PlaceOption) {
    onChange(option);
    setQuery('');
    setActive(0);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && open) {
      event.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp' && open) {
      event.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      const option = suggestions[active];
      if (option) choose(option);
    } else if (event.key === 'Escape') {
      if (open) setListOpen(false);
      else setQuery('');
    }
  }

  const pickButton = (
    <Button
      type="button"
      size="icon"
      variant={picking ? 'primary' : 'secondary'}
      aria-pressed={picking}
      aria-label={`Pilih ${label.toLowerCase()} di peta`}
      title="Pilih di peta"
      onClick={onPick}
    >
      <CrosshairIcon />
    </Button>
  );

  return (
    <div className="grid gap-1">
      <Label htmlFor={inputId}>{label}</Label>
      {value ? (
        <div className="flex items-start gap-2">
          <output
            id={inputId}
            className="grid min-w-0 flex-1 rounded-sm border border-ink-muted px-2 py-1"
          >
            <span className={cn('truncate font-bold', value.mono && 'font-mono')}>
              {value.label}
            </span>
            <span title={value.detail} className="truncate text-ink-muted text-xs">
              {value.detail}
            </span>
          </output>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Lepas ${label.toLowerCase()}`}
            onClick={onClear}
          >
            <XIcon />
          </Button>
          {pickButton}
        </div>
      ) : (
        <div className="relative flex gap-2">
          <Input
            id={inputId}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder="Nama atau kode"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setListOpen(true);
            }}
            onKeyDown={onKeyDown}
          />
          {pickButton}
          {open ? (
            <div
              id={listId}
              role="listbox"
              aria-label={`Saran ${label.toLowerCase()}`}
              className="absolute top-full left-0 z-10 mt-1 grid max-h-72 w-full overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-float"
            >
              {suggestions.map((option, index) => (
                <div
                  key={option.key}
                  id={`${listId}-${index}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(option);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    'grid cursor-pointer px-2 py-1',
                    index === active && 'bg-signal-soft',
                  )}
                >
                  <span className={cn('truncate', option.mono && 'font-mono')}>{option.label}</span>
                  <span className="truncate text-ink-muted text-xs">{option.detail}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
      {empty && !value ? (
        <p className="text-ink-muted text-xs">Tidak ada unit, lokasi, atau fasilitas yang cocok.</p>
      ) : null}
    </div>
  );
}
