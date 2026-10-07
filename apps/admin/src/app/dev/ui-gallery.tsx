import {
  Badge,
  Button,
  contrastRatio,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
  WCAG_AA_TEXT,
} from '@indoor/ui';
import { MoreHorizontalIcon, PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BrandGallery } from './gallery-brand';
import { DataTableGallery } from './gallery-data-table';
import { Section } from './gallery-section';

const TOKENS = [
  'ink',
  'ink-muted',
  'line',
  'surface',
  'canvas',
  'signal',
  'signal-soft',
  'route',
  'danger',
  'ok',
  'warn',
  'on-strong',
] as const;

// Pasangan teks/latar yang dipakai komponen; rasio dihitung dari CSS yang sedang aktif.
const TEXT_PAIRS: [string, string][] = [
  ['ink', 'surface'],
  ['ink', 'canvas'],
  ['ink', 'signal'],
  ['ink', 'signal-soft'],
  ['ink-muted', 'surface'],
  ['ink-muted', 'canvas'],
  ['on-strong', 'danger'],
  ['on-strong', 'route'],
  ['surface', 'ink'],
  ['danger', 'surface'],
  ['ok', 'surface'],
];

const SURFACES = ['admin', 'visitor', 'info-point'] as const;

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

function ContrastTable() {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    setValues(Object.fromEntries(TOKENS.map((t) => [t, readToken(t)])));
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Teks</TableHead>
          <TableHead>Latar</TableHead>
          <TableHead>Contoh</TableHead>
          <TableHead className="text-right">Rasio</TableHead>
          <TableHead>WCAG AA</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {TEXT_PAIRS.map(([fg, bg]) => {
          const ratio = values[fg] && values[bg] ? contrastRatio(values[fg], values[bg]) : null;
          const pass = ratio !== null && ratio >= WCAG_AA_TEXT;
          return (
            <TableRow key={`${fg}-${bg}`}>
              <TableCell className="font-mono">--{fg}</TableCell>
              <TableCell className="font-mono">--{bg}</TableCell>
              <TableCell>
                <span
                  className="rounded-sm px-2 py-1"
                  style={{ color: `var(--${fg})`, background: `var(--${bg})` }}
                >
                  Ruang Rapat · L1-023
                </span>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {ratio === null ? '–' : `${ratio.toFixed(2)}:1`}
              </TableCell>
              <TableCell>
                <StatusDot tone={pass ? 'ok' : 'danger'}>{pass ? 'Lolos' : 'Gagal'}</StatusDot>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function UiGalleryPage() {
  const [surface, setSurface] = useState<(typeof SURFACES)[number]>('admin');

  return (
    <TooltipProvider>
      <main className="mx-auto grid max-w-5xl gap-6 p-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-bold text-xl">Sistem desain</h1>
            <p className="text-ink-muted">
              Token dan komponen dari <span className="font-mono">@indoor/ui</span>. Hanya tersedia
              saat pengembangan.
            </p>
          </div>
          <div className="grid w-48 gap-1">
            <Label htmlFor="surface">Permukaan</Label>
            <Select value={surface} onValueChange={(v) => setSurface(v as typeof surface)}>
              <SelectTrigger id="surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="visitor">Visitor</SelectItem>
                <SelectItem value="info-point">Info Point</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <div data-surface={surface} className="grid gap-6 font-sans text-body">
          <BrandGallery />
          <Section title="Token warna">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TOKENS.map((t) => (
                <div key={t} className="flex items-center gap-2 rounded-sm bg-surface p-2">
                  <span
                    className="size-8 shrink-0 rounded-sm border border-line"
                    style={{ background: `var(--${t})` }}
                  />
                  <span className="font-mono text-xs">--{t}</span>
                </div>
              ))}
            </div>
            <ContrastTable />
          </Section>

          <Section title="Tipografi">
            <div className="grid gap-1 bg-surface p-4">
              <p className="text-2xl font-bold">32 · Judul besar</p>
              <p className="text-xl font-bold">24 · Judul halaman</p>
              <p className="text-lg font-bold">20 · Judul bagian</p>
              <p className="text-base">16 · Teks Visitor</p>
              <p className="text-sm">14 · Teks Admin</p>
              <p className="text-xs text-ink-muted">12 · Keterangan</p>
              <p className="font-mono">L1-023 · -6.1754, 106.8272</p>
            </div>
          </Section>

          <Section title="Tombol">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary">Publish</Button>
              <Button>Validasi</Button>
              <Button variant="ghost">Batal</Button>
              <Button variant="danger">Hapus fitur</Button>
              <Button variant="link">Lihat riwayat</Button>
              <Button size="sm">Kecil</Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" aria-label="Tambah lantai">
                    <PlusIcon strokeWidth={1.75} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tambah lantai</TooltipContent>
              </Tooltip>
              <Button disabled>Nonaktif</Button>
            </div>
          </Section>

          <Section title="Form">
            <div className="grid max-w-md gap-4">
              <div className="grid gap-1">
                <Label htmlFor="unit-code">Kode unit</Label>
                <Input id="unit-code" placeholder="Contoh: L1-023" className="font-mono" />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="unit-code-invalid">Kode unit (salah)</Label>
                <Input id="unit-code-invalid" defaultValue="L1-023" aria-invalid="true" />
                <p className="text-danger text-sm">Kode unit L1-023 sudah dipakai di venue ini.</p>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="unit-status">Status unit</Label>
                <Select defaultValue="occupied">
                  <SelectTrigger id="unit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="occupied">Terisi</SelectItem>
                    <SelectItem value="vacant">Kosong</SelectItem>
                    <SelectItem value="renovation">Renovasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <Section title="Status dan badge">
            <div className="flex flex-wrap items-center gap-4">
              <StatusDot tone="ok">Aktif</StatusDot>
              <StatusDot tone="warn" hollow>
                Segera buka
              </StatusDot>
              <StatusDot tone="danger">Ditutup</StatusDot>
              <StatusDot tone="neutral">Nonaktif</StatusDot>
              <Badge>Draft</Badge>
              <Badge variant="signal">Terpilih</Badge>
              <Badge variant="danger">3 Error</Badge>
              <Badge variant="route">Rute</Badge>
            </div>
          </Section>

          <Section title="Tabel">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Lantai</TableHead>
                  <TableHead className="text-right">Luas (m²)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ['RPT-01', 'Ruang Rapat', 'L1', '84.00', 'ok', 'Aktif'],
                  ['LAB-02', 'Laboratorium', 'GF', '120.50', 'ok', 'Aktif'],
                  ['—', 'Ruang Arsip', '—', '0.00', 'warn', 'Segera buka'],
                ].map(([code, name, floor, area, tone, status]) => (
                  <TableRow key={name}>
                    <TableCell className="font-mono">{code}</TableCell>
                    <TableCell>{name}</TableCell>
                    <TableCell className="font-mono">{floor}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{area}</TableCell>
                    <TableCell>
                      <StatusDot tone={tone === 'ok' ? 'ok' : 'warn'} hollow={tone !== 'ok'}>
                        {status}
                      </StatusDot>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" aria-label={`Aksi untuk ${name}`}>
                            <MoreHorizontalIcon strokeWidth={1.75} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{name}</DropdownMenuLabel>
                          <DropdownMenuItem>Ubah</DropdownMenuItem>
                          <DropdownMenuItem>Lihat di peta</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="danger">Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>

          <DataTableGallery />

          <Section title="Tab">
            <Tabs defaultValue="display">
              <TabsList>
                <TabsTrigger value="display">Tampilan</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="instructions">Instruksi</TabsTrigger>
              </TabsList>
              <TabsContent value="display">Tinggi dan warna per jenis fitur.</TabsContent>
              <TabsContent value="branding">Logo, warna utama, dan nama tampilan.</TabsContent>
              <TabsContent value="instructions">Teks instruksi rute ID dan EN.</TabsContent>
            </Tabs>
          </Section>

          <Section title="Dialog, sheet, toast">
            <div className="flex flex-wrap gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Buka dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Hapus lantai L2?</DialogTitle>
                    <DialogDescription>
                      Lantai ini masih berisi 42 fitur. Fitur ikut terhapus dari draft.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button>Batal</Button>
                    <Button variant="danger">Hapus lantai</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Sheet>
                <SheetTrigger asChild>
                  <Button>Buka sheet</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Unit L1-023</SheetTitle>
                    <SheetDescription>Properti fitur terpilih.</SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
              <Button onClick={() => toast.success('Draft tersimpan')}>Toast sukses</Button>
              <Button
                onClick={() =>
                  toast.error('Publish gagal', {
                    description: 'Masih ada 3 Error validasi. Perbaiki lalu jalankan ulang.',
                  })
                }
              >
                Toast error
              </Button>
            </div>
          </Section>

          <Section title="Skeleton dan kosong">
            <div className="grid max-w-md gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <EmptyState
              title="Belum ada gedung"
              description="Tambah gedung pertama untuk mulai menggambar peta."
              action={<Button variant="primary">Tambah gedung</Button>}
            />
          </Section>
        </div>
      </main>
      <Toaster position="bottom-right" />
    </TooltipProvider>
  );
}
