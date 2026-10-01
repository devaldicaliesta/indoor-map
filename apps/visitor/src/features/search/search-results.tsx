import { searchSnapshot } from '@indoor/domain';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelMessage } from '../../app/panel-message';
import { useVenue } from '../venue/venue-context';
import { useBrowseStore } from './browse-store';
import { TargetRow } from './target-row';
import { useDebouncedValue } from './use-debounced-value';

/** Hasil muncul saat mengetik; pencarian dijalankan setelah jeda ini. */
export const SEARCH_DEBOUNCE_MS = 150;
/** Daftar dibatasi agar ringan di HP; kueri yang lebih lengkap mempersempit hasil. */
export const RESULT_LIMIT = 50;

/** Hasil pencarian dari indeks snapshot, tanpa server. */
export function SearchResults() {
  const { t } = useTranslation();
  const { search } = useVenue();
  const query = useDebouncedValue(
    useBrowseStore((state) => state.query),
    SEARCH_DEBOUNCE_MS,
  );
  const open = useBrowseStore((state) => state.open);
  const results = useMemo(() => searchSnapshot(search, query), [search, query]);
  const shown = results.slice(0, RESULT_LIMIT);

  return (
    <section aria-labelledby="search-results-title" className="grid gap-2">
      <h2 id="search-results-title" className="sr-only">
        {t('search.resultsTitle')}
      </h2>
      <p aria-live="polite" className="text-ink-muted text-sm">
        {results.length > 0 ? t('search.results', { count: results.length }) : ''}
      </p>
      {results.length === 0 && query.trim() !== '' ? (
        <PanelMessage
          title={t('search.noResultsTitle', { query: query.trim() })}
          description={t('search.noResultsDescription')}
        />
      ) : (
        <ul className="-mx-2 grid">
          {shown.map((target, index) => (
            <TargetRow
              key={`${target.kind}:${target.id}`}
              target={target}
              index={index}
              onOpen={open}
            />
          ))}
        </ul>
      )}
      {results.length > shown.length ? (
        <p className="text-ink-muted text-sm">{t('search.more', { shown: shown.length })}</p>
      ) : null}
    </section>
  );
}
