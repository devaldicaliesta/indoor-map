import { Button } from '@indoor/ui';
import { useTranslation } from 'react-i18next';
import { useInfoPointMode } from '../../infopoint/info-point-mode';
import { choosePrivacy } from './tracker';
import { useAnalyticsConfig, usePrivacyChoice } from './use-analytics';

export function PrivacyNotice({ enabled }: { enabled: boolean }) {
  const { t, i18n } = useTranslation();
  const infoPoint = useInfoPointMode();
  const config = useAnalyticsConfig(enabled && infoPoint === null);
  const choice = usePrivacyChoice();
  if (!enabled || infoPoint || !config?.enabled || choice.noticeSeen) return null;
  const text = (i18n.resolvedLanguage === 'en' ? config.notice.en.trim() : '') || config.notice.id;
  return (
    <section
      aria-label={t('analytics.noticeLabel')}
      className="fixed inset-x-3 top-3 z-50 mx-auto grid max-w-md gap-3 rounded-md border border-line bg-surface p-4 shadow-lg"
    >
      <p className="text-sm">{text}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => choosePrivacy(true)}>
          {t('analytics.decline')}
        </Button>
        <Button size="sm" variant="primary" onClick={() => choosePrivacy(false)}>
          {t('analytics.accept')}
        </Button>
      </div>
    </section>
  );
}

export function PrivacyToggle() {
  const { t } = useTranslation();
  const infoPoint = useInfoPointMode();
  const config = useAnalyticsConfig(infoPoint === null);
  const { optedOut } = usePrivacyChoice();
  if (infoPoint || !config?.enabled) return null;
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={!optedOut}
        onChange={(e) => choosePrivacy(!e.target.checked)}
        className="size-4 accent-ink"
      />
      {t('analytics.toggle')}
    </label>
  );
}
