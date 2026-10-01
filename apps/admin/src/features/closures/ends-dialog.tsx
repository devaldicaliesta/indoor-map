import type { Closure, VenueId } from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
} from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { Field } from '../../app/components/field';
import { FormNotice } from '../auth/auth-layout';
import { fromVenueInput, toVenueInput } from './closure-model';
import { useClosureMutations, useVenueTimezone } from './queries';

function EndsForm({
  venueId,
  timezone,
  closure,
  onDone,
}: {
  venueId: VenueId;
  timezone: string;
  closure: Closure;
  onDone: () => void;
}) {
  const { setEndsAt } = useClosureMutations(venueId);
  const [ends, setEnds] = useState(() =>
    closure.endsAt ? toVenueInput(closure.endsAt, timezone) : '',
  );
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const endsAt = ends ? fromVenueInput(ends, timezone) : null;
    if (ends && !endsAt) return setError('Waktu selesai tidak valid.');
    if (endsAt && Date.parse(endsAt) <= Math.max(Date.parse(closure.startsAt), Date.now())) {
      return setError('Waktu selesai harus setelah sekarang dan setelah waktu mulai.');
    }
    setEndsAt.mutate(
      { id: closure.id, endsAt },
      {
        onSuccess: () => {
          toast.success('Waktu selesai diubah');
          onDone();
        },
      },
    );
  }

  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>Ubah waktu selesai</DialogTitle>
      </DialogHeader>
      <Field
        id="closure-new-ends"
        label="Selesai"
        hint="Kosong = sampai diakhiri."
        error={error ?? undefined}
      >
        <Input
          id="closure-new-ends"
          type="datetime-local"
          value={ends}
          onChange={(e) => setEnds(e.target.value)}
        />
      </Field>
      {setEndsAt.error ? <FormNotice tone="error">{setEndsAt.error.message}</FormNotice> : null}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={setEndsAt.isPending}>
          Simpan
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EndsDialog({
  venueId,
  closure,
  onClose,
}: {
  venueId: VenueId;
  closure: Closure | null;
  onClose: () => void;
}) {
  const timezone = useVenueTimezone(venueId);
  return (
    <Dialog open={closure !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        {closure ? (
          <EndsForm
            key={closure.id}
            venueId={venueId}
            timezone={timezone}
            closure={closure}
            onDone={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
