import {
  type DirectoryFilter,
  type ExploreSelection,
  type ExploreTarget,
  NO_DIRECTORY_FILTER,
} from '@indoor/domain';
import { createStore } from 'zustand';
import type { SheetSnap } from '../../components/sheet-snap';

/** Daftar yang dibuka lewat chip atau hasil cari. */
export type ExploreList =
  | { kind: 'category'; id: string }
  | { kind: 'facility_type'; id: string }
  | { kind: 'directory' };

/**
 * `fit`: kamera membingkai pilihan (dipilih dari daftar); `pan`: hanya digeser agar tidak
 * tertutup panel (diketuk di peta, sudah terlihat di layar).
 */
export type FocusMode = 'fit' | 'pan';

export interface ExploreState {
  /** Kueri setelah jeda ketik; kosong berarti tidak sedang mencari. */
  query: string;
  list: ExploreList | null;
  detail: ExploreTarget | null;
  directoryFilter: DirectoryFilter;
  /** Tinggi bottom sheet di HP, juga dipakai peta sebagai ruang tepi kamera. */
  sheetSnap: SheetSnap;
  /** Naik setiap kali pengunjung memilih sesuatu, agar kamera bergerak sekali per pilihan. */
  focus: { seq: number; mode: FocusMode };

  search(query: string): void;
  /** Membuka daftar dan mengosongkan pencarian (hasil cari berupa kategori atau jenis fasilitas). */
  openList(list: ExploreList): void;
  /** Chip bersifat sakelar: membuka daftar yang sama lagi menutupnya. */
  toggleList(list: ExploreList): void;
  closeList(): void;
  openDetail(target: ExploreTarget, mode?: FocusMode): void;
  closeDetail(): void;
  setDirectoryFilter(filter: DirectoryFilter): void;
  setSheetSnap(snap: SheetSnap): void;
}

const INITIAL = {
  query: '',
  list: null,
  detail: null,
  directoryFilter: NO_DIRECTORY_FILTER,
  sheetSnap: 'peek' as SheetSnap,
  focus: { seq: 0, mode: 'fit' as FocusMode },
};

const sameList = (a: ExploreList | null, b: ExploreList) =>
  a?.kind === b.kind && (a.kind === 'directory' || (b.kind !== 'directory' && a.id === b.id));

/** Satu store per venue yang dibuka (dibuat ExploreProvider), jadi pilihan tidak terbawa ke venue lain. */
export const createExploreStore = () =>
  createStore<ExploreState>()((set, get) => ({
    ...INITIAL,

    search: (query) =>
      set((s) => ({
        query,
        detail: null,
        sheetSnap: query ? 'full' : s.list ? 'half' : 'peek',
      })),

    openList: (list) =>
      set((s) => ({
        list,
        detail: null,
        query: '',
        sheetSnap: list.kind === 'directory' ? 'full' : 'half',
        focus: { seq: s.focus.seq + 1, mode: 'fit' },
      })),

    toggleList: (list) => {
      if (sameList(get().list, list)) set({ list: null, detail: null, sheetSnap: 'peek' });
      else get().openList(list);
    },

    closeList: () => set({ list: null, sheetSnap: 'peek' }),

    openDetail: (detail, mode = 'fit') =>
      set((s) => ({ detail, sheetSnap: 'half', focus: { seq: s.focus.seq + 1, mode } })),

    closeDetail: () =>
      set((s) => ({
        detail: null,
        sheetSnap: s.query ? 'full' : s.list ? 'half' : 'peek',
      })),

    setDirectoryFilter: (directoryFilter) => set({ directoryFilter }),
    setSheetSnap: (sheetSnap) => set({ sheetSnap }),
  }));

/** Yang disorot di peta: detail yang terbuka, atau daftar kategori/jenis fasilitas saat tidak mencari. */
export function selectionOf(
  state: Pick<ExploreState, 'detail' | 'query' | 'list'>,
): ExploreSelection | null {
  if (state.detail) return state.detail;
  if (state.query || !state.list || state.list.kind === 'directory') return null;
  return state.list;
}
