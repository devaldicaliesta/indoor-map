import { decodeDeepLink, PREVIEW_READY, readPreviewMessage, type Snapshot } from '@indoor/domain';
import { Skeleton } from '@indoor/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { VisitorShell } from '../app/visitor-shell';
import { SnapshotExplorer, useVisitLanguage } from '../routes/venue-page';

/**
 * Snapshot draft dari preview Admin. Hanya pesan dari jendela induk (iframe Admin) yang
 * diterima, dan isinya divalidasi skema snapshot. Halaman lain yang membingkai Visitor hanya
 * bisa menampilkan datanya sendiri, jadi asal induk tidak perlu dikonfigurasi.
 */
function useParentSnapshot(): Snapshot | null {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  useEffect(() => {
    if (window.parent === window) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const next = readPreviewMessage(event.data);
      if (next) setSnapshot(next);
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: PREVIEW_READY }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, []);
  return snapshot;
}

/** Visitor untuk draft yang belum dipublish, dibuka Admin di dalam iframe. */
export function PreviewPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [link] = useState(() => decodeDeepLink(`${location.pathname}${location.search}`));
  const snapshot = useParentSnapshot();
  useVisitLanguage(link, snapshot?.venue.defaultLanguage);

  return (
    <div className="relative h-dvh">
      <p
        role="status"
        className="pointer-events-none absolute top-2 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-3 py-1 font-bold text-canvas text-sm"
      >
        {t('preview.badge')}
      </p>
      {snapshot ? (
        <SnapshotExplorer key={snapshot.venue.id} snapshot={snapshot} link={link} />
      ) : (
        <VisitorShell>
          <div className="grid gap-2" aria-busy="true">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        </VisitorShell>
      )}
    </div>
  );
}
