import {
  type FeatureId,
  type LocationId,
  normalizeLocationCode,
  otherHolder,
  suggestUnits,
  type VenueUnit,
} from '@indoor/domain';
import { Button, cn, Input, Label } from '@indoor/ui';
import { MapIcon, XIcon } from 'lucide-react';
import { type KeyboardEvent, useId, useMemo, useState } from 'react';
import { placeText, UNIT_STATUS_TEXT } from './labels';

export interface UnitSelection {
  unitIds: FeatureId[];
  primaryUnitId: FeatureId | null;
}

function takenMessage(unit: VenueUnit, holder: string) {
  return `Unit ${unit.unitCode} sudah dipakai lokasi "${holder}". Lepas dulu dari lokasi itu.`;
}

/**
 * Unit tempat lokasi berada: ketik kode unit (dengan saran) atau pilih di peta. Unit yang
 * dipakai lokasi aktif lain tampil tetapi tidak bisa dipilih; server tetap menolaknya.
 */
export function UnitLinks({
  units,
  selfId,
  value,
  outdoorName,
  disabled,
  onChange,
  onPickOnMap,
}: {
  units: readonly VenueUnit[];
  selfId: LocationId | null;
  value: UnitSelection;
  outdoorName: string;
  disabled: boolean;
  onChange: (value: UnitSelection) => void;
  onPickOnMap: () => void;
}) {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string>();
  // Daftar saran ditutup setelah percobaan menambah agar pesan penolakan terlihat.
  const [listOpen, setListOpen] = useState(true);
  const byId = useMemo(() => new Map(units.map((u) => [u.featureId, u])), [units]);
  const suggestions = useMemo(
    () =>
      suggestUnits(
        units.filter((u) => !value.unitIds.includes(u.featureId)),
        query,
      ),
    [units, value.unitIds, query],
  );
  const open = listOpen && suggestions.length > 0 && query.trim() !== '';

  function add(unit: VenueUnit) {
    const holder = otherHolder(unit, selfId);
    if (holder) {
      setError(takenMessage(unit, holder.name));
      setListOpen(false);
      return;
    }
    onChange({
      unitIds: [...value.unitIds, unit.featureId],
      primaryUnitId: value.primaryUnitId ?? unit.featureId,
    });
    setQuery('');
    setActive(0);
    setError(undefined);
  }

  function addTyped() {
    const code = normalizeLocationCode(query);
    if (!code) return;
    const unit = units.find((u) => u.unitCode.toUpperCase() === code);
    if (!unit) {
      setError(`Unit ${code} tidak ditemukan di venue ini.`);
      setListOpen(false);
    } else if (value.unitIds.includes(unit.featureId)) setQuery('');
    else add(unit);
  }

  function remove(id: FeatureId) {
    const unitIds = value.unitIds.filter((u) => u !== id);
    onChange({
      unitIds,
      primaryUnitId: value.primaryUnitId === id ? (unitIds[0] ?? null) : value.primaryUnitId,
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && open) {
      event.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp' && open) {
      event.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const unit = open ? suggestions[active] : undefined;
      if (unit) add(unit);
      else addTyped();
    } else if (event.key === 'Escape') {
      if (open) setListOpen(false);
      else setQuery('');
    }
  }

  return (
    <fieldset className="grid gap-2" disabled={disabled}>
      <legend className="mb-1 font-bold">Unit</legend>
      {value.unitIds.length === 0 ? (
        <p className="text-ink-muted text-sm">
          Belum tertaut ke unit. Lokasi tanpa unit tidak tampil di peta pengunjung.
        </p>
      ) : (
        <ul className="grid gap-1">
          {value.unitIds.map((id) => {
            const unit = byId.get(id);
            return (
              <li
                key={id}
                className="flex items-center gap-2 rounded-sm border border-line px-2 py-1"
              >
                <span className="font-mono">{unit?.unitCode ?? 'Unit tidak ditemukan'}</span>
                <span className="min-w-0 flex-1 truncate text-ink-muted text-sm">
                  {unit ? placeText(unit, outdoorName) : 'Mungkin sudah dihapus di Editor Peta'}
                </span>
                {value.unitIds.length > 1 ? (
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name={`${listId}-primary`}
                      checked={value.primaryUnitId === id}
                      onChange={() => onChange({ ...value, primaryUnitId: id })}
                      className="accent-ink"
                    />
                    Utama
                  </label>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Lepas unit ${unit?.unitCode ?? ''}`}
                  onClick={() => remove(id)}
                >
                  <XIcon />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="grid gap-1">
        <Label htmlFor={inputId}>Tambah unit</Label>
        <div className="relative flex gap-2">
          <Input
            id={inputId}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            aria-invalid={error ? true : undefined}
            autoComplete="off"
            placeholder="Ketik kode unit, misalnya GU-L1-023"
            className="font-mono"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setError(undefined);
              setListOpen(true);
            }}
            onKeyDown={onKeyDown}
          />
          <Button type="button" onClick={onPickOnMap}>
            <MapIcon />
            Pilih di peta
          </Button>
          {open ? (
            <div
              id={listId}
              role="listbox"
              aria-label="Saran unit"
              className="absolute top-full left-0 z-10 mt-1 grid max-h-64 w-full overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-float"
            >
              {suggestions.map((unit, index) => {
                const holder = otherHolder(unit, selfId);
                return (
                  <div
                    key={unit.featureId}
                    id={`${listId}-${index}`}
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === active}
                    aria-disabled={holder ? true : undefined}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      add(unit);
                    }}
                    className={cn(
                      'flex cursor-pointer items-baseline gap-2 px-3 py-1.5',
                      index === active && 'bg-signal-soft',
                      holder && 'cursor-not-allowed text-ink-muted',
                    )}
                  >
                    <span className="font-mono">{unit.unitCode}</span>
                    <span className="truncate text-sm">
                      {placeText(unit, outdoorName)}
                      {holder
                        ? ` · dipakai ${holder.name}`
                        : unit.unitStatus
                          ? ` · ${UNIT_STATUS_TEXT[unit.unitStatus]}`
                          : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
