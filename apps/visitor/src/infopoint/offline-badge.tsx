import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

/** Penanda kecil untuk teknisi saat jaringan putus; layar tetap bekerja dari versi tersimpan. */
export function OfflineBadge() {
  const { t } = useTranslation();
  const online = useSyncExternalStore(subscribe, () => navigator.onLine);
  if (online) return null;
  return (
    <p
      role="status"
      className="fixed bottom-2 left-2 z-50 rounded-sm bg-ink px-2 py-0.5 text-surface text-xs"
    >
      {t('infoPoint.offline')}
    </p>
  );
}
