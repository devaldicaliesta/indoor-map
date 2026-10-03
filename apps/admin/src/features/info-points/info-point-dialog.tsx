import {
  checkInfoPointInput,
  type DisplayMode,
  INFO_POINT_IDLE_RANGE,
  type InfoPoint,
  type InfoPointProblem,
  type LanguageCode,
  lockedFeatureMessage,
  type Position,
  type VenueId,
} from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@indoor/ui';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Field } from '../../app/components/field';
import { FormNotice } from '../auth/auth-layout';
import { floorLabel } from '../closures/closure-model';
import type { useVenueFloors } from '../editor/connectors/queries';
import { useFeature } from '../license/queries';
import { HeadingField } from '../origin-points/heading-field';
import { OriginMap } from '../origin-points/origin-map';
import { useSavedGraph } from '../origin-points/queries';
import { useSaveInfoPoint } from './queries';

type Places = NonNullable<ReturnType<typeof useVenueFloors>['data']>;

/** `point: null` = Info Point baru. */
export type InfoPointDialogTarget = { point: InfoPoint | null } | null;

const PROBLEMS: Record<InfoPointProblem, string> = {
  code: 'Kode 1–32 karakter: huruf, angka, dan tanda hubung.',
  name: 'Nama wajib diisi.',
  idle: `Durasi idle ${INFO_POINT_IDLE_RANGE.min}–${INFO_POINT_IDLE_RANGE.max} detik.`,
};

function Choice<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <Field id={id} label={label}>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function InfoPointForm({
  venueId,
  places,
  points,
  point,
  onDone,
}: {
  venueId: VenueId;
  places: Places;
  points: readonly InfoPoint[];
  point: InfoPoint | null;
  onDone: () => void;
}) {
  const graph = useSavedGraph(venueId).data;
  const save = useSaveInfoPoint(venueId);
  const allow3d = useFeature('3d');
  const [code, setCode] = useState(point?.code ?? '');
  const [name, setName] = useState(point?.name ?? '');
  const [floorId, setFloorId] = useState(point?.floorId ?? places.floors[0]?.id ?? '');
  const [position, setPosition] = useState<Position | null>(point?.coordinates ?? null);
  const [heading, setHeading] = useState(point?.headingDeg ?? 0);
  const [defaultMode, setDefaultMode] = useState<DisplayMode>(point?.defaultMode ?? '2d');
  const [force2d, setForce2d] = useState(point?.force2d ?? false);
  const [language, setLanguage] = useState<LanguageCode>(point?.defaultLanguage ?? 'id');
  const [idle, setIdle] = useState(String(point?.idleSeconds ?? 60));
  const [problems, setProblems] = useState<string[]>([]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const idleSeconds = Number(idle);
    const found = checkInfoPointInput({ code, name, idleSeconds }).map((p) => PROBLEMS[p]);
    if (!position) found.push('Klik peta untuk meletakkan Info Point.');
    setProblems(found);
    if (found.length || !position) return;
    save.mutate(
      {
        id: point?.id ?? null,
        input: {
          code,
          name,
          floorId,
          coordinates: position,
          headingDeg: heading,
          nodeId: null,
          defaultMode,
          force2d,
          defaultLanguage: language,
          idleSeconds,
        },
      },
      {
        onSuccess: () => {
          toast.success('Info Point disimpan dan ditempelkan ke jalur');
          onDone();
        },
      },
    );
  }

  const row = (children: ReactNode) => <div className="grid grid-cols-2 gap-3">{children}</div>;
  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>{point ? `Ubah ${point.name}` : 'Tambah Info Point'}</DialogTitle>
        <DialogDescription>
          Klik peta di tempat layar dipasang. Posisi ditempelkan ke jalur terdekat saat disimpan.
        </DialogDescription>
      </DialogHeader>
      {row(
        <>
          <Field id="ip-code" label="Kode" hint="Dipakai di URL layar, mis. IP-LOBI.">
            <Input
              id="ip-code"
              value={code}
              maxLength={32}
              className="font-mono"
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
          <Field id="ip-name" label="Nama">
            <Input
              id="ip-name"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        </>,
      )}
      <Field id="ip-floor" label="Gedung dan lantai">
        <Select
          value={floorId}
          onValueChange={(id) => {
            setFloorId(id);
            setPosition(null);
          }}
        >
          <SelectTrigger id="ip-floor">
            <SelectValue placeholder="Pilih lantai" />
          </SelectTrigger>
          <SelectContent>
            {places.floors.map((floor) => (
              <SelectItem key={floor.id} value={floor.id}>
                {floorLabel(places, floor.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {floorId ? (
        <OriginMap
          key={floorId}
          floorId={floorId}
          graph={graph}
          others={points.filter((p) => p.id !== point?.id)}
          position={position}
          headingDeg={heading}
          onPick={setPosition}
        />
      ) : null}
      <HeadingField
        id="ip-heading"
        value={heading}
        onChange={setHeading}
        hint="Arah yang dihadapi pengunjung saat berdiri di depan layar; peta diputar sesuai arah ini."
      />
      {row(
        <>
          <Choice
            id="ip-mode"
            label="Mode awal"
            value={allow3d ? defaultMode : '2d'}
            options={
              allow3d
                ? [
                    { value: '2d', label: '2D' },
                    { value: '3d', label: '3D' },
                  ]
                : [{ value: '2d', label: '2D' }]
            }
            onChange={setDefaultMode}
          />
          <Choice
            id="ip-language"
            label="Bahasa awal"
            value={language}
            options={[
              { value: 'id', label: 'Indonesia' },
              { value: 'en', label: 'English' },
            ]}
            onChange={setLanguage}
          />
        </>,
      )}
      {allow3d ? null : <p className="text-ink-muted text-sm">{lockedFeatureMessage('3d')}</p>}
      {row(
        <>
          <Field
            id="ip-idle"
            label="Kembali ke awal setelah (detik)"
            hint={`${INFO_POINT_IDLE_RANGE.min}–${INFO_POINT_IDLE_RANGE.max} detik tanpa sentuhan.`}
          >
            <Input
              id="ip-idle"
              inputMode="numeric"
              className="w-28 font-mono tabular-nums"
              value={idle}
              onChange={(e) => setIdle(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 self-center">
            <input
              type="checkbox"
              checked={force2d}
              onChange={(e) => setForce2d(e.target.checked)}
              className="size-4 accent-ink"
            />
            Paksa 2D (perangkat lemah)
          </label>
        </>,
      )}
      {problems.map((p) => (
        <FormNotice key={p} tone="error">
          {p}
        </FormNotice>
      ))}
      {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={save.isPending}>
          {save.isPending ? 'Menyimpan…' : 'Simpan'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function InfoPointDialog({
  venueId,
  places,
  points,
  target,
  onClose,
}: {
  venueId: VenueId;
  places: Places;
  points: readonly InfoPoint[];
  target: InfoPointDialogTarget;
  onClose: () => void;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-w-2xl">
        {target ? (
          <InfoPointForm
            key={target.point?.id ?? 'baru'}
            venueId={venueId}
            places={places}
            points={points}
            point={target.point}
            onDone={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
