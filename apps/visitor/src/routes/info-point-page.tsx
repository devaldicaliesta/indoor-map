import { DataError, SERVICE_INACTIVE } from '@indoor/data';
import {
  type DeepLink,
  type FloorId,
  infoPointSnapshot,
  type VenueId,
  VenueIdSchema,
} from '@indoor/domain';
import { Skeleton } from '@indoor/ui';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router';
import { PanelMessage } from '../app/panel-message';
import { VisitorShell } from '../app/visitor-shell';
import { useSnapshot } from '../data/loadSnapshot';
import { showLanguage } from '../i18n';
import { InfoPointModeContext } from '../infopoint/info-point-mode';
import { OfflineBadge } from '../infopoint/offline-badge';
import { useIdle } from '../infopoint/use-idle';
import { usePendingUpdate } from '../infopoint/use-pending-update';
import { SnapshotExplorer } from './venue-page';

/** Permukaan Info Point (huruf 20 px, target sentuh 60 px) selama halaman ini terbuka. */
function useInfoPointSurface() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.surface;
    root.dataset.surface = 'info-point';
    // Layar umum: tanpa seleksi teks, klik kanan, atau zoom browser di luar peta.
    const block = (event: Event) => event.preventDefault();
    document.addEventListener('contextmenu', block);
    document.addEventListener('gesturestart', block);
    return () => {
      root.dataset.surface = previous;
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('gesturestart', block);
    };
  }, []);
}

/** Layar penuh pada sentuhan pertama (browser hanya mengizinkannya setelah interaksi). */
function useFullscreenOnTouch() {
  useEffect(() => {
    const enter = () => {
      if (!document.fullscreenElement && document.fullscreenEnabled) {
        void document.documentElement.requestFullscreen().catch(() => undefined);
      }
    };
    window.addEventListener('pointerdown', enter);
    return () => window.removeEventListener('pointerdown', enter);
  }, []);
}

function Message({ title, description }: { title: string; description: string }) {
  return (
    <VisitorShell>
      <PanelMessage title={title} description={description} />
    </VisitorShell>
  );
}

/**
 * Mode Info Point (`/ip/:code?venue=…`): Visitor yang sama dengan titik asal tetap di posisi
 * layar, peta diputar sesuai arah hadap, keyboard di layar, dan kembali ke tampilan awal serta
 * bahasa bawaan setelah idle.
 */
export function InfoPointPage() {
  const { t } = useTranslation();
  const code = useParams().code ?? '';
  const venue = VenueIdSchema.safeParse(useSearchParams()[0].get('venue'));
  useInfoPointSurface();
  useFullscreenOnTouch();
  if (!venue.success) {
    return (
      <Message
        title={t('infoPoint.notFoundTitle')}
        description={t('infoPoint.notFoundDescription')}
      />
    );
  }
  return <InfoPointScreen venueId={venue.data} code={code} />;
}

function InfoPointScreen({ venueId, code }: { venueId: VenueId; code: string }) {
  const { t } = useTranslation();
  const snapshot = useSnapshot(venueId);
  const view = useMemo(
    () => (snapshot.data ? infoPointSnapshot(snapshot.data, code) : null),
    [snapshot.data, code],
  );
  // Setiap sesi pengunjung baru (setelah idle) memasang ulang Visitor dari awal.
  const [session, setSession] = useState(0);
  const language = view?.infoPoint.defaultLanguage;
  useEffect(() => {
    if (language) showLanguage(language);
  }, [language, session]);
  const applyUpdate = usePendingUpdate(venueId, snapshot.data);
  useIdle(view?.infoPoint.idleSeconds ?? 60, () => {
    if (window.getSelection) window.getSelection()?.removeAllRanges();
    // Versi baru hanya dipasang di sini, saat tidak ada yang memakai layar.
    applyUpdate();
    setSession((s) => s + 1);
  });
  const link = useMemo<DeepLink | null>(
    () =>
      view ? { venueId, infoPointCode: code, floorId: view.infoPoint.floorId as FloorId } : null,
    [view, venueId, code],
  );

  if (snapshot.isPending) {
    return (
      <VisitorShell>
        <Skeleton className="h-24" />
      </VisitorShell>
    );
  }
  if (snapshot.error instanceof DataError && snapshot.error.code === SERVICE_INACTIVE) {
    return (
      <Message
        title={t('venue.serviceInactiveTitle')}
        description={t('venue.serviceInactiveDescription')}
      />
    );
  }
  if (!view || !link) {
    return (
      <Message
        title={t('infoPoint.notFoundTitle')}
        description={t('infoPoint.notFoundDescription')}
      />
    );
  }
  return (
    <InfoPointModeContext.Provider value={{ code }}>
      <div
        data-info-point-code={code}
        data-session={session}
        data-version={view.snapshot.version}
        className="contents select-none"
      >
        <SnapshotExplorer key={session} snapshot={view.snapshot} link={link} />
      </div>
      <OfflineBadge />
    </InfoPointModeContext.Provider>
  );
}
