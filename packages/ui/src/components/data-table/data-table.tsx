import type { ComponentProps, ReactNode } from 'react';
import { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../button';
import { Skeleton } from '../skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table';
import { TablePagination } from './table-pagination';
import { clampPage, type FilterDef, hasActiveFilters, type TableController } from './table-state';
import { TableToolbar } from './table-toolbar';

export interface DataColumn<Row> {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  /** Kelas sel judul dan isi, mis. `text-right` untuk angka. */
  className?: string;
}

export interface DataTableProps<Row> {
  /** Nama data di tabel (mis. "Lokasi"): nama tabel, kolom cari, dan pesan kosong. */
  label: string;
  columns: readonly DataColumn<Row>[];
  /** Baris halaman ini; `undefined` selama data pertama dimuat. */
  rows: readonly Row[] | undefined;
  rowKey: (row: Row) => string;
  /** Jumlah semua baris yang cocok dengan cari dan filter (bukan hanya halaman ini). */
  total: number;
  table: TableController;
  search?: { placeholder: string } | false;
  filters?: readonly FilterDef[];
  /** Tombol di kanan toolbar, mis. "Tambah lokasi". */
  actions?: ReactNode;
  /** Sedang memuat data baru; baris lama tetap tampil samar sampai data baru tiba. */
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Keadaan kosong saat belum ada data sama sekali, dengan arahan langkah berikutnya. */
  empty: ReactNode;
  /** Atribut tambahan baris, mis. seret-lepas untuk mengubah urutan. */
  rowProps?: (row: Row) => Omit<ComponentProps<'tr'>, 'children'>;
  /** Jumlah baris kerangka saat memuat pertama kali. */
  skeletonRows?: number;
}

/**
 * Tabel data Admin: cari, filter, dan pagination dengan pola yang sama di semua halaman.
 * Data bisa disaring di klien (`queryRows`) atau di server (`listPage` di `@indoor/data`);
 * keadaan cari/filter/halaman datang dari `table` (disimpan di URL oleh `useTableState`).
 */
export function DataTable<Row>({
  label,
  columns,
  rows,
  rowKey,
  total,
  table,
  search = false,
  filters = [],
  actions,
  loading = false,
  error = null,
  onRetry,
  empty,
  rowProps,
  skeletonRows = 5,
}: DataTableProps<Row>) {
  const { page, size } = table.state;
  const settled = rows !== undefined && !loading && !error;
  const setPage = table.setPage;
  // Halaman di luar jangkauan (URL lama, baris terakhir dihapus) pindah ke halaman terakhir.
  useEffect(() => {
    if (settled && page !== clampPage(page, total, size)) setPage(clampPage(page, total, size));
  }, [settled, page, total, size, setPage]);

  const filtered = hasActiveFilters(table.state);
  const header = (
    <TableHeader>
      <TableRow>
        {columns.map((column) => (
          <TableHead key={column.id} className={column.className}>
            {column.header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );

  let body: ReactNode;
  if (error) {
    body = (
      <div
        role="alert"
        className="grid justify-items-start gap-2 border-danger border-l-4 bg-surface p-4"
      >
        <p className="font-bold">Data {label.toLowerCase()} tidak bisa dimuat.</p>
        <p className="text-ink-muted">{error}</p>
        {onRetry ? <Button onClick={onRetry}>Coba lagi</Button> : null}
      </div>
    );
  } else if (rows === undefined) {
    body = (
      <Table aria-label={label} aria-busy="true">
        {header}
        <TableBody>
          {Array.from({ length: skeletonRows }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: baris kerangka tanpa data.
            <TableRow key={i}>
              {columns.map((column) => (
                <TableCell key={column.id}>
                  <Skeleton className="h-4 w-full max-w-40" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else if (total === 0 && !filtered) {
    body = empty;
  } else if (total === 0) {
    body = (
      <div className="grid justify-items-start gap-2 border border-line border-dashed bg-surface p-(--panel-padding)">
        <p className="font-bold">Tidak ada {label.toLowerCase()} yang cocok.</p>
        <p className="text-ink-muted">Ubah kata kunci atau filter, atau hapus semua filter.</p>
        <Button onClick={table.clearFilters}>Hapus filter</Button>
      </div>
    );
  } else {
    body = (
      <Table aria-label={label} aria-busy={loading || undefined}>
        {header}
        <TableBody className={cn(loading && 'opacity-60')}>
          {rows.map((row) => (
            <TableRow key={rowKey(row)} {...rowProps?.(row)}>
              {columns.map((column) => (
                <TableCell key={column.id} className={column.className}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  const state = error ? 'error' : rows === undefined || loading ? 'loading' : 'ready';
  return (
    <div
      data-slot="data-table"
      data-label={label}
      data-state={state}
      data-total={total}
      className="grid gap-3"
    >
      <TableToolbar
        table={table}
        label={label}
        search={search}
        filters={filters}
        actions={actions}
      />
      {body}
      {!error && rows !== undefined && total > 0 ? (
        <TablePagination table={table} label={label} total={total} />
      ) : null}
    </div>
  );
}
