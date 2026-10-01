import { Button } from '@indoor/ui';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

/** Aksi utama detail. Rute dihitung mulai R2 (T-215); sampai itu tombol nonaktif dengan alasannya. */
export function RouteAction() {
  const { t } = useTranslation();
  const noteId = useId();
  return (
    <div className="grid gap-1">
      <Button variant="primary" disabled aria-describedby={noteId} className="w-full">
        {t('location.route')}
      </Button>
      <p id={noteId} className="text-ink-muted text-sm">
        {t('location.routeUnavailable')}
      </p>
    </div>
  );
}
