import {
  type LeadStage,
  leadStage,
  leadsCsv,
  summarizeLeads,
  type TrialLead,
} from '@indoor/domain';
import { BrandLogo, Button, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@indoor/ui';
import { DownloadIcon, LogOutIcon, RefreshCwIcon } from 'lucide-react';
import { useState } from 'react';
import { CSV_LABELS } from '../copy';
import { useIdleSignOut } from '../idle-sign-out';
import { BlocklistPanel } from './blocklist-panel';
import { LeadsTable } from './leads-table';
import { Summary } from './summary';
import { type DialogTarget, TrialDialog } from './trial-dialogs';
import { useCapacity, useLeads, useTrialAction } from './use-vendor';

const TABS: { id: string; label: string; stages: readonly LeadStage[] | null; empty: string }[] = [
  { id: 'active', label: 'Aktif', stages: ['active', 'ending'], empty: 'Tidak ada trial aktif.' },
  { id: 'queued', label: 'Antre', stages: ['queued'], empty: 'Tidak ada pemohon dalam antrean.' },
  {
    id: 'locked',
    label: 'Terkunci',
    stages: ['locked', 'deleting'],
    empty: 'Tidak ada trial yang menunggu dihapus.',
  },
  { id: 'all', label: 'Semua leads', stages: null, empty: 'Belum ada permintaan trial.' },
];

/** Leads untuk spreadsheet; BOM agar Excel membaca UTF-8 (nama dengan aksen, m²). */
function downloadCsv(leads: readonly TrialLead[], now: number) {
  const blob = new Blob(['﻿', leadsCsv(leads, CSV_LABELS, now)], {
    type: 'text/csv;charset=utf-8',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `leads-panduarah-${new Date(now).toISOString().slice(0, 10)}.csv`;
  link.click();
  // Dicabut setelah peramban mulai mengunduh; mencabut seketika bisa membatalkan unduhan.
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export function DashboardPage({
  onSignOut,
  onIdle,
}: {
  onSignOut: () => void;
  onIdle: () => void;
}) {
  useIdleSignOut(onIdle);
  const leads = useLeads();
  const capacity = useCapacity();
  const action = useTrialAction();
  const [target, setTarget] = useState<DialogTarget | null>(null);
  const now = leads.dataUpdatedAt || Date.now();

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex items-center gap-3 border-line border-b bg-surface px-4 py-3">
        <BrandLogo className="h-8" />
        <span className="text-ink-muted text-sm">Vendor</span>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onSignOut}>
          <LogOutIcon aria-hidden="true" /> Keluar
        </Button>
      </header>
      <main className="mx-auto grid max-w-7xl gap-8 p-4 md:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <h1 className="font-bold text-2xl">Trial ter-hosting</h1>
            <p className="text-ink-muted">Kapasitas, trial berjalan, dan leads calon klien.</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button size="sm" onClick={() => void leads.refetch()} disabled={leads.isFetching}>
              <RefreshCwIcon aria-hidden="true" /> Muat ulang
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!leads.data}
              onClick={() => leads.data && downloadCsv(leads.data, Date.now())}
            >
              <DownloadIcon aria-hidden="true" /> Ekspor leads (CSV)
            </Button>
          </div>
        </div>

        {leads.isError ? (
          <p role="alert" className="border-danger border-l-4 bg-surface py-2 pl-3 text-danger">
            {leads.error instanceof Error ? leads.error.message : 'Leads tidak bisa dimuat.'}
          </p>
        ) : null}
        {leads.data && capacity.data !== undefined ? (
          <Summary summary={summarizeLeads(leads.data, capacity.data)} />
        ) : (
          <Skeleton className="h-24" />
        )}

        {leads.data ? (
          <Tabs defaultValue="active">
            <TabsList className="overflow-x-auto">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label} ({filter(leads.data, tab.stages, now).length})
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                <LeadsTable
                  leads={filter(leads.data, tab.stages, now)}
                  now={now}
                  empty={tab.empty}
                  onAction={setTarget}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Skeleton className="h-64" />
        )}

        <BlocklistPanel />
      </main>
      <TrialDialog
        target={target}
        pending={action.isPending}
        onClose={() => setTarget(null)}
        onConfirm={(trialAction) =>
          action.mutate(trialAction, { onSettled: () => setTarget(null) })
        }
      />
    </div>
  );
}

function filter(leads: readonly TrialLead[], stages: readonly LeadStage[] | null, now: number) {
  return stages ? leads.filter((lead) => stages.includes(leadStage(lead, now))) : leads;
}
