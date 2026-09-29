import { Input } from '@indoor/ui';
import { type ComponentProps, useState } from 'react';

/**
 * Input yang menyimpan saat Enter atau keluar fokus (bukan tiap ketikan), agar satu
 * perubahan = satu penyimpanan draft. `onCommit` boleh mengembalikan pesan galat.
 */
export function CommitInput({
  value,
  onCommit,
  errorId,
  ...props
}: Omit<ComponentProps<typeof Input>, 'value' | 'onChange'> & {
  value: string;
  onCommit: (value: string) => Promise<string | null> | string | null | undefined;
  errorId?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function commit() {
    if (draft === null || draft === value) {
      setDraft(null);
      return;
    }
    setBusy(true);
    const result = (await onCommit(draft)) ?? null;
    setBusy(false);
    setError(result);
    if (!result) setDraft(null);
  }

  return (
    <div className="grid gap-1">
      <Input
        {...props}
        value={draft ?? value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && errorId ? errorId : undefined}
        disabled={props.disabled || busy}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void commit();
          if (e.key === 'Escape') {
            setDraft(null);
            setError(null);
          }
        }}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
