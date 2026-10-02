import { Button } from '@indoor/ui';
import { LockIcon } from 'lucide-react';
import { useState } from 'react';
import type { EditLockState } from './use-edit-lock';

const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' });

/** "Sedang diedit oleh X sejak 10.12": editor dalam mode baca; Super Admin bisa ambil alih. */
export function LockBanner({
  state,
  canTakeOver,
  onTakeOver,
}: {
  state: EditLockState;
  canTakeOver: boolean;
  onTakeOver: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (state.status === 'error') {
    return (
      <div role="alert" className="border-line border-b bg-surface px-4 py-2 text-danger text-sm">
        Kunci lantai tidak bisa diambil: {state.error.message} Editor dalam mode baca.
      </div>
    );
  }
  if (state.status !== 'other') return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 border-line border-b bg-surface px-4 py-2 text-sm"
    >
      <LockIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
      <span>
        Sedang diedit oleh <strong>{state.lock.fullName}</strong> sejak{' '}
        {time.format(new Date(state.lock.startedAt))}. Lantai ini dalam mode baca.
      </span>
      {canTakeOver ? (
        <Button
          size="sm"
          className="ml-auto"
          disabled={pending}
          onClick={() => {
            setPending(true);
            setError(null);
            onTakeOver()
              .catch((e: Error) => setError(e.message))
              .finally(() => setPending(false));
          }}
        >
          Ambil alih kunci
        </Button>
      ) : null}
      {error ? <span className="basis-full text-danger">{error}</span> : null}
    </div>
  );
}
