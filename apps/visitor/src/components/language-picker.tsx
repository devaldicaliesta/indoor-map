import { LANGUAGE_CODES } from '@indoor/domain';
import { cn } from '@indoor/ui';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n';

/** Dua pilihan tetap terlihat (bukan menu) agar bisa dipilih satu sentuhan. */
export function LanguagePicker({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  return (
    <fieldset
      data-tour="visitor-language"
      aria-label={t('language.label')}
      className={cn('m-0 flex min-w-0 rounded-sm border border-line bg-surface p-0', className)}
    >
      {LANGUAGE_CODES.map((code) => {
        const active = i18n.resolvedLanguage === code;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            aria-label={t(`language.${code}`)}
            onClick={() => setLanguage(code)}
            className={cn(
              'h-(--control-height) min-w-(--control-height) cursor-pointer px-3 font-bold uppercase',
              active ? 'bg-ink text-surface' : 'text-ink-muted hover:text-ink',
            )}
          >
            {code}
          </button>
        );
      })}
    </fieldset>
  );
}
