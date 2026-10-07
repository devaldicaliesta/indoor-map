import {
  Button,
  type DataColumn,
  DataTable,
  EmptyState,
  type FilterDef,
  queryRows,
  StatusDot,
  Tabs,
  TabsList,
  TabsTrigger,
  withinDateRange,
} from '@indoor/ui';
import { useSearchParams } from 'react-router';
import { useTableState } from '../../hooks/use-table-state';
import { Section } from './gallery-section';

type Status = 'active' | 'coming_soon' | 'closed_temp' | 'closed';

interface Room {
  code: string;
  name: string;
  floor: string;
  status: Status;
  area: number;
  updatedAt: string;
}

const STATUS: Record<Status, { label: string; tone: 'ok' | 'warn' | 'neutral'; hollow: boolean }> =
  {
    active: { label: 'Aktif', tone: 'ok', hollow: false },
    coming_soon: { label: 'Segera buka', tone: 'warn', hollow: true },
    closed_temp: { label: 'Nonaktif sementara', tone: 'neutral', hollow: false },
    closed: { label: 'Nonaktif permanen', tone: 'neutral', hollow: true },
  };
const STATUSES = Object.keys(STATUS) as Status[];
const FLOORS = ['B1', 'GF', 'L1', 'L2', 'L3'];
const NAMES = [
  'Ruang Rapat Melati',
  'Laboratorium Kimia',
  'Kafé Lumière',
  'Toilet Difabel',
  'Apotek 24 Jam',
  'Ruang Server & Jaringan',
  'Musala',
  'Ruang Tunggu Ümum',
  'Gudang Arsip',
  'Klinik Gigi',
  'Perpustakaan Digital',
  'Ruang Laktasi',
];

// Contoh hanya untuk galeri pengembangan (tidak ikut build produksi).
const ROOMS: Room[] = Array.from({ length: 137 }, (_, i) => {
  const floor = FLOORS[i % FLOORS.length] ?? 'GF';
  return {
    code: `${floor}-${String.fromCharCode(65 + (i % 4))}${String(i + 1).padStart(2, '0')}`,
    name: `${NAMES[i % NAMES.length]}${i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : ''}`,
    floor,
    status: STATUSES[(i * 7) % STATUSES.length] ?? 'active',
    area: 12 + ((i * 37) % 180) + (i % 3) * 0.5,
    updatedAt: new Date(Date.UTC(2026, 8, 1 + (i % 37), 2 + (i % 9))).toISOString(),
  };
});

const FILTERS: FilterDef[] = [
  {
    kind: 'multi',
    key: 'status',
    label: 'Status',
    options: STATUSES.map((value) => ({ value, label: STATUS[value].label })),
  },
  {
    kind: 'select',
    key: 'lantai',
    label: 'Lantai',
    allLabel: 'Semua lantai',
    options: FLOORS.map((value) => ({ value, label: value })),
  },
  { kind: 'dateRange', key: 'diperbarui', label: 'Diperbarui' },
];

const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' });

const COLUMNS: DataColumn<Room>[] = [
  { id: 'code', header: 'Kode', cell: (r) => r.code, className: 'font-mono' },
  { id: 'name', header: 'Nama', cell: (r) => <span className="font-bold">{r.name}</span> },
  { id: 'floor', header: 'Lantai', cell: (r) => r.floor, className: 'font-mono' },
  {
    id: 'area',
    header: 'Luas (m²)',
    cell: (r) => r.area.toFixed(2),
    className: 'text-right font-mono tabular-nums',
  },
  {
    id: 'status',
    header: 'Status',
    cell: (r) => (
      <StatusDot tone={STATUS[r.status].tone} hollow={STATUS[r.status].hollow}>
        {STATUS[r.status].label}
      </StatusDot>
    ),
  },
  { id: 'updated', header: 'Diperbarui', cell: (r) => date.format(new Date(r.updatedAt)) },
];

const DEMO_STATES = ['data', 'memuat', 'galat', 'kosong'] as const;
type DemoState = (typeof DEMO_STATES)[number];

/** DataTable dengan status di URL: muat ulang atau salin URL mempertahankan cari/filter/halaman. */
export function DataTableGallery() {
  const table = useTableState({ filters: FILTERS });
  const [params, setParams] = useSearchParams();
  const demo: DemoState = DEMO_STATES.find((s) => s === params.get('keadaan')) ?? 'data';
  const result = queryRows(demo === 'kosong' ? [] : ROOMS, table.state, {
    text: (r) => [r.code, r.name],
    filters: {
      status: (r, values) => values.includes(r.status),
      lantai: (r, values) => values.includes(r.floor),
      diperbarui: (r, values) => withinDateRange(r.updatedAt, values, 'Asia/Jakarta'),
    },
  });

  return (
    <Section title="Tabel data">
      <Tabs
        value={demo}
        onValueChange={(value) =>
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              if (value === 'data') next.delete('keadaan');
              else next.set('keadaan', value);
              return next;
            },
            { replace: true },
          )
        }
      >
        <TabsList aria-label="Keadaan contoh">
          <TabsTrigger value="data">Berisi</TabsTrigger>
          <TabsTrigger value="memuat">Memuat</TabsTrigger>
          <TabsTrigger value="galat">Galat</TabsTrigger>
          <TabsTrigger value="kosong">Kosong</TabsTrigger>
        </TabsList>
      </Tabs>
      <DataTable
        label="Ruang"
        columns={COLUMNS}
        rows={demo === 'memuat' ? undefined : result.rows}
        rowKey={(r) => r.code}
        total={result.total}
        table={table}
        search={{ placeholder: 'Cari nama atau kode ruang' }}
        filters={FILTERS}
        actions={<Button variant="primary">Tambah ruang</Button>}
        error={
          demo === 'galat'
            ? 'Server tidak menjawab dalam 10 detik. Periksa koneksi, lalu coba lagi.'
            : null
        }
        onRetry={() => setParams({}, { replace: true })}
        empty={
          <EmptyState
            title="Belum ada ruang"
            description="Tambah ruang pertama, atau impor daftar ruang dari berkas CSV."
          />
        }
      />
    </Section>
  );
}
