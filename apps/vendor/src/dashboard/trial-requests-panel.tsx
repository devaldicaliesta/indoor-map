import { TRIAL_MAX_DAYS, TRIAL_MIN_DAYS } from '@indoor/domain/license';
import {
  ONPREM_TRIAL_DEFAULT_DAYS,
  type OnPremTrialStatus,
  trialApprovalDaysProblem,
  type VendorTrialRequest,
} from '@indoor/domain/onprem-trial';
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
  Skeleton,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@indoor/ui';
import { CheckIcon, XIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { formatDateTime } from '../copy';
import { useTrialDecisions, useTrialRequests } from './use-trial-requests';

const STATUS: Record<OnPremTrialStatus, { label: string; tone: 'ok' | 'warn' | 'danger' }> = {
  pending: { label: 'Menunggu', tone: 'warn' },
  approved: { label: 'Disetujui', tone: 'ok' },
  rejected: { label: 'Ditolak', tone: 'danger' },
};

type Decision = { kind: 'approve' | 'reject'; request: VendorTrialRequest };

function Outcome({ request }: { request: VendorTrialRequest }) {
  const when = request.status === 'pending' ? request.createdAt : request.decidedAt;
  return (
    <>
      <StatusDot tone={STATUS[request.status].tone}>{STATUS[request.status].label}</StatusDot>
      <span className="block text-ink-muted text-sm">{when ? formatDateTime(when) : '–'}</span>
      {request.decidedByEmail ? (
        <span className="block text-ink-muted text-sm">{request.decidedByEmail}</span>
      ) : null}
      {request.rejectReason ? (
        <span className="block text-ink-muted text-sm">Alasan: {request.rejectReason}</span>
      ) : null}
    </>
  );
}

function RequestsTable({
  requests,
  onDecide,
}: {
  requests: VendorTrialRequest[];
  onDecide: (decision: Decision) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Instansi dan pemohon</TableHead>
            <TableHead>ID instalasi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-ink-muted">
                Belum ada permintaan trial dari instalasi on-premise.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <span className="block font-medium">{request.institution}</span>
                  <span className="block text-ink-muted text-sm">{request.name}</span>
                  <span className="block text-ink-muted text-sm">{request.email}</span>
                </TableCell>
                <TableCell className="font-mono text-xs">{request.instanceId}</TableCell>
                <TableCell>
                  <Outcome request={request} />
                </TableCell>
                <TableCell>
                  {request.status === 'pending' ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        aria-label={`Setujui trial ${request.institution}`}
                        onClick={() => onDecide({ kind: 'approve', request })}
                      >
                        <CheckIcon aria-hidden="true" /> Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        aria-label={`Tolak trial ${request.institution}`}
                        onClick={() => onDecide({ kind: 'reject', request })}
                      >
                        <XIcon aria-hidden="true" /> Tolak
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ApproveForm({
  request,
  pending,
  onSubmit,
}: {
  request: VendorTrialRequest;
  pending: boolean;
  onSubmit: (days: number) => void;
}) {
  const [days, setDays] = useState(String(ONPREM_TRIAL_DEFAULT_DAYS));
  const problem = trialApprovalDaysProblem(Number(days));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!problem) onSubmit(Number(days));
  };
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>Setujui trial {request.institution}?</DialogTitle>
        <DialogDescription>
          Lisensi trial untuk instalasi <span className="font-mono">{request.instanceId}</span>{' '}
          ditandatangani dan dikirim ke {request.email}. Klien dan instalasinya dicatat otomatis.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-1">
        <Label htmlFor="trial-days">Lama trial (hari)</Label>
        <Input
          id="trial-days"
          type="number"
          min={TRIAL_MIN_DAYS}
          max={TRIAL_MAX_DAYS}
          value={days}
          onChange={(event) => setDays(event.target.value)}
          aria-describedby="trial-days-hint"
          required
        />
        <p id="trial-days-hint" className="text-ink-muted text-sm">
          {problem ?? `${TRIAL_MIN_DAYS}–${TRIAL_MAX_DAYS} hari, mulai hari ini.`}
        </p>
      </div>
      <DialogFooter>
        <Button type="submit" variant="primary" disabled={problem !== null || pending}>
          {pending ? 'Menerbitkan…' : 'Setujui dan kirim lisensi'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function RejectForm({
  request,
  pending,
  onSubmit,
}: {
  request: VendorTrialRequest;
  pending: boolean;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (reason.trim()) onSubmit(reason.trim());
  };
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>Tolak trial {request.institution}?</DialogTitle>
        <DialogDescription>
          Alasan dikirim ke {request.email}. Pemohon bisa mengajukan lagi dari halaman Aktivasi.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-1">
        <Label htmlFor="reject-reason">Alasan penolakan</Label>
        <Input
          id="reject-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit" variant="danger" disabled={!reason.trim() || pending}>
          {pending ? 'Menolak…' : 'Tolak permintaan'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TrialRequestsPanel() {
  const requests = useTrialRequests();
  const { approve, reject } = useTrialDecisions();
  const [decision, setDecision] = useState<Decision | null>(null);
  const close = () => setDecision(null);
  const pendingCount = requests.data?.filter((r) => r.status === 'pending').length ?? 0;

  return (
    <section className="grid gap-4" aria-labelledby="trial-requests-title">
      <div className="grid gap-1">
        <h3 id="trial-requests-title" className="font-semibold text-lg">
          Permintaan trial on-premise{pendingCount > 0 ? ` (${pendingCount} menunggu)` : ''}
        </h3>
        <p className="text-ink-muted text-sm">
          Diajukan Super Admin klien dari halaman Aktivasi. Setujui untuk menerbitkan lisensi trial
          dan mengirimkannya lewat email.
        </p>
      </div>
      {requests.isError ? (
        <p role="alert" className="border-danger border-l-4 bg-surface py-2 pl-3 text-danger">
          Permintaan trial tidak bisa dimuat.
        </p>
      ) : requests.data ? (
        <RequestsTable requests={requests.data} onDecide={setDecision} />
      ) : (
        <Skeleton className="h-32" />
      )}
      <Dialog open={decision !== null} onOpenChange={(open) => (open ? null : close())}>
        <DialogContent>
          {decision?.kind === 'approve' ? (
            <ApproveForm
              key={decision.request.id}
              request={decision.request}
              pending={approve.isPending}
              onSubmit={(days) =>
                approve.mutate(
                  { id: decision.request.id, days, email: decision.request.email },
                  { onSuccess: close },
                )
              }
            />
          ) : null}
          {decision?.kind === 'reject' ? (
            <RejectForm
              key={decision.request.id}
              request={decision.request}
              pending={reject.isPending}
              onSubmit={(reason) =>
                reject.mutate(
                  { id: decision.request.id, reason, email: decision.request.email },
                  { onSuccess: close },
                )
              }
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
