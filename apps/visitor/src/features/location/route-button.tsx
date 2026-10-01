import { Button } from '@indoor/ui';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

// Rute dihitung di T-215; sampai itu tombol tampil tetapi nonaktif dengan keterangan.
export function RouteButton() {
  const { t } = useTranslation();
  const note = useId();
  return (
    <div className="grid gap-1">
      <Button variant="primary" disabled aria-describedby={note} className="w-full">
        {t('route.toHere')}
      </Button>
      <p id={note} className="text-ink-muted text-sm">
        {t('route.unavailable')}
      </p>
    </div>
  );
}
