import type { ExploreTarget, SearchHit, SnapshotIndex } from '@indoor/domain';
import { Button } from '@indoor/ui';
import { PlusIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { detailTitle } from '../search/detail-title';
import { useExplore, useExploreStore } from '../search/explore-context';
import { MAX_ROUTE_STOPS } from '../search/explore-store';

const RESULTS = 6;

function targetOfHit(index: SnapshotIndex, hit: SearchHit): ExploreTarget | null {
  if (hit.kind === 'location') {
    return index.locations.get(hit.id)?.unitIds.length ? { kind: 'location', id: hit.id } : null;
  }
  return hit.kind === 'unit' ? { kind: 'unit', id: hit.id } : null;
}

export function AddStop() {
  const { t } = useTranslation();
  const { search, index } = useExplore();
  const stops = useExploreStore((s) => s.stops);
  const addStop = useExploreStore((s) => s.addStop);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listId = useId();
  if (stops.length >= MAX_ROUTE_STOPS) return null;
  if (!open) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="justify-self-start"
        onClick={() => setOpen(true)}
      >
        <PlusIcon aria-hidden="true" strokeWidth={1.75} />
        {t('route.addStop')}
      </Button>
    );
  }
  const hits = query.trim()
    ? search(query)
        .flatMap((hit) => {
          const target = targetOfHit(index, hit);
          return target ? [target] : [];
        })
        .slice(0, RESULTS)
    : [];
  return (
    <div className="grid gap-2">
      <input
        type="search"
        aria-label={t('route.addStopSearch')}
        aria-controls={listId}
        placeholder={t('route.addStopSearch')}
        className="h-(--control-height) rounded-sm border border-line bg-surface px-3 text-base"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul id={listId} className="grid gap-0.5" aria-label={t('route.addStopResults')}>
        {hits.map((target) => (
          <li key={`${target.kind}:${target.id}`}>
            <button
              type="button"
              className="w-full cursor-pointer rounded-sm px-2 py-2 text-left hover:bg-canvas"
              onClick={() => {
                addStop(target);
                setQuery('');
                setOpen(false);
              }}
            >
              {detailTitle(index, target)}
            </button>
          </li>
        ))}
      </ul>
      <Button
        size="sm"
        variant="ghost"
        className="justify-self-start"
        onClick={() => {
          setQuery('');
          setOpen(false);
        }}
      >
        {t('route.addStopCancel')}
      </Button>
    </div>
  );
}
