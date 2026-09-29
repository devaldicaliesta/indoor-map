import { useTranslation } from 'react-i18next';
import { PanelMessage } from '../app/panel-message';
import { VisitorShell } from '../app/visitor-shell';

export function HomePage() {
  const { t } = useTranslation();
  return (
    <VisitorShell>
      <PanelMessage title={t('home.title')} description={t('home.description')} />
    </VisitorShell>
  );
}
