import { parseBlockValue } from '@indoor/domain';
import { Button, Input, Label, Skeleton } from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { formatDate } from '../copy';
import { useBlockActions, useBlocklist } from './use-vendor';

const PROBLEMS = {
  invalid: 'Isi alamat email atau domain, mis. nama@contoh.co.id atau contoh.co.id.',
  public_domain: 'Domain email umum tidak bisa diblokir; blokir alamat emailnya.',
} as const;

/** Email atau domain yang ditolak saat verifikasi trial; tidak mengubah trial yang sudah berjalan. */
export function BlocklistPanel() {
  const entries = useBlocklist();
  const { block, unblock } = useBlockActions();
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseBlockValue(value);
    if (!parsed.ok) {
      setProblem(PROBLEMS[parsed.problem]);
      return;
    }
    setProblem(null);
    block.mutate(
      { value: parsed.value, note },
      {
        onSuccess: () => {
          setValue('');
          setNote('');
        },
      },
    );
  };

  return (
    <section className="grid content-start gap-4" aria-labelledby="blocklist-title">
      <div className="grid gap-1">
        <h2 id="blocklist-title" className="font-bold text-lg">
          Daftar blokir
        </h2>
        <p className="text-ink-muted">
          Permintaan trial dari email atau domain ini ditolak saat verifikasi. Trial yang sudah
          berjalan tidak berubah — kunci atau hapus dari daftar trial.
        </p>
      </div>
      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={submit}>
        <div className="grid gap-1">
          <Label htmlFor="block-value">Email atau domain</Label>
          <Input
            id="block-value"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={problem ? true : undefined}
            aria-describedby={problem ? 'block-problem' : undefined}
            required
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="block-note">Catatan (opsional)</Label>
          <Input
            id="block-note"
            value={note}
            maxLength={200}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
        <Button type="submit" variant="primary" disabled={block.isPending}>
          Blokir
        </Button>
        {problem ? (
          <p id="block-problem" role="alert" className="text-danger sm:col-span-3">
            {problem}
          </p>
        ) : null}
      </form>
      {entries.isPending ? <Skeleton className="h-16" /> : null}
      {entries.data && entries.data.length === 0 ? (
        <p className="text-ink-muted">Belum ada yang diblokir.</p>
      ) : null}
      {entries.data && entries.data.length > 0 ? (
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {entries.data.map((entry) => (
            <li key={entry.value} className="flex flex-wrap items-center gap-3 p-3">
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="break-all font-bold">{entry.value}</span>
                <span className="text-ink-muted text-sm">
                  {entry.kind === 'email' ? 'Email' : 'Domain'} · {formatDate(entry.createdAt)}
                  {entry.note ? ` · ${entry.note}` : ''}
                </span>
              </span>
              <Button
                size="sm"
                disabled={unblock.isPending}
                onClick={() => unblock.mutate(entry.value)}
              >
                Buka blokir
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
