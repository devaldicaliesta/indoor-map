import { cn, Input } from '@indoor/ui';
import { SearchIcon, XIcon } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Kolom cari Visitor. Tanpa `onValueChange` hanya bentuk dan aksesibilitasnya (halaman tanpa
 * venue); halaman venue mengisinya lewat `VenueSearch`.
 */
export function SearchField({
  className,
  value,
  onValueChange,
  onKeyDown,
  controls,
}: {
  className?: string | undefined;
  value?: string;
  onValueChange?: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Id daftar hasil yang dikendalikan kolom ini. */
  controls?: string;
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
        aria-controls={controls}
        placeholder={t('search.placeholder')}
        className="pr-11 pl-10 [&::-webkit-search-cancel-button]:hidden"
        value={value}
        onChange={onValueChange ? (e) => onValueChange(e.target.value) : undefined}
        onKeyDown={onKeyDown}
        autoComplete="off"
        enterKeyHint="search"
      />
      {value && onValueChange ? (
        <button
          type="button"
          aria-label={t('search.clear')}
          onClick={() => onValueChange('')}
          className="absolute top-0 right-0 flex size-(--control-height) cursor-pointer items-center justify-center text-ink-muted hover:text-ink"
        >
          <XIcon aria-hidden="true" strokeWidth={1.75} className="size-5" />
        </button>
      ) : null}
    </search>
  );
}
