import type { VendorSummary } from '@indoor/domain';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="grid content-start gap-1 rounded-lg border border-line bg-surface p-4">
      <dt className="text-ink-muted text-sm">{label}</dt>
      <dd className="font-bold text-2xl tabular-nums">{value}</dd>
      {hint ? <dd className="text-ink-muted text-sm">{hint}</dd> : null}
    </div>
  );
}

/** Kapasitas Supabase Free dibatasi jumlah trial aktif bersamaan; antrean diproses otomatis. */
export function Summary({ summary }: { summary: VendorSummary }) {
  const full = summary.free === 0;
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Ringkasan">
      <Stat
        label="Slot trial terpakai"
        value={`${summary.active}/${summary.capacity}`}
        hint={full ? 'Penuh — pemohon baru masuk antrean' : `${summary.free} slot kosong`}
      />
      <Stat label="Antre" value={String(summary.queued)} />
      <Stat
        label="Terkunci"
        value={String(summary.locked)}
        hint="Dihapus 7 hari setelah terkunci"
      />
      <Stat label="Belum verifikasi" value={String(summary.unverified)} />
      <Stat
        label="Sudah publish sendiri"
        value={String(summary.publishedByApplicant)}
        hint="Ruang kerja dengan versi terbit > 1"
      />
      <Stat label="Total leads" value={String(summary.leads)} hint="Disimpan ≤ 12 bulan" />
    </dl>
  );
}
