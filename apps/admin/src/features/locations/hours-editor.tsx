import type { OpeningHours, OpeningSpan } from '@indoor/domain';
import { Button, Input } from '@indoor/ui';
import { PlusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const DEFAULT_SPAN: OpeningSpan = { opens: '08:00', closes: '16:00' };

function Spans({
  label,
  spans,
  disabled,
  onChange,
}: {
  label: string;
  spans: readonly OpeningSpan[];
  disabled: boolean;
  onChange: (spans: OpeningSpan[]) => void;
}) {
  const set = (i: number, patch: Partial<OpeningSpan>) =>
    onChange(spans.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="flex flex-wrap items-center gap-2">
      {spans.length === 0 ? <span className="text-ink-muted">Tutup</span> : null}
      {spans.map((span, i) => (
        // Rentang tidak punya id; posisinya tetap selama tidak dihapus.
        <span key={`${label}-${i}`} className="flex items-center gap-1">
          <Input
            type="time"
            aria-label={`${label} buka ${i + 1}`}
            className="w-36"
            value={span.opens}
            disabled={disabled}
            onChange={(e) => set(i, { opens: e.target.value })}
          />
          –
          <Input
            type="time"
            aria-label={`${label} tutup ${i + 1}`}
            className="w-36"
            value={span.closes}
            disabled={disabled}
            onChange={(e) => set(i, { closes: e.target.value })}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`Hapus rentang ${label} ${i + 1}`}
            disabled={disabled}
            onClick={() => onChange(spans.filter((_, j) => j !== i))}
          >
            <XIcon aria-hidden="true" />
          </Button>
        </span>
      ))}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() =>
          onChange([...spans, spans.length ? { opens: '13:00', closes: '16:00' } : DEFAULT_SPAN])
        }
      >
        <PlusIcon aria-hidden="true" />
        {spans.length ? 'Rentang' : 'Buka'}
      </Button>
    </div>
  );
}

/**
 * Jam operasional per hari (boleh beberapa rentang; jam tutup lebih awal dari jam buka berarti
 * lewat tengah malam, sama jam berarti 24 jam) dan tanggal khusus yang menggantikan harinya.
 */
export function HoursEditor({
  hours,
  error,
  disabled,
  onChange,
}: {
  hours: OpeningHours;
  error: string | undefined;
  disabled: boolean;
  onChange: (hours: OpeningHours) => void;
}) {
  const [newDate, setNewDate] = useState('');
  const dates = Object.keys(hours.special).sort();
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 font-bold">Jam operasional</legend>
      <p className="text-ink-muted text-sm">
        Dalam zona waktu venue. Jam tutup lebih awal dari jam buka berarti buka lewat tengah malam;
        jam yang sama berarti buka 24 jam. Kosongkan semua hari bila tidak ada jadwal.
      </p>
      {DAYS.map((day, i) => (
        <div key={day} className="grid grid-cols-[5rem_1fr] items-center gap-2">
          <span>{day}</span>
          <Spans
            label={day}
            spans={hours.weekly[i] ?? []}
            disabled={disabled}
            onChange={(spans) =>
              onChange({ ...hours, weekly: hours.weekly.map((d, j) => (j === i ? spans : d)) })
            }
          />
        </div>
      ))}
      <p className="mt-2 font-bold text-sm">Tanggal khusus</p>
      {dates.map((date) => (
        <div key={date} className="grid grid-cols-[7rem_1fr_auto] items-center gap-2">
          <span className="font-mono text-sm">{date}</span>
          <Spans
            label={date}
            spans={hours.special[date] ?? []}
            disabled={disabled}
            onChange={(spans) =>
              onChange({ ...hours, special: { ...hours.special, [date]: spans } })
            }
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={() => {
              const { [date]: _removed, ...rest } = hours.special;
              onChange({ ...hours, special: rest });
            }}
          >
            Hapus
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          type="date"
          aria-label="Tanggal khusus baru"
          className="w-44"
          value={newDate}
          disabled={disabled}
          onChange={(e) => setNewDate(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          disabled={disabled || !newDate || newDate in hours.special}
          onClick={() => {
            // Tanggal baru dimulai tutup (misalnya hari libur); tambahkan rentang bila buka.
            onChange({ ...hours, special: { ...hours.special, [newDate]: [] } });
            setNewDate('');
          }}
        >
          Tambah tanggal
        </Button>
      </div>
      {error ? <p className="text-danger text-sm">{error}</p> : null}
    </fieldset>
  );
}
