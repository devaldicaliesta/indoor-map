import { Button } from '@indoor/ui';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { PanelMessage } from '../app/panel-message';
import { VisitorShell } from '../app/visitor-shell';

/** Alamat yang tidak dikenal; pengunjung diarahkan kembali ke beranda. */
export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <VisitorShell>
      <div className="grid justify-items-start gap-3">
        <PanelMessage title={t('notFound.title')} description={t('notFound.description')} />
        <Button asChild>
          <Link to="/">{t('notFound.home')}</Link>
        </Button>
      </div>
    </VisitorShell>
  );
}

/** Galat tak terduga saat merender; pengunjung tidak melihat layar galat pengembang. */
export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  return (
    <VisitorShell>
      <div className="grid justify-items-start gap-3">
        <PanelMessage title={t('error.title')} description={t('error.description')} />
        <Button onClick={() => window.location.reload()}>{t('error.reload')}</Button>
      </div>
    </VisitorShell>
  );
}
