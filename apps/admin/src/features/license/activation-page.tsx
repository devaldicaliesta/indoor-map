import type { LicenseState } from '@indoor/data';
import { EULA_VERSION, needsEulaAcceptance } from '@indoor/domain';
import { TRIAL_MIN_DAYS } from '@indoor/domain/license';
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
import { EulaConsent } from './eula-consent';
import { FirstAdminForm } from './first-admin-form';
import {
  useActivateManual,
  useActivateOnline,
  useEulaStatus,
  useLicenseStatus,
  useStartTrial,
} from './queries';
import { VendorEmail } from './vendor-email';

const STATE_NOTICE: Record<Exclude<LicenseState, 'active'>, string> = {
  missing: 'Instalasi ini belum diaktifkan.',
  not_yet_valid: 'Lisensi terpasang belum berlaku.',
  expired: 'Lisensi sudah kedaluwarsa. Pasang lisensi baru untuk melanjutkan.',
  revoked: 'Lisensi dicabut vendor. Hubungi vendor lalu pasang lisensi baru.',
  grace: 'Lisensi sudah berakhir dan sedang dalam masa tenggang.',
  clock_behind:
    'Jam server mundur lebih dari 24 jam dari waktu yang pernah tercatat, jadi lisensi tidak berlaku. Perbaiki jam server (sinkronkan dengan NTP); lisensi berlaku lagi setelah jam benar.',
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
      <p className="text-ink-muted text-sm">
        Lisensi diterbitkan vendor untuk ID ini. Kirim ID ini ke <VendorEmail /> untuk meminta
        lisensi.
      </p>
    </div>
  );
}

/**
 * Persetujuan EULA untuk form pemasangan: `version` dikirim ke server bila baru disetujui;
 * `blocked` selama persetujuan diminta tetapi belum dicentang.
 */
interface EulaChoice {
  version: string | undefined;
  blocked: boolean;
}

function OnlineForm({ eula }: { eula: EulaChoice }) {
  const activate = useActivateOnline();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const key = String(new FormData(event.currentTarget).get('license-key') ?? '').trim();
    activate.mutate(
      { licenseKey: key, eulaVersion: eula.version },
      {
        onSuccess: (license) => toast.success('Lisensi aktif', { description: license.client }),
      },
    );
  }
  return (
    <form className="grid gap-3" onSubmit={submit}>
      <div className="grid gap-1">
        <Label htmlFor="license-key">Kunci lisensi</Label>
        <Input id="license-key" name="license-key" required autoComplete="off" />
      </div>
      {activate.error ? <FormNotice tone="error">{activate.error.message}</FormNotice> : null}
      <Button type="submit" variant="primary" disabled={activate.isPending || eula.blocked}>
        {activate.isPending ? 'Menghubungi vendor…' : 'Aktifkan'}
      </Button>
    </form>
  );
}

function ManualForm({ eula }: { eula: EulaChoice }) {
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
    activate.mutate(
      { license, eulaVersion: eula.version },
      {
        onSuccess: (result) => toast.success('Lisensi aktif', { description: result.client }),
      },
    );
  }
  const error = fileError ?? activate.error?.message ?? null;
  return (
    <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
      <div className="grid gap-1">
        <Label htmlFor="license-file">Berkas lisensi (.json)</Label>
        <Input id="license-file" name="license-file" type="file" accept=".json,application/json" />
      </div>
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      <Button type="submit" variant="primary" disabled={activate.isPending || eula.blocked}>
        {activate.isPending ? 'Memeriksa…' : 'Pasang lisensi'}
      </Button>
    </form>
  );
}

/**
 * Trial otomatis (T-504): nama, instansi, dan email diteruskan ke server vendor yang langsung
 * menerbitkan lisensi trial untuk ID instalasi ini. Satu trial per instalasi, email, dan domain.
 */
function TrialForm({ eula }: { eula: EulaChoice }) {
  const start = useStartTrial();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) ?? '').trim();
    start.mutate(
      {
        name: field('trial-name'),
        institution: field('trial-institution'),
        email: field('trial-email'),
        eulaVersion: eula.version,
      },
      {
        onSuccess: (license) =>
          toast.success('Trial aktif', {
            description: `${license.client} · ${TRIAL_MIN_DAYS} hari`,
          }),
      },
    );
  }
  return (
    <form className="grid gap-3" onSubmit={submit}>
      <p className="text-ink-muted text-sm">
        Coba semua fitur selama {TRIAL_MIN_DAYS} hari dengan batas data trial (1 venue, 2 gedung, 6
        lantai, 300 lokasi, 5 pengguna). Data tetap ada saat lisensi berbayar dipasang.
      </p>
      <div className="grid gap-1">
        <Label htmlFor="trial-name">Nama</Label>
        <Input id="trial-name" name="trial-name" required maxLength={200} autoComplete="name" />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="trial-institution">Instansi</Label>
        <Input
          id="trial-institution"
          name="trial-institution"
          required
          maxLength={200}
          autoComplete="organization"
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="trial-email">Email</Label>
        <Input
          id="trial-email"
          name="trial-email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
        />
      </div>
      {start.error ? <FormNotice tone="error">{start.error.message}</FormNotice> : null}
      <Button type="submit" variant="primary" disabled={start.isPending || eula.blocked}>
        {start.isPending ? 'Meminta trial ke vendor…' : `Mulai trial ${TRIAL_MIN_DAYS} hari`}
      </Button>
      <p className="text-ink-muted text-sm">
        Server tanpa internet: kirim ID instalasi di atas beserta nama dan instansi ke{' '}
        <VendorEmail /> dengan judul "Permintaan trial". Vendor mengirim berkas lisensi trial untuk
        dipasang di tab Unggah berkas.
      </p>
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
  const eulaStatus = useEulaStatus();
  const profile = useCurrentProfile();
  const navigate = useNavigate();
  const [eulaAccepted, setEulaAccepted] = useState(false);

  if (status.isPending || eulaStatus.isPending || profile.isPending) {
    return (
      <AuthLayout title="Aktivasi" description="Memeriksa lisensi…">
        <Skeleton className="h-24" />
      </AuthLayout>
    );
  }
  if (status.isError || eulaStatus.isError) {
    return (
      <AuthLayout title="Aktivasi" description="Status lisensi tidak bisa dibaca.">
        <FormNotice tone="error">{(status.error ?? eulaStatus.error)?.message}</FormNotice>
      </AuthLayout>
    );
  }
  const { state, instanceId, needsAdmin, isTrial } = status.data;
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
  const eulaRequired = needsEulaAcceptance(eulaStatus.data);
  const eula: EulaChoice = {
    version: eulaRequired && eulaAccepted ? EULA_VERSION : undefined,
    blocked: eulaRequired && !eulaAccepted,
  };
  return (
    <AuthLayout
      title={state === 'active' ? 'Pasang lisensi baru' : 'Aktivasi instalasi'}
      description="Mulai trial, masukkan kunci lisensi dari vendor, atau unggah berkas lisensi bila server ini tidak bisa menghubungi vendor."
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
      {canInstall && eulaRequired ? (
        <EulaConsent accepted={eulaAccepted} onAcceptedChange={setEulaAccepted} />
      ) : null}
      {canInstall ? (
        <Tabs defaultValue={state === 'missing' ? 'trial' : 'online'}>
          <TabsList>
            {isTrial && state === 'active' ? null : (
              <TabsTrigger value="trial">Mulai trial</TabsTrigger>
            )}
            <TabsTrigger value="online">Kunci lisensi</TabsTrigger>
            <TabsTrigger value="manual">Unggah berkas</TabsTrigger>
          </TabsList>
          <TabsContent value="trial" className="pt-3">
            <TrialForm eula={eula} />
          </TabsContent>
          <TabsContent value="online" className="pt-3">
            <OnlineForm eula={eula} />
          </TabsContent>
          <TabsContent value="manual" className="pt-3">
            <ManualForm eula={eula} />
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
