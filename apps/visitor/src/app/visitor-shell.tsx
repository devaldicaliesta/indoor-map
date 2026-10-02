import { type ReactNode, useState } from 'react';
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

/** Logo venue; nama venue selalu tertulis di dekatnya, jadi gambarnya dekoratif. */
function Logo({ url, className }: { url: string; className: string }) {
  // Berkas logo bisa sudah diganti di draft sebelum publish berikutnya; tanda bawaan dipakai.
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img src={url} alt="" className={className} onError={() => setFailed(true)} />;
}

function Brand({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {logoUrl ? (
        <Logo key={logoUrl} url={logoUrl} className="h-8 w-auto max-w-28 shrink-0 object-contain" />
      ) : (
        <span aria-hidden="true" className="size-4 shrink-0 rounded-sm bg-signal ring-1 ring-ink" />
      )}
      <h1 className="truncate font-bold">{name}</h1>
    </div>
  );
}

/** Kerangka Visitor: panel kiri di desktop, peta penuh + bottom sheet di HP. */
export function VisitorShell({
  title,
  logoUrl = null,
  actions,
  map,
  search,
  mobileHeader,
  sheet,
  children,
}: {
  title?: string;
  /** Logo venue dari branding; tanpa ini header memakai tanda bawaan. */
  logoUrl?: string | null;
  /** Tombol tambahan di header, di samping pemilih bahasa (misalnya info versi peta). */
  actions?: ReactNode;
  /** Peta venue; tanpa ini area peta kosong (beranda, venue yang belum terbit). */
  map?: ReactNode;
  /** Kolom cari yang berfungsi; tanpa ini kolom cari hanya bentuk. */
  search?: ReactNode;
  /** Pengganti kolom cari di header HP, misalnya tombol kembali dari detail. */
  mobileHeader?: ReactNode;
  /** Tinggi sheet HP yang dikendalikan halaman; tanpa ini sheet mengatur dirinya sendiri. */
  sheet?: { snap: SheetSnap; onSnapChange: (snap: SheetSnap) => void };
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const name = title ?? t('app.name');

  if (isDesktop) {
    return (
      <div className="grid h-dvh grid-cols-[380px_1fr] bg-canvas">
        <aside className="flex min-h-0 flex-col gap-4 border-line border-r bg-surface p-(--panel-padding)">
          <header className="flex items-center justify-between gap-3">
            <Brand name={name} logoUrl={logoUrl} />
            <div className="flex shrink-0 gap-2">
              {actions}
              <LanguagePicker />
            </div>
          </header>
          {search ?? <SearchField />}
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
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
        {logoUrl && !mobileHeader ? (
          <div className="flex size-(--control-height) shrink-0 items-center justify-center rounded-sm border border-line bg-surface p-1 shadow-float empty:hidden">
            <Logo key={logoUrl} url={logoUrl} className="max-h-full max-w-full object-contain" />
          </div>
        ) : null}
        {mobileHeader ?? (
          <div className="min-w-0 flex-1 rounded-sm shadow-float">{search ?? <SearchField />}</div>
        )}
        {actions ? <div className="shrink-0 rounded-sm shadow-float">{actions}</div> : null}
        <LanguagePicker className="shadow-float" />
      </header>
      <BottomSheet snap={sheet?.snap} onSnapChange={sheet?.onSnapChange}>
        <div className="grid gap-3 pt-1">
          {/* Halaman dengan kolom cari memakai sheet untuk chip dan hasil; nama venue tetap dibacakan. */}
          <h1 className={search ? 'sr-only' : 'font-bold text-lg'}>{name}</h1>
          {children}
        </div>
      </BottomSheet>
    </div>
  );
}
