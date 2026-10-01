import { type ClosureTarget, type VenueId, validateClosureInput } from '@indoor/domain';
import { closureImpact } from '@indoor/routing';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton,
  toast,
} from '@indoor/ui';
import { type FormEvent, useMemo, useState } from 'react';
import { Field } from '../../app/components/field';
import { FormNotice } from '../auth/auth-layout';
import { useClosureDialog } from './closure-dialog-store';
import { fromVenueInput, impactText, targetLabel, toVenueInput } from './closure-model';
import {
  useClosureMutations,
  useClosureNetwork,
  useCurrentClosures,
  useVenueTimezone,
} from './queries';

function ClosureForm({
  venueId,
  timezone,
  target,
  onDone,
}: {
  venueId: VenueId;
  timezone: string;
  target: ClosureTarget;
  onDone: () => void;
}) {
  const network = useClosureNetwork(venueId);
  const existing = useCurrentClosures(venueId).data ?? [];
  const { create } = useClosureMutations(venueId);
  const [reason, setReason] = useState('');
  const [starts, setStarts] = useState(() => toVenueInput(new Date().toISOString(), timezone));
  const [ends, setEnds] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const startsAt = fromVenueInput(starts, timezone) ?? '';
  const endsAt = ends ? (fromVenueInput(ends, timezone) ?? '') : null;
  const errors = validateClosureInput({ reason, startsAt, endsAt });
  const closure = useMemo(
    () => ({
      id: 'baru',
      featureId: target.kind === 'feature' ? target.id : null,
      edgeId: target.kind === 'edge' ? target.id : null,
      connectorId: target.kind === 'connector' ? target.id : null,
      startsAt: startsAt || new Date().toISOString(),
      endsAt: null,
    }),
    [target, startsAt],
  );
  // Penutupan lain dinilai pada awal penutupan baru: yang berlaku saat itu ikut memperparah.
  const impacts = useMemo(
    () =>
      network
        ? closureImpact(network.routeGraph, closure, existing, Date.parse(closure.startsAt))
        : null,
    [network, closure, existing],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    create.mutate(
      { target, reason, startsAt, endsAt },
      {
        onSuccess: () => {
          toast.success('Penutupan disimpan');
          onDone();
        },
      },
    );
  }

  const shown = submitted ? errors : {};
  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>Tutup sementara</DialogTitle>
        <DialogDescription>
          {network ? targetLabel(network.places, target) : 'Memuat…'}. Berlaku langsung di Visitor
          tanpa publish.
        </DialogDescription>
      </DialogHeader>
      <Field id="closure-reason" label="Alasan" error={shown.reason}>
        <Input
          id="closure-reason"
          value={reason}
          maxLength={200}
          placeholder="Misalnya: perawatan berkala"
          aria-invalid={shown.reason ? true : undefined}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="closure-starts" label="Mulai" error={shown.startsAt}>
          <Input
            id="closure-starts"
            type="datetime-local"
            value={starts}
            onChange={(e) => setStarts(e.target.value)}
          />
        </Field>
        <Field
          id="closure-ends"
          label="Selesai (opsional)"
          hint="Kosong = sampai diakhiri."
          error={shown.endsAt}
        >
          <Input
            id="closure-ends"
            type="datetime-local"
            value={ends}
            onChange={(e) => setEnds(e.target.value)}
          />
        </Field>
      </div>
      <section aria-live="polite" className="grid gap-1">
        <h3 className="font-bold text-sm">Dampak</h3>
        {impacts === null ? (
          <Skeleton className="h-5 w-2/3" />
        ) : impacts.length === 0 ? (
          <p className="text-ink-muted text-sm">Semua lantai tetap bisa dicapai.</p>
        ) : (
          <ul className="grid gap-1 text-sm">
            {impacts.map((impact) => (
              <li key={impact.floorId} className="text-danger">
                {network ? impactText(network.places, impact) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      {create.error ? <FormNotice tone="error">{create.error.message}</FormNotice> : null}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={create.isPending}>
          {create.isPending ? 'Menyimpan…' : 'Simpan penutupan'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Dialog penutupan baru; dipasang sekali di halaman Penutupan dan di editor. */
export function ClosureDialog({ venueId }: { venueId: VenueId }) {
  const timezone = useVenueTimezone(venueId);
  const target = useClosureDialog((s) => s.target);
  const close = useClosureDialog((s) => s.close);
  return (
    <Dialog open={target !== null} onOpenChange={(open) => (open ? null : close())}>
      <DialogContent>
        {target ? (
          <ClosureForm
            key={`${target.kind}:${target.id}`}
            venueId={venueId}
            timezone={timezone}
            target={target}
            onDone={close}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
