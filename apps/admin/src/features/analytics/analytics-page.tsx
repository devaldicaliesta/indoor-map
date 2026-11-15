import {
  ANALYTICS_KIND_LABELS,
  ANALYTICS_KINDS,
  type AnalyticsKind,
  type AnalyticsSection,
  type AnalyticsSummary,
  type AnalyticsTrendDay,
  analyticsCsv,
  localDate,
  summarizeAnalytics,
  type VenueId,
  type VenueSummary,
} from '@indoor/domain';
import {
  Button,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@indoor/ui';
import { DownloadIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { FormNotice } from '../auth/auth-layout';
import { useVenueTimezone } from '../closures/queries';
import { analyticsPdf } from './analytics-pdf';
import { keyLabeler, useAnalyticsFacts, useLatestSnapshot } from './queries';

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const SECTIONS: { metric: string; title: string; empty: string }[] = [
  { metric: 'location', title: 'Lokasi teratas', empty: 'Belum ada lokasi yang dibuka.' },
  { metric: 'search', title: 'Pencarian teratas', empty: 'Belum ada pencarian.' },
  {
    metric: 'search_empty',
    title: 'Pencarian tanpa hasil',
    empty: 'Semua pencarian menemukan hasil.',
  },
  { metric: 'route_to', title: 'Tujuan rute teratas', empty: 'Belum ada rute.' },
  { metric: 'info_point', title: 'Pemakaian per Info Point', empty: 'Belum ada pemakaian.' },
  { metric: 'origin_qr', title: 'Pemindaian per QR titik asal', empty: 'Belum ada pemindaian.' },
  { metric: 'source', title: 'Sumber kunjungan', empty: 'Belum ada kunjungan.' },
  { metric: 'language', title: 'Bahasa', empty: 'Belum ada data.' },
  { metric: 'device', title: 'Perangkat', empty: 'Belum ada data.' },
];

function shiftDay(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

function save(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

const number = new Intl.NumberFormat('id-ID');

function Sparkbars({ trend, kind }: { trend: AnalyticsTrendDay[]; kind: AnalyticsKind }) {
  const max = Math.max(1, ...trend.map((d) => d[kind]));
  const width = 100 / Math.max(trend.length, 1);
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-12 w-full" aria-hidden="true">
      {trend.map((day, i) => {
        const height = (day[kind] / max) * 30;
        return (
          <rect
            key={day.day}
            x={i * width + width * 0.15}
            y={32 - height}
            width={width * 0.7}
            height={height}
            className="fill-ink"
          />
        );
      })}
    </svg>
  );
}

function Totals({ summary }: { summary: AnalyticsSummary }) {
  return (
    <ul className="grid grid-cols-4 gap-3">
      {ANALYTICS_KINDS.map((kind) => (
        <li key={kind}>
          <section
            aria-label={ANALYTICS_KIND_LABELS[kind]}
            className="grid gap-1 rounded-md border border-line bg-surface p-4"
          >
            <h2 className="text-ink-muted text-sm">{ANALYTICS_KIND_LABELS[kind]}</h2>
            <p className="font-bold font-mono text-2xl tabular-nums" data-testid={`total-${kind}`}>
              {number.format(summary.totals[kind])}
            </p>
            <Sparkbars trend={summary.trend} kind={kind} />
          </section>
        </li>
      ))}
    </ul>
  );
}

function TrendTable({ summary }: { summary: AnalyticsSummary }) {
  return (
    <details className="rounded-md border border-line bg-surface p-4">
      <summary className="cursor-pointer font-bold">Tren harian</summary>
      <table className="mt-3 w-full text-sm">
        <caption className="sr-only">Tren harian</caption>
        <thead>
          <tr className="text-left text-ink-muted">
            <th className="py-1 font-normal">Tanggal</th>
            {ANALYTICS_KINDS.map((kind) => (
              <th key={kind} className="py-1 text-right font-normal">
                {ANALYTICS_KIND_LABELS[kind]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {summary.trend.map((day) => (
            <tr key={day.day} className="border-line border-t">
              <td className="py-1">{day.day}</td>
              {ANALYTICS_KINDS.map((kind) => (
                <td key={kind} className="py-1 text-right">
                  {number.format(day[kind])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function Ranked({ section, empty }: { section: AnalyticsSection; empty: string }) {
  const max = Math.max(1, ...section.rows.map((r) => r.count));
  return (
    <section
      aria-label={section.title}
      className="grid content-start gap-2 rounded-md border border-line bg-surface p-4"
    >
      <h2 className="font-bold">{section.title}</h2>
      {section.rows.length ? (
        <ol className="grid gap-1.5">
          {section.rows.map((row) => (
            <li key={row.label} className="grid gap-0.5">
              <span className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 [overflow-wrap:anywhere]">{row.label}</span>
                <span className="font-mono tabular-nums">{number.format(row.count)}</span>
              </span>
              <span aria-hidden="true" className="h-1 rounded-full bg-canvas">
                <span
                  className="block h-1 rounded-full bg-ink"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-ink-muted text-sm">{empty}</p>
      )}
    </section>
  );
}

function Dashboard({ venue }: { venue: VenueSummary }) {
  const venueId = venue.id as VenueId;
  const timezone = useVenueTimezone(venueId);
  const [range, setRange] = useState<Range>(30);
  const to = localDate(new Date(), timezone);
  const from = shiftDay(to, -(range - 1));
  const facts = useAnalyticsFacts(venueId, from, to);
  const snapshot = useLatestSnapshot(venueId).data ?? null;
  const label = useMemo(() => keyLabeler(snapshot), [snapshot]);
  const summary = useMemo(
    () => summarizeAnalytics(facts.data ?? [], from, to),
    [facts.data, from, to],
  );
  const sections = useMemo<AnalyticsSection[]>(
    () =>
      SECTIONS.map(({ metric, title }) => ({
        title,
        rows: summary
          .ranked(metric)
          .map((row) => ({ label: label(metric, row.key), count: row.count })),
      })),
    [summary, label],
  );
  const title = `Analitik ${venue.name}`;
  const filename = `analitik-${from}-${to}`;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1 text-sm">
          <span id="analytics-range" className="font-bold">
            Periode
          </span>
          <Select value={String(range)} onValueChange={(v) => setRange(Number(v) as Range)}>
            <SelectTrigger className="w-44" aria-labelledby="analytics-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((days) => (
                <SelectItem key={days} value={String(days)}>
                  {days} hari terakhir
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="pb-2 text-ink-muted text-sm">
          {from} s.d. {to} ({timezone})
        </p>
        <div className="ml-auto flex gap-2">
          <Button
            disabled={!facts.data}
            onClick={() =>
              save(
                new Blob([`﻿${analyticsCsv(summary, sections)}`], {
                  type: 'text/csv;charset=utf-8',
                }),
                `${filename}.csv`,
              )
            }
          >
            <DownloadIcon aria-hidden="true" strokeWidth={1.75} />
            Export CSV
          </Button>
          <Button
            disabled={!facts.data}
            onClick={() => {
              const pdf = analyticsPdf(title, summary, sections);
              const bytes = Uint8Array.from(pdf, (ch) => ch.charCodeAt(0));
              save(new Blob([bytes], { type: 'application/pdf' }), `${filename}.pdf`);
            }}
          >
            <DownloadIcon aria-hidden="true" strokeWidth={1.75} />
            Export PDF
          </Button>
        </div>
      </div>
      {facts.error ? <FormNotice tone="error">{facts.error.message}</FormNotice> : null}
      {facts.isPending ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <Totals summary={summary} />
          <TrendTable summary={summary} />
          <div className="grid grid-cols-3 gap-3">
            {sections.map((section, i) => (
              <Ranked
                key={section.title}
                section={section}
                empty={SECTIONS[i]?.empty ?? 'Belum ada data.'}
              />
            ))}
          </div>
          <p className="text-ink-muted text-sm">
            Data anonim: tanpa alamat IP, identitas, atau perangkat pengunjung. Data mentah disimpan
            90 hari; ringkasan harian disimpan 2 tahun.
          </p>
        </>
      )}
    </div>
  );
}

export function AnalyticsPage() {
  const { venue } = useSelectedVenue();
  return (
    <ModuleRoute module="analytics">
      {(access) => (
        <ModulePage module="analytics" access={access}>
          {venue ? (
            <Dashboard key={venue.id} venue={venue} />
          ) : (
            <EmptyState
              title="Belum ada venue"
              description="Buat venue di menu Venue untuk melihat analitik pemakaian."
            />
          )}
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
