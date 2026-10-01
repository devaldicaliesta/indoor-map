import { Button, cn } from '@indoor/ui';
import { ArrowLeftIcon } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useBrowseStore } from './browse-store';

/**
 * Kepala layar panel: tombol kembali, judul, dan baris keterangan. Fokus pindah ke judul saat
 * layar dibuka agar pembaca layar mengumumkan isi yang baru.
 */
export function ScreenHeader({
  title,
  subtitle,
  icon,
  titleClassName,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  titleClassName?: string;
}) {
  const { t } = useTranslation();
  const back = useBrowseStore((state) => state.back);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <header className="flex items-start gap-2">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('browse.back')}
        onClick={back}
        className="-ml-3"
      >
        <ArrowLeftIcon className="size-5" strokeWidth={1.75} />
      </Button>
      {icon ? <div className="pt-2">{icon}</div> : null}
      <div className="grid min-w-0 gap-1 pt-2">
        <h2
          ref={heading}
          tabIndex={-1}
          className={cn(
            'font-bold text-lg leading-tight outline-none focus-visible:shadow-none',
            titleClassName,
          )}
        >
          {title}
        </h2>
        {subtitle ? <p className="text-ink-muted">{subtitle}</p> : null}
      </div>
    </header>
  );
}
