import { deepLinkUrl } from '@indoor/domain';
import { Button } from '@indoor/ui';
import { CheckIcon, Share2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useExplore, useExploreStore } from '../search/explore-context';
import { shareLink } from './share-model';

type ShareResult = 'idle' | 'copied' | 'manual';

/** Tautan keadaan sekarang di alamat Visitor yang sedang dibuka (tanpa pemendek URL). */
function useShareUrl(): string {
  const { i18n } = useTranslation();
  const { snapshot, index } = useExplore();
  const detail = useExploreStore((s) => s.detail);
  const origin = useExploreStore((s) => s.origin);
  const destination = useExploreStore((s) => s.destination);
  const accessible = useExploreStore((s) => s.accessible);
  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'id';
  const link = shareLink(snapshot, index, { detail, origin, destination, accessible, language });
  return deepLinkUrl(window.location.origin, link);
}

/**
 * "Bagikan": lembar bagikan perangkat (Web Share API) bila ada, selain itu tautan disalin. Bila
 * menyalin pun diblokir, tautan ditampilkan untuk disalin manual.
 */
export function ShareButton({ title }: { title: string }) {
  const { t } = useTranslation();
  const url = useShareUrl();
  const [result, setResult] = useState<ShareResult>('idle');

  useEffect(() => {
    if (result !== 'copied') return;
    const timer = window.setTimeout(() => setResult('idle'), 3000);
    return () => window.clearTimeout(timer);
  }, [result]);

  async function share() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Pengunjung menutup lembar bagikan: bukan kegagalan.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setResult('copied');
    } catch {
      setResult('manual');
    }
  }

  return (
    <div className="grid gap-2">
      <Button className="w-full" onClick={() => void share()}>
        {result === 'copied' ? (
          <CheckIcon aria-hidden="true" strokeWidth={1.75} />
        ) : (
          <Share2Icon aria-hidden="true" strokeWidth={1.75} />
        )}
        {result === 'copied' ? t('share.copied') : t('share.button')}
      </Button>
      <p role="status" className="sr-only">
        {result === 'copied' ? t('share.copied') : ''}
      </p>
      {result === 'manual' ? (
        <label className="grid gap-1 text-sm">
          <span className="text-ink-muted">{t('share.manual')}</span>
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="h-(--control-height) rounded-sm border border-line bg-surface px-3 font-mono text-sm"
          />
        </label>
      ) : null}
    </div>
  );
}
