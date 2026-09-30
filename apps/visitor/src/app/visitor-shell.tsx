import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../components/bottom-sheet';
import { LanguagePicker } from '../components/language-picker';
import { SearchField } from '../components/search-field';
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
      <span className="truncate font-bold">{name}</span>
    </div>
  );
}

/** Kerangka Visitor: panel kiri di desktop, peta penuh + bottom sheet di HP. */
export function VisitorShell({
  title,
  actions,
  map,
  children,
}: {
  title?: string;
  /** Tombol tambahan di header, di samping pemilih bahasa (misalnya info versi peta). */
  actions?: ReactNode;
  /** Peta venue; tanpa ini area peta kosong (beranda, venue yang belum terbit). */
  map?: ReactNode;
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
            <Brand name={name} />
            <div className="flex shrink-0 gap-2">
              {actions}
              <LanguagePicker />
            </div>
          </header>
          <SearchField />
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
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
        <SearchField className="min-w-0 flex-1 rounded-sm shadow-float" />
        {actions ? <div className="shrink-0 rounded-sm shadow-float">{actions}</div> : null}
        <LanguagePicker className="shadow-float" />
      </header>
      <BottomSheet>
        <div className="grid gap-3 pt-1">
          <h1 className="font-bold text-lg">{name}</h1>
          {children}
        </div>
      </BottomSheet>
    </div>
  );
}
