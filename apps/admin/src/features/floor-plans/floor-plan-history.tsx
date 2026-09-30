import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@indoor/ui';
import type { FloorPlanVersion } from './queries';

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Versi lama tidak dihapus agar bisa dibandingkan atau diambil kembali. */
export function FloorPlanHistory({ plans }: { plans: FloorPlanVersion[] }) {
  if (plans.length === 0) return null;
  return (
    <section aria-label="Riwayat denah" className="grid gap-2">
      <h3 className="font-bold">Riwayat</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Diunggah</TableHead>
            <TableHead>Format</TableHead>
            <TableHead className="text-right">Berkas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="tabular-nums">
                {dateFormat.format(new Date(plan.createdAt))}
              </TableCell>
              <TableCell className="font-mono uppercase">
                {plan.sourceFormat}
                {plan.pdfPage ? ` · hlm ${plan.pdfPage}` : ''}
              </TableCell>
              <TableCell className="text-right">
                <a className="underline" href={plan.imageUrl} target="_blank" rel="noreferrer">
                  Lihat
                </a>
                <span className="text-ink-muted"> · </span>
                <a className="underline" href={plan.sourceUrl} target="_blank" rel="noreferrer">
                  Asli
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
