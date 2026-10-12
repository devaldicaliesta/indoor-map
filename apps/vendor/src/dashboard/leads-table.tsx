import {
  extensionDaysLeft,
  hostedTrialDeleteAt,
  type LeadStage,
  leadStage,
  type TrialLead,
  trialDaysLeft,
} from '@indoor/domain';
import {
  Button,
  EmptyState,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@indoor/ui';
import { ExternalLinkIcon } from 'lucide-react';
import {
  BUILDING_SIZES,
  BUILDING_TYPES,
  formatDate,
  formatDateTime,
  REJECT_REASONS,
  STAGES,
} from '../copy';
import { visitorUrl } from '../data-client';
import type { DialogTarget } from './trial-dialogs';

const label = (labels: Record<string, string>, key: string) => labels[key] ?? key;

function Period({ lead, stage, now }: { lead: TrialLead; stage: LeadStage; now: number }) {
  const { trial } = lead;
  if (!trial)
    return <span className="text-ink-muted">Diminta {formatDateTime(lead.createdAt)}</span>;
  const extended = trial.extendedDays ? ` · diperpanjang ${trial.extendedDays} hari` : '';
  if (stage === 'active') {
    return (
      <span>
        Sisa {trialDaysLeft(trial.endsAt, now)} hari · s.d. {formatDate(trial.endsAt)}
        <span className="text-ink-muted">{extended}</span>
      </span>
    );
  }
  if (stage === 'ending') return <span>Berakhir {formatDate(trial.endsAt)}</span>;
  return (
    <span>
      Berakhir {formatDate(trial.endsAt)}
      <span className="block text-ink-muted">
        Dihapus ±{formatDate(hostedTrialDeleteAt(trial.lockedAt ?? trial.endsAt))}
      </span>
    </span>
  );
}

function Actions({
  lead,
  stage,
  onAction,
}: {
  lead: TrialLead;
  stage: LeadStage;
  onAction: (target: DialogTarget) => void;
}) {
  const { trial } = lead;
  if (!trial) return null;
  const open = (kind: DialogTarget['kind']) => () => onAction({ kind, lead, trial });
  const running = stage === 'active' || stage === 'ending';
  return (
    <div className="flex flex-wrap gap-2">
      {running && trial.slug ? (
        <Button asChild size="sm" variant="ghost">
          <a href={`${visitorUrl}/v/${trial.slug}`} target="_blank" rel="noreferrer">
            Visitor <ExternalLinkIcon aria-hidden="true" />
          </a>
        </Button>
      ) : null}
      {running && extensionDaysLeft(trial) > 0 ? (
        <Button size="sm" onClick={open('extend')}>
          Perpanjang
        </Button>
      ) : null}
      {running ? (
        <Button size="sm" onClick={open('lock')}>
          Kunci
        </Button>
      ) : null}
      {stage !== 'deleting' ? (
        <Button size="sm" variant="danger" onClick={open('delete')}>
          Hapus
        </Button>
      ) : null}
    </div>
  );
}

export function LeadsTable({
  leads,
  now,
  empty,
  onAction,
}: {
  leads: readonly TrialLead[];
  now: number;
  empty: string;
  onAction: (target: DialogTarget) => void;
}) {
  if (leads.length === 0) {
    return <EmptyState title="Belum ada" description={empty} />;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Instansi dan pemohon</TableHead>
            <TableHead>Gedung</TableHead>
            <TableHead>Tahap</TableHead>
            <TableHead>Masa trial</TableHead>
            <TableHead>Publish</TableHead>
            <TableHead>
              <span className="sr-only">Tindakan</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const stage = leadStage(lead, now);
            return (
              <TableRow key={lead.id} data-testid="lead-row">
                <TableCell className="align-top">
                  <span className="block font-bold">{lead.institution}</span>
                  <span className="block">
                    {lead.name} · {lead.title}
                  </span>
                  <a className="block underline underline-offset-4" href={`mailto:${lead.email}`}>
                    {lead.email}
                  </a>
                  <a className="block text-ink-muted" href={`tel:${lead.phone.replace(/\s/g, '')}`}>
                    {lead.phone}
                  </a>
                </TableCell>
                <TableCell className="align-top">
                  <span className="block">{label(BUILDING_TYPES, lead.buildingType)}</span>
                  <span className="block text-ink-muted">
                    {label(BUILDING_SIZES, lead.buildingSize)}
                  </span>
                </TableCell>
                <TableCell className="align-top">
                  <StatusDot tone={STAGES[stage].tone}>{STAGES[stage].label}</StatusDot>
                  {lead.rejectReason ? (
                    <span className="block text-ink-muted">
                      {REJECT_REASONS[lead.rejectReason]}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="align-top">
                  <Period lead={lead} stage={stage} now={now} />
                </TableCell>
                <TableCell className="align-top tabular-nums">
                  {lead.trial ? (
                    <>
                      <span className="block">Versi {lead.trial.publishedVersions}</span>
                      {lead.trial.lastPublishedAt ? (
                        <span className="block text-ink-muted">
                          {formatDate(lead.trial.lastPublishedAt)}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Actions lead={lead} stage={stage} onAction={onAction} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
