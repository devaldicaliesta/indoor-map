import { cn } from '@indoor/ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../components/bottom-sheet';
import { LanguagePicker } from '../components/language-picker';
import { SearchField } from '../components/search-field';
import type { SheetSnap } from '../components/sheet-snap';
import { useMediaQuery } from './use-media-query';

// Lebar panel kiri desktop mengikuti pola Visitor di 05-desain-ui.md.
export const DESKTOP_QUERY = '(min-width: 1024px)';
/** Tinggi header mengambang di HP (padding 12 px + kontrol 44 px + padding 12 px). */
export const MOBILE_HEADER_PX = 68;

function MapArea({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <section aria-label={t('map.label')} className="h-full w-full bg-canvas">
      {children}
    </section>
  );
}

function Brand({ name }: { name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span aria-hidden="true" className="size-4 shrink-0 rounded-sm bg-signal ring-1 ring-ink" />
      <h1 className="truncate font-bold text-base">{name}</h1>
    </div>
  );
}

/**
 * Kerangka Visitor: panel kiri di desktop, peta penuh + bottom sheet di HP. Wadah gulir panel
 * ditandai `data-panel-scroll` agar layar panel yang baru bisa mulai dari atas.
 */
export function VisitorShell({
  title,
  actions,
  map,
  search,
  sheet,
  hideMobileTitle = false,
  children,
}: {
  title?: string;
  /** Tombol tambahan di header, di samping pemilih bahasa (misalnya info versi peta). */
  actions?: ReactNode;
  /** Peta venue; tanpa ini area peta kosong (beranda, venue yang belum terbit). */
  map?: ReactNode;
  /** Kolom cari yang terhubung ke pencarian venue; tanpa ini kolom tampil sebagai bentuknya saja. */
  search?: ReactNode;
  /** Tinggi bottom sheet HP yang diatur dari luar. */
  sheet?: { snap: SheetSnap; onSnapChange: (snap: SheetSnap) => void };
  /**
   * Nama di sheet HP hanya untuk pembaca layar, agar isi sheet (chip kategori) terlihat saat
   * sheet setinggi intip; nama venue tetap ada di dialog info.
   */
  hideMobileTitle?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const name = title ?? t('app.name');
  const searchField = search ?? <SearchField />;

  if (isDesktop) {
    return (
      <div className="grid h-dvh grid-cols-[380px_1fr] bg-canvas">
        <aside className="flex min-h-0 flex-col gap-4 border-line border-r bg-surface p-(--panel-padding)">
          <header className="flex items-center justify-between gap-3">
            <Brand name={name} />
            <div className="flex shrink-0 gap-2">
              {actions}
              <LanguagePicker />
            </div>
          </header>
          {searchField}
          {/* Ruang 12 px di sisi wadah gulir agar sorotan fokus baris daftar tidak terpotong. */}
          <div data-panel-scroll className="-mx-3 min-h-0 flex-1 overflow-y-auto px-3 py-1">
            {children}
          </div>
        </aside>
        <main className="min-w-0">
          <MapArea>{map}</MapArea>
        </main>
      </div>
    );
  }

  return (
    <div className="relative h-dvh overflow-hidden bg-canvas">
      <main className="absolute inset-0">
        <MapArea>{map}</MapArea>
      </main>
      <header className="absolute inset-x-0 top-0 z-20 flex gap-2 p-3">
        <div className="min-w-0 flex-1 rounded-sm shadow-float">{searchField}</div>
        {actions ? <div className="shrink-0 rounded-sm shadow-float">{actions}</div> : null}
        <LanguagePicker className="shadow-float" />
      </header>
      <BottomSheet {...(sheet ? { snap: sheet.snap, onSnapChange: sheet.onSnapChange } : {})}>
        <div className="grid gap-3 pt-1">
          <h1 className={cn('font-bold text-lg', hideMobileTitle && 'sr-only')}>{name}</h1>
          {children}
        </div>
      </BottomSheet>
    </div>
  );
}
