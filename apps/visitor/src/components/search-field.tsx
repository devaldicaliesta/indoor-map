import { cn, Input } from '@indoor/ui';
import { SearchIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Hasil pencarian dibuat di T-119; di sini hanya bentuk dan aksesibilitasnya.
export function SearchField({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <search className={cn('relative block', className)}>
      <SearchIcon
        aria-hidden="true"
        strokeWidth={1.75}
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-muted"
      />
      <Input
        type="search"
        aria-label={t('search.label')}
        placeholder={t('search.placeholder')}
        className="pl-10"
      />
    </search>
  );
}
