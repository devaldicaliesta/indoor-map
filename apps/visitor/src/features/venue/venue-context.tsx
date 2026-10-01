import {
  createSnapshotLookup,
  prepareSnapshotSearch,
  type Snapshot,
  type SnapshotLookup,
  type SnapshotSearch,
} from '@indoor/domain';
import { createContext, type ReactNode, use, useMemo } from 'react';

interface VenueData {
  snapshot: Snapshot;
  lookup: SnapshotLookup;
  search: SnapshotSearch;
}

const VenueContext = createContext<VenueData | null>(null);

/** Snapshot venue beserta indeks pencarian dan lookup-nya, dibuat sekali per snapshot. */
export function VenueProvider({ snapshot, children }: { snapshot: Snapshot; children: ReactNode }) {
  const value = useMemo(() => {
    const lookup = createSnapshotLookup(snapshot);
    return { snapshot, lookup, search: prepareSnapshotSearch(lookup) };
  }, [snapshot]);
  return <VenueContext value={value}>{children}</VenueContext>;
}

export function useVenue(): VenueData {
  const value = use(VenueContext);
  if (!value) throw new Error('useVenue dipakai di luar VenueProvider.');
  return value;
}
