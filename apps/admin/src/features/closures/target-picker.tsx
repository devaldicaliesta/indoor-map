import type { ClosureTarget } from '@indoor/domain';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@indoor/ui';
import { useState } from 'react';
import { Link } from 'react-router';
import { type ClosurePlaces, targetLabel } from './closure-model';

/** Fitur yang bisa ditutup dari daftar: area yang dilalui jalur. Edge dipilih di editor. */
const AREA_KINDS = new Set(['unit', 'corridor', 'elevator', 'escalator', 'stairs', 'outdoor_area']);

function targetKey(target: ClosureTarget) {
  return `${target.kind}:${target.id}`;
}

/** Pilihan sasaran penutupan baru: konektor atau area; jalur lewat klik kanan di editor. */
export function TargetPicker({
  places,
  onPick,
}: {
  places: ClosurePlaces;
  onPick: (target: ClosureTarget) => void;
}) {
  const [value, setValue] = useState('');
  const options = [
    ...places.connectors.map((c): ClosureTarget => ({ kind: 'connector', id: c.id })),
    ...places.features
      .filter((f) => AREA_KINDS.has(f.properties.kind))
      .map((f): ClosureTarget => ({ kind: 'feature', id: f.properties.id })),
  ]
    .map((target) => ({ target, label: targetLabel(places, target) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'id'));
  const picked = options.find((o) => targetKey(o.target) === value);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="grid gap-1">
        <label htmlFor="closure-target" className="font-bold text-sm">
          Konektor atau area
        </label>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger id="closure-target" className="w-80">
            <SelectValue placeholder="Pilih yang ditutup" />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={targetKey(o.target)} value={targetKey(o.target)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="primary"
        disabled={!picked}
        onClick={() => picked && onPick(picked.target)}
      >
        Tutup sementara
      </Button>
      <p className="basis-full text-ink-muted text-sm">
        Untuk menutup ruas jalur, klik kanan jalurnya di{' '}
        <Link to="/map-editor" className="underline">
          Editor Peta
        </Link>
        .
      </p>
    </div>
  );
}
