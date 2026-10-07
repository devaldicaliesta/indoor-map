import { ChevronDownIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { Input } from '../input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { type FilterDef, type FilterOption, type FilterUpdate, withRangeEnd } from './table-state';

// Radix Select tidak menerima nilai kosong; pilihan "semua" memakai penanda ini.
const ALL = '__all__';

const TRIGGER =
  'flex h-(--control-height) cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-sm border border-ink-muted bg-surface px-3 text-ink [&_svg]:size-4 [&_svg]:shrink-0';

type Change = (update: FilterUpdate) => void;

function SelectFilter({
  def,
  values,
  onChange,
}: {
  def: Extract<FilterDef, { kind: 'select' }>;
  values: readonly string[];
  onChange: Change;
}) {
  return (
    <Select
      value={values[0] ?? ALL}
      onValueChange={(value) => onChange(value === ALL ? [] : [value])}
      disabled={!def.options}
    >
      <SelectTrigger aria-label={def.label} className="w-auto min-w-36 max-w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{def.allLabel}</SelectItem>
        {(def.options ?? []).map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function multiSummary(label: string, values: readonly string[], options: readonly FilterOption[]) {
  const [first] = values;
  if (first === undefined) return label;
  const name = options.find((option) => option.value === first)?.label ?? first;
  return values.length === 1 ? `${label}: ${name}` : `${label}: ${name} +${values.length - 1}`;
}

function MultiFilter({
  def,
  values,
  onChange,
}: {
  def: Extract<FilterDef, { kind: 'multi' }>;
  values: readonly string[];
  onChange: Change;
}) {
  const options = def.options ?? [];
  // Dihitung dari nilai terbaru, bukan nilai saat render: dua centang cepat tidak saling menimpa.
  // Urutan nilai mengikuti urutan pilihan agar URL yang sama selalu sama bentuknya.
  const toggle = (value: string, checked: boolean) =>
    onChange((current) =>
      options
        .map((option) => option.value)
        .filter((v) => (v === value ? checked : current.includes(v))),
    );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={def.label}
        disabled={!def.options}
        className={cn(TRIGGER, values.length > 0 && 'border-ink font-bold')}
      >
        <span className="max-w-56 truncate">{multiSummary(def.label, values, options)}</span>
        <ChevronDownIcon aria-hidden="true" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{def.label}</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={values.includes(option.value)}
            onCheckedChange={(checked) => toggle(option.value, checked === true)}
            // Menu tetap terbuka agar beberapa nilai bisa dicentang sekaligus.
            onSelect={(event) => event.preventDefault()}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DateRangeFilter({
  def,
  values,
  onChange,
}: {
  def: Extract<FilterDef, { kind: 'dateRange' }>;
  values: readonly string[];
  onChange: Change;
}) {
  // Isian disimpan lokal agar tanggal yang baru dipilih langsung tampil walau URL belum
  // diperbarui; URL tetap sumber kebenaran saat berubah dari luar (Hapus filter, Back).
  const [from = '', to = ''] = values;
  const [range, setRange] = useState({ from, to });
  useEffect(() => setRange({ from, to }), [from, to]);
  const update = (next: { from: string; to: string }) => {
    setRange(next);
    onChange(next.from || next.to ? [next.from, next.to] : []);
  };
  return (
    <fieldset className="flex items-center gap-1.5">
      <legend className="sr-only">{def.label}</legend>
      <span aria-hidden="true" className="text-ink-muted text-sm">
        {def.label}
      </span>
      <Input
        type="date"
        aria-label={`${def.label} dari`}
        className="w-38"
        value={range.from}
        max={range.to || undefined}
        onChange={(event) => update(withRangeEnd(range, 'from', event.target.value))}
      />
      <span aria-hidden="true">–</span>
      <Input
        type="date"
        aria-label={`${def.label} sampai`}
        className="w-38"
        value={range.to}
        min={range.from || undefined}
        onChange={(event) => update(withRangeEnd(range, 'to', event.target.value))}
      />
    </fieldset>
  );
}

export function FilterControl({
  def,
  values,
  onChange,
}: {
  def: FilterDef;
  values: readonly string[];
  onChange: Change;
}) {
  switch (def.kind) {
    case 'select':
      return <SelectFilter def={def} values={values} onChange={onChange} />;
    case 'multi':
      return <MultiFilter def={def} values={values} onChange={onChange} />;
    case 'dateRange':
      return <DateRangeFilter def={def} values={values} onChange={onChange} />;
  }
}
