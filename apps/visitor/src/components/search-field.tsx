import { cn, Input } from '@indoor/ui';
import { SearchIcon } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

/** Kolom cari Visitor; tanpa `value` (beranda tanpa venue) kolom tidak terhubung ke pencarian. */
export function SearchField({
  className,
  value,
  onValueChange,
  onKeyDown,
}: {
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
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
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        className="pl-10"
        {...(value === undefined ? {} : { value })}
        onChange={(event) => onValueChange?.(event.target.value)}
        onKeyDown={onKeyDown}
      />
    </search>
  );
}
