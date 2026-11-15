import type { VendorInstallation } from '@indoor/domain';
import {
  licenseIssueDefaults,
  type VendorLicense,
  type VendorLicenseStatus,
} from '@indoor/domain/license-issue';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@indoor/ui';
import { DownloadIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { formatDate, formatDateTime } from '../copy';
import { LicenseForm } from './license-form';
import { downloadLicense, useLicenseActions, useLicenses } from './use-licenses';

const STATUS: Record<
  VendorLicenseStatus,
  { label: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' }
> = {
  active: { label: 'Berlaku', tone: 'ok' },
  expired: { label: 'Berakhir', tone: 'warn' },
  superseded: { label: 'Digantikan', tone: 'neutral' },
  revoked: { label: 'Dicabut', tone: 'danger' },
};

const todayInJakarta = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

function RevokeConfirm({
  license,
  pending,
  onCancel,
  onConfirm,
}: {
  license: VendorLicense;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="revoke-title"
      className="grid gap-3 rounded-lg border border-danger p-4"
    >
      <p id="revoke-title" className="font-bold">
        Cabut lisensi {license.licenseId}?
      </p>
      <p className="text-ink-muted text-sm">
        Lisensi ditandai dicabut di portal dan tidak bisa diaktifkan kembali. Instalasi yang sudah
        memasangnya baru menolak lisensi ini saat check-in ke server vendor.
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel}>
          Batal
        </Button>
        <Button type="button" variant="danger" disabled={pending} onClick={onConfirm}>
          {pending ? 'Mencabut…' : 'Cabut lisensi'}
        </Button>
      </div>
    </div>
  );
}

function LicenseHistory({
  licenses,
  onRevoke,
}: {
  licenses: VendorLicense[];
  onRevoke: (license: VendorLicense) => void;
}) {
  if (licenses.length === 0) {
    return <p className="text-ink-muted">Belum ada lisensi untuk instalasi ini.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID lisensi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paket</TableHead>
            <TableHead>Masa berlaku</TableHead>
            <TableHead>Diterbitkan</TableHead>
            <TableHead>
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenses.map((license) => (
            <TableRow key={license.id}>
              <TableCell className="font-mono text-xs">{license.licenseId}</TableCell>
              <TableCell>
                <StatusDot tone={STATUS[license.status].tone}>
                  {STATUS[license.status].label}
                </StatusDot>
              </TableCell>
              <TableCell>{license.plan}</TableCell>
              <TableCell>
                {formatDate(license.validFrom)} – {formatDate(license.validUntil)}
              </TableCell>
              <TableCell>
                {formatDateTime(license.issuedAt)}
                {license.issuedByEmail ? (
                  <span className="block text-ink-muted text-sm">{license.issuedByEmail}</span>
                ) : null}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    onClick={() => downloadLicense(license.file)}
                    aria-label={`Unduh ${license.licenseId}`}
                  >
                    <DownloadIcon aria-hidden="true" /> Unduh
                  </Button>
                  {license.status === 'active' ? (
                    <Button size="sm" variant="danger" onClick={() => onRevoke(license)}>
                      Cabut
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LicensePanel({ installation }: { installation: VendorInstallation }) {
  const licenses = useLicenses(installation.id);
  const { issue, revoke } = useLicenseActions(installation.id);
  const [issuing, setIssuing] = useState(false);
  const [revoking, setRevoking] = useState<VendorLicense | null>(null);
  const today = todayInJakarta();
  const current = licenses.data?.find((license) => license.status !== 'superseded') ?? null;
  const hasLicense = (licenses.data?.length ?? 0) > 0;

  if (licenses.isError) {
    return (
      <p role="alert" className="border-danger border-l-4 bg-surface py-2 pl-3 text-danger">
        Riwayat lisensi tidak bisa dimuat.
      </p>
    );
  }
  if (!licenses.data) return <Skeleton className="h-32" />;

  return (
    <div className="grid gap-5">
      {issuing ? (
        <LicenseForm
          installationId={installation.id}
          defaults={licenseIssueDefaults(current?.file ?? null, today)}
          today={today}
          pending={issue.isPending}
          onSubmit={(request) => issue.mutate(request, { onSuccess: () => setIssuing(false) })}
          onCancel={() => setIssuing(false)}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-ink-muted text-sm">
            Perpanjang atau ubah paket dengan menerbitkan lisensi baru; lisensi lama otomatis
            digantikan.
          </p>
          <Button variant="primary" className="ml-auto" onClick={() => setIssuing(true)}>
            <PlusIcon aria-hidden="true" />
            {hasLicense ? 'Terbitkan lisensi baru' : 'Terbitkan lisensi'}
          </Button>
        </div>
      )}
      {revoking ? (
        <RevokeConfirm
          license={revoking}
          pending={revoke.isPending}
          onCancel={() => setRevoking(null)}
          onConfirm={() =>
            revoke.mutate(
              { id: revoking.id, licenseId: revoking.licenseId },
              { onSettled: () => setRevoking(null) },
            )
          }
        />
      ) : null}
      <LicenseHistory licenses={licenses.data} onRevoke={setRevoking} />
    </div>
  );
}

export function LicenseDialog({
  installation,
  onClose,
}: {
  installation: VendorInstallation | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={installation !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
        {installation ? (
          <>
            <DialogHeader>
              <DialogTitle>
                Lisensi {installation.clientName} · {installation.name}
              </DialogTitle>
              <DialogDescription>
                ID instalasi <span className="font-mono">{installation.instanceId}</span>. Berkas
                lisensi ditandatangani server vendor dan dipasang Super Admin klien di halaman
                Lisensi.
              </DialogDescription>
            </DialogHeader>
            <LicensePanel key={installation.id} installation={installation} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
