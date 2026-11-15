import type { FloorId, ScanCandidate, ScanCandidates } from '@indoor/domain';
import { create } from 'zustand';

interface ScanState {
  open: boolean;
  floorId: FloorId | null;
  candidates: ScanCandidate[];
  rejected: number;
  selectedIds: ReadonlySet<string>;
  setOpen(open: boolean): void;
  setResult(floorId: FloorId, result: ScanCandidates): void;
  toggle(id: string): void;
  selectAll(): void;
  selectNone(): void;
  discard(): void;
}

const EMPTY = new Set<string>();

export const useScanStore = create<ScanState>()((set) => ({
  open: false,
  floorId: null,
  candidates: [],
  rejected: 0,
  selectedIds: EMPTY,
  setOpen(open) {
    set(open ? { open } : { open, floorId: null, candidates: [], rejected: 0, selectedIds: EMPTY });
  },
  setResult(floorId, { candidates, rejected }) {
    set({
      floorId,
      candidates,
      rejected,
      selectedIds: new Set(candidates.filter((c) => c.level !== 'low').map((c) => c.id)),
    });
  },
  toggle(id) {
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    });
  },
  selectAll() {
    set((state) => ({ selectedIds: new Set(state.candidates.map((c) => c.id)) }));
  },
  selectNone() {
    set({ selectedIds: EMPTY });
  },
  discard() {
    set({ floorId: null, candidates: [], rejected: 0, selectedIds: EMPTY });
  },
}));
