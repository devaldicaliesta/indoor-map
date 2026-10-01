import {
  CONNECTOR_KINDS,
  type Connector,
  checkConnector,
  type EscalatorDirection,
  type Floor,
  type Position,
  sortFloorsTopDown,
  type VenueId,
} from '@indoor/domain';
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  toast,
} from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { Field } from '../../../app/components/field';
import { FormNotice } from '../../auth/auth-layout';
import { useEditorStore } from '../store/editor-store';
import { useConnectorDialog } from './connector-dialog-store';
import {
  CONNECTOR_KIND_LABELS,
  CONNECTOR_PROBLEM_MESSAGES,
  type ConnectorForm,
  changeKind,
  defaultName,
  type FormPlace,
  formDraft,
  initialForm,
} from './connector-form';
import { useConnectorMutations, useVenueFloors } from './queries';

function FloorSelect({
  id,
  value,
  floors,
  onChange,
}: {
  id: string;
  value: string | null;
  floors: readonly Floor[];
  onChange: (id: string) => void;
}) {
  return (
    <Select value={value ?? ''} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Pilih lantai" />
      </SelectTrigger>
      <SelectContent>
        {floors.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FloorFields({
  form,
  place,
  update,
}: {
  form: ConnectorForm;
  place: FormPlace;
  update: (patch: Partial<ConnectorForm>) => void;
}) {
  const { floor, floors } = place;
  const building = sortFloorsTopDown(
    floors.filter((f) => !f.isOutdoor && f.buildingId === floor.buildingId),
  );
  if (form.kind === 'elevator') {
    return (
      <fieldset className="grid gap-1">
        <legend className="mb-1 font-bold text-sm">Lantai yang dilayani</legend>
        {building.map((f) => (
          <label key={f.id} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="size-4 accent-ink"
              checked={f.id === floor.id || form.liftFloors.includes(f.id)}
              disabled={f.id === floor.id}
              onChange={(e) =>
                update({
                  liftFloors: e.target.checked
                    ? [...form.liftFloors, f.id]
                    : form.liftFloors.filter((id) => id !== f.id),
                })
              }
            />
            <span className="font-mono">{f.name}</span>
            {f.id === floor.id ? <span className="text-ink-muted text-sm">lantai ini</span> : null}
          </label>
        ))}
      </fieldset>
    );
  }
  if (form.kind === 'escalator') {
    const other = floors.find((f) => f.id === form.otherFloor);
    const [low, high] = other && other.level < floor.level ? [other, floor] : [floor, other];
    const directions: [EscalatorDirection, string][] = [
      ['up', high ? `Naik: ${low?.name} → ${high.name}` : 'Naik'],
      ['down', high ? `Turun: ${high.name} → ${low?.name}` : 'Turun'],
      ['both', 'Dua arah'],
    ];
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="connector-other" label="Lantai lain">
          <FloorSelect
            id="connector-other"
            value={form.otherFloor}
            floors={building.filter((f) => f.id !== floor.id)}
            onChange={(id) => update({ otherFloor: id })}
          />
        </Field>
        <Field id="connector-direction" label="Arah">
          <Select
            value={form.direction ?? ''}
            onValueChange={(value) => update({ direction: value as EscalatorDirection })}
          >
            <SelectTrigger id="connector-direction">
              <SelectValue placeholder="Pilih arah" />
            </SelectTrigger>
            <SelectContent>
              {directions.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    );
  }
  if (form.kind === 'stairs') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="connector-from" label="Lantai terbawah">
          <FloorSelect
            id="connector-from"
            value={form.stairsFrom}
            floors={building.filter((f) => f.level <= floor.level)}
            onChange={(id) => update({ stairsFrom: id })}
          />
        </Field>
        <Field id="connector-to" label="Lantai teratas">
          <FloorSelect
            id="connector-to"
            value={form.stairsTo}
            floors={building.filter((f) => f.level >= floor.level)}
            onChange={(id) => update({ stairsTo: id })}
          />
        </Field>
      </div>
    );
  }
  if (!floor.isOutdoor) {
    return <p className="text-sm">Menghubungkan lantai {floor.name} dengan Area Luar.</p>;
  }
  const options = floors.filter((f) => !f.isOutdoor);
  const label = (f: Floor) =>
    `${place.buildings.find((b) => b.id === f.buildingId)?.name ?? 'Gedung'} · ${f.name}`;
  return (
    <Field id="connector-door" label="Lantai gedung">
      <Select value={form.doorFloor ?? ''} onValueChange={(id) => update({ doorFloor: id })}>
        <SelectTrigger id="connector-door">
          <SelectValue placeholder="Pilih gedung dan lantai" />
        </SelectTrigger>
        <SelectContent>
          {options.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {label(f)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function ConnectorFormBody({
  venueId,
  place,
  position,
  connector,
}: {
  venueId: VenueId;
  place: FormPlace;
  position: Position;
  connector: Connector | null;
}) {
  const close = useConnectorDialog((s) => s.close);
  const { save } = useConnectorMutations(venueId);
  const [form, setForm] = useState(() => initialForm(connector, place));
  const [error, setError] = useState<string>();
  const update = (patch: Partial<ConnectorForm>) =>
    setForm((current) => {
      const next = { ...current, ...patch };
      return patch.doorFloor && !current.nameTouched
        ? { ...next, name: defaultName(next.kind, place, patch.doorFloor) }
        : next;
    });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft = formDraft(form, place);
    const problem = checkConnector(draft, place.floors)[0];
    setError(problem ? CONNECTOR_PROBLEM_MESSAGES[problem] : undefined);
    if (problem) return;
    save.mutate(
      {
        input: { ...draft, id: connector?.id ?? crypto.randomUUID(), position },
        previous: connector,
      },
      {
        onSuccess: (stops) => {
          toast.success(connector ? 'Konektor disimpan' : 'Konektor ditambahkan', {
            description: draft.name.trim(),
          });
          const nodeId = stops.find((s) => s.floorId === place.floor.id)?.nodeId;
          if (!connector && nodeId) {
            const store = useEditorStore.getState();
            store.setTool('select');
            store.selectGraph({ kind: 'node', id: nodeId });
          }
          close();
        },
      },
    );
  }

  const kinds = place.floor.isOutdoor ? (['building_door'] as const) : CONNECTOR_KINDS;
  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <div className="grid gap-1">
        <Label>Jenis</Label>
        <div role="radiogroup" aria-label="Jenis konektor" className="flex flex-wrap gap-1">
          {kinds.map((kind) => (
            // biome-ignore lint/a11y/useSemanticElements: tombol segmen, bukan radio bawaan browser
            <button
              key={kind}
              type="button"
              role="radio"
              aria-checked={form.kind === kind}
              onClick={() => setForm((current) => changeKind(current, kind, place))}
              className={cn(
                'cursor-pointer rounded-sm border border-line px-3 py-1.5 hover:bg-canvas',
                form.kind === kind && 'border-ink bg-ink font-bold text-on-strong hover:bg-ink',
              )}
            >
              {CONNECTOR_KIND_LABELS[kind]}
            </button>
          ))}
        </div>
      </div>
      <Field id="connector-name" label="Nama">
        <Input
          id="connector-name"
          value={form.name}
          onChange={(e) => update({ name: e.target.value, nameTouched: true })}
        />
      </Field>
      <FloorFields form={form} place={place} update={update} />
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-ink"
          checked={form.accessible}
          onChange={(e) => update({ accessible: e.target.checked, accessibleTouched: true })}
        />
        <span>
          <span className="font-bold">Bisa dilalui kursi roda</span>
          <span className="block text-ink-muted text-sm">
            Rute aksesibel hanya memakai konektor yang ditandai.
          </span>
        </span>
      </label>
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={close}>
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={save.isPending}>
          {save.isPending ? 'Menyimpan…' : connector ? 'Simpan konektor' : 'Tambah konektor'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Dialog konektor baru (posisi dari alat Konektor) atau ubah konektor dari pemberhentiannya. */
export function ConnectorDialog({ venueId, floor }: { venueId: VenueId; floor: Floor }) {
  const open = useConnectorDialog((s) => s.open);
  const close = useConnectorDialog((s) => s.close);
  const places = useVenueFloors(venueId);
  if (!open) return null;
  return (
    <Dialog open onOpenChange={(value) => !value && close()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {open.connector ? `Ubah ${open.connector.name}` : 'Konektor baru'}
          </DialogTitle>
          <DialogDescription>
            Node konektor dibuat di posisi yang sama pada setiap lantai yang dihubungkan; sambungkan
            ke jalur dengan alat Jalur di tiap lantai.
          </DialogDescription>
        </DialogHeader>
        {places.data ? (
          <ConnectorFormBody
            key={open.connector?.id ?? 'baru'}
            venueId={venueId}
            place={{ floor, floors: places.data.floors, buildings: places.data.buildings }}
            position={open.position}
            connector={open.connector}
          />
        ) : (
          <Skeleton className="h-48" />
        )}
      </DialogContent>
    </Dialog>
  );
}
