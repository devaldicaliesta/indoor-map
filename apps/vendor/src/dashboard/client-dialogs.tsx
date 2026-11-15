import type { VendorClient } from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@indoor/ui';
import { type ChangeEvent, type ComponentProps, type FormEvent, useState } from 'react';
import { useClientActions } from './use-licenses';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Field({
  id,
  label,
  hint,
  ...props
}: { id: string; label: string; hint?: string } & ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
      {hint ? (
        <p id={`${id}-hint`} className="text-ink-muted text-sm">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AddClientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createClient } = useClientActions();
  const [form, setForm] = useState({ name: '', institution: '', email: '', phone: '' });
  const set = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    createClient.mutate(form, {
      onSuccess: () => {
        setForm({ name: '', institution: '', email: '', phone: '' });
        onClose();
      },
    });
  };
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Tambah klien</DialogTitle>
            <DialogDescription>
              Instansi pembeli lisensi on-premise. Nama instansi tercetak di berkas lisensi.
            </DialogDescription>
          </DialogHeader>
          <Field
            id="client-institution"
            label="Instansi"
            value={form.institution}
            onChange={set('institution')}
            maxLength={200}
            required
          />
          <Field
            id="client-name"
            label="Nama kontak"
            value={form.name}
            onChange={set('name')}
            maxLength={200}
            required
          />
          <Field
            id="client-email"
            label="Email kontak"
            type="email"
            value={form.email}
            onChange={set('email')}
            maxLength={254}
            required
          />
          <Field
            id="client-phone"
            label="Telepon (opsional)"
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            maxLength={40}
          />
          <DialogFooter>
            <Button type="button" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={createClient.isPending}>
              {createClient.isPending ? 'Menyimpan…' : 'Tambah klien'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddInstallationDialog({
  client,
  onClose,
}: {
  client: VendorClient | null;
  onClose: () => void;
}) {
  const { createInstallation } = useClientActions();
  const [name, setName] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const close = () => {
    setName('');
    setInstanceId('');
    setProblem(null);
    onClose();
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!client) return;
    const id = instanceId.trim();
    if (!UUID.test(id)) {
      setProblem('ID instalasi berbentuk UUID, mis. 7f3a9c10-0000-4000-8000-000000000001.');
      return;
    }
    setProblem(null);
    createInstallation.mutate(
      { clientId: client.id, instanceId: id.toLowerCase(), name },
      { onSuccess: close },
    );
  };
  return (
    <Dialog open={client !== null} onOpenChange={(next) => (next ? null : close())}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Tambah instalasi {client?.institution}</DialogTitle>
            <DialogDescription>
              ID instalasi tampil di halaman Lisensi pada Admin server klien. Lisensi hanya berlaku
              di instalasi dengan ID ini.
            </DialogDescription>
          </DialogHeader>
          <Field
            id="installation-name"
            label="Nama instalasi"
            hint="Mis. Gedung Utama atau Server Produksi."
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={200}
            required
          />
          <div className="grid gap-1">
            <Label htmlFor="installation-instance">ID instalasi</Label>
            <Input
              id="installation-instance"
              className="font-mono"
              value={instanceId}
              onChange={(event) => setInstanceId(event.target.value)}
              aria-invalid={problem ? true : undefined}
              aria-describedby={problem ? 'installation-problem' : undefined}
              required
            />
            {problem ? (
              <p id="installation-problem" className="text-danger text-sm">
                {problem}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" onClick={close}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={createInstallation.isPending}>
              {createInstallation.isPending ? 'Menyimpan…' : 'Tambah instalasi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
