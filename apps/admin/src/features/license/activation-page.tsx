import type { LicenseState } from '@indoor/data';
import {
  Button,
  Input,
  Label,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useCurrentProfile } from '../../app/auth/current-profile';
import { AuthLayout, FormNotice } from '../auth/auth-layout';
import { FirstAdminForm } from './first-admin-form';
import { useActivateManual, useActivateOnline, useLicenseStatus } from './queries';

const STATE_NOTICE: Record<Exclude<LicenseState, 'active'>, string> = {
  missing: 'Instalasi ini belum diaktifkan.',
  not_yet_valid: 'Lisensi terpasang belum berlaku.',
  expired: 'Lisensi sudah kedaluwarsa. Pasang lisensi baru untuk melanjutkan.',
  revoked: 'Lisensi dicabut vendor. Hubungi vendor lalu pasang lisensi baru.',
};

function InstanceId({ value }: { value: string }) {
  return (
    <div className="grid gap-1">
      <span className="font-bold text-sm">ID instalasi</span>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-sm bg-canvas px-2 py-1 font-mono text-sm">
          {value}
        </code>
        <Button
          type="button"
          onClick={() =>
            void navigator.clipboard
              .writeText(value)
              .then(() => toast.success('ID instalasi disalin'))
              .catch(() => toast.error('ID tidak bisa disalin; salin manual dari kotak.'))
          }
        >
          Salin
        </Button>
      </div>
      <p className="text-ink-muted text-sm">Lisensi diterbitkan vendor untuk ID ini.</p>
    </div>
  );
}

function OnlineForm() {
  const activate = useActivateOnline();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const key = String(new FormData(event.currentTarget).get('license-key') ?? '').trim();
    activate.mutate(key, {
      onSuccess: (license) => toast.success('Lisensi aktif', { description: license.client }),
    });
  }
  return (
    <form className="grid gap-3" onSubmit={submit}>
      <div className="grid gap-1">
        <Label htmlFor="license-key">Kunci lisensi</Label>
        <Input id="license-key" name="license-key" required autoComplete="off" />
      </div>
      {activate.error ? <FormNotice tone="error">{activate.error.message}</FormNotice> : null}
      <Button type="submit" variant="primary" disabled={activate.isPending}>
        {activate.isPending ? 'Menghubungi vendor…' : 'Aktifkan'}
      </Button>
    </form>
  );
}

function ManualForm() {
  const activate = useActivateManual();
  const [fileError, setFileError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFileError(null);
    const file = new FormData(event.currentTarget).get('license-file');
    if (!(file instanceof File) || file.size === 0) return setFileError('Pilih berkas lisensi.');
    if (file.size > 64 * 1024) return setFileError('Berkas terlalu besar untuk berkas lisensi.');
    let license: unknown;
    try {
      license = JSON.parse(await file.text());
    } catch {
      return setFileError('Berkas bukan lisensi (JSON) dari vendor.');
    }
    activate.mutate(license, {
      onSuccess: (result) => toast.success('Lisensi aktif', { description: result.client }),
    });
  }
  const error = fileError ?? activate.error?.message ?? null;
  return (
    <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
      <div className="grid gap-1">
        <Label htmlFor="license-file">Berkas lisensi (.json)</Label>
        <Input id="license-file" name="license-file" type="file" accept=".json,application/json" />
      </div>
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      <Button type="submit" variant="primary" disabled={activate.isPending}>
        {activate.isPending ? 'Memeriksa…' : 'Pasang lisensi'}
      </Button>
    </form>
  );
}

/**
 * Aktivasi instalasi: kunci lisensi ke vendor (online) atau unggah berkas (cadangan), lalu
 * Super Admin pertama pada instalasi baru. Setelah ada Super Admin, hanya Super Admin yang
 * memasang lisensi; server menegakkan aturan yang sama.
 */
export function ActivationPage() {
  const status = useLicenseStatus();
  const profile = useCurrentProfile();
  const navigate = useNavigate();

  if (status.isPending || profile.isPending) {
    return (
      <AuthLayout title="Aktivasi" description="Memeriksa lisensi…">
        <Skeleton className="h-24" />
      </AuthLayout>
    );
  }
  if (status.error) {
    return (
      <AuthLayout title="Aktivasi" description="Status lisensi tidak bisa dibaca.">
        <FormNotice tone="error">{status.error.message}</FormNotice>
      </AuthLayout>
    );
  }
  const { state, instanceId, needsAdmin } = status.data;
  const isSuperAdmin = profile.data?.role === 'super_admin';

  if (state === 'active' && needsAdmin) {
    return (
      <AuthLayout
        title="Buat Super Admin pertama"
        description="Lisensi aktif. Akun ini mengelola pengguna, pengaturan sistem, dan lisensi."
      >
        <FirstAdminForm onCreated={() => navigate('/', { replace: true })} />
      </AuthLayout>
    );
  }
  if (state === 'active' && !isSuperAdmin) return <Navigate to="/" replace />;

  const canInstall = needsAdmin || isSuperAdmin;
  return (
    <AuthLayout
      title={state === 'active' ? 'Pasang lisensi baru' : 'Aktivasi instalasi'}
      description="Masukkan kunci lisensi dari vendor, atau unggah berkas lisensi bila server ini tidak bisa menghubungi vendor."
    >
      {state === 'active' ? (
        <FormNotice tone="info">
          Lisensi berlaku.{' '}
          <Link to="/" className="font-bold underline">
            Kembali ke Admin
          </Link>
        </FormNotice>
      ) : (
        <FormNotice tone="info">{STATE_NOTICE[state]}</FormNotice>
      )}
      <InstanceId value={instanceId} />
      {canInstall ? (
        <Tabs defaultValue="online">
          <TabsList>
            <TabsTrigger value="online">Kunci lisensi</TabsTrigger>
            <TabsTrigger value="manual">Unggah berkas</TabsTrigger>
          </TabsList>
          <TabsContent value="online" className="pt-3">
            <OnlineForm />
          </TabsContent>
          <TabsContent value="manual" className="pt-3">
            <ManualForm />
          </TabsContent>
        </Tabs>
      ) : (
        <p>
          Hanya Super Admin yang bisa memasang lisensi.{' '}
          <Link to="/login" className="font-bold underline underline-offset-4">
            Masuk sebagai Super Admin
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
