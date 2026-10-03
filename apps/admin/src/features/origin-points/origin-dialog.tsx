import type { OriginPoint, Position, VenueId } from '@indoor/domain';
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
import { type FormEvent, useState } from 'react';
import { Field } from '../../app/components/field';
import { FormNotice } from '../auth/auth-layout';
import { floorLabel } from '../closures/closure-model';
import type { useVenueFloors } from '../editor/connectors/queries';
import { HeadingField } from './heading-field';
import { OriginMap } from './origin-map';
import { useSavedGraph, useSaveOriginPoint } from './queries';

type Places = NonNullable<ReturnType<typeof useVenueFloors>['data']>;

/** `null` = titik baru; selain itu titik yang diubah. */
export type OriginDialogTarget = { point: OriginPoint | null } | null;

function OriginForm({
  venueId,
  places,
  points,
  point,
  onDone,
}: {
  venueId: VenueId;
  places: Places;
  points: readonly OriginPoint[];
  point: OriginPoint | null;
  onDone: () => void;
}) {
  const graph = useSavedGraph(venueId).data;
  const save = useSaveOriginPoint(venueId);
  const [name, setName] = useState(point?.name ?? '');
  const [floorId, setFloorId] = useState(point?.floorId ?? places.floors[0]?.id ?? '');
  const [position, setPosition] = useState<Position | null>(point?.coordinates ?? null);
  const [heading, setHeading] = useState(point?.headingDeg ?? 0);
  const [problem, setProblem] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return setProblem('Nama wajib diisi.');
    if (!floorId || !position) return setProblem('Klik peta untuk meletakkan titik asal.');
    setProblem(null);
    save.mutate(
      { id: point?.id ?? null, floorId, name, position, headingDeg: heading },
      {
        onSuccess: () => {
          toast.success('Titik asal disimpan dan ditempelkan ke jalur');
          onDone();
        },
      },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>{point ? 'Ubah titik asal' : 'Tambah titik asal'}</DialogTitle>
        <DialogDescription>
          Klik peta di tempat QR dipasang. Titik ditempelkan ke jalur terdekat saat disimpan.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <Field id="origin-name" label="Nama">
          <Input
            id="origin-name"
            value={name}
            maxLength={80}
            placeholder="Misalnya: Lobi Utama"
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field id="origin-floor" label="Gedung dan lantai">
          <Select
            value={floorId}
            onValueChange={(id) => {
              setFloorId(id);
              setPosition(null);
            }}
          >
            <SelectTrigger id="origin-floor">
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
      </div>
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
        id="origin-heading"
        value={heading}
        onChange={setHeading}
        hint="Arah yang dihadapi orang saat memindai QR; garis di peta menunjukkannya."
      />
      {problem ? <FormNotice tone="error">{problem}</FormNotice> : null}
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

export function OriginDialog({
  venueId,
  places,
  points,
  target,
  onClose,
}: {
  venueId: VenueId;
  places: Places;
  points: readonly OriginPoint[];
  target: OriginDialogTarget;
  onClose: () => void;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-w-2xl">
        {target ? (
          <OriginForm
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
