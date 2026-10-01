import {
  type DirectoryFilter,
  type ExploreSelection,
  type ExploreTarget,
  NO_DIRECTORY_FILTER,
} from '@indoor/domain';
import type { RoutePlace } from '@indoor/routing';
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

/**
 * Menentukan titik asal: `choose` = cari tempat lalu "Saya di sini" (atau beralih ke ketuk peta),
 * `tap` = ketukan peta berikutnya menjadi titik asal.
 */
export type OriginMode = 'off' | 'choose' | 'tap';

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
  /** Titik asal rute; dari QR (`?o=`), "Saya di sini", atau ketuk peta. */
  origin: RoutePlace | null;
  /** Naik setiap titik asal berganti, agar peta berpusat di sana sekali. */
  originSeq: number;
  originMode: OriginMode;
  /** Tujuan "Rute ke sini"; panel rute tampil bila titik asal sudah ada. */
  destination: ExploreTarget | null;

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
  /** "Rute ke sini": tanpa titik asal, pengunjung diminta menentukannya lebih dulu. */
  requestRoute(target: ExploreTarget): void;
  /** Ganti titik asal dari panel rute atau penanda "Anda di sini". */
  chooseOrigin(): void;
  tapOrigin(): void;
  setOrigin(place: RoutePlace): void;
  cancelOrigin(): void;
  closeRoute(): void;
}

const INITIAL = {
  query: '',
  list: null,
  detail: null,
  directoryFilter: NO_DIRECTORY_FILTER,
  sheetSnap: 'peek' as SheetSnap,
  focus: { seq: 0, mode: 'fit' as FocusMode },
  originSeq: 0,
  originMode: 'off' as OriginMode,
  destination: null,
};

const sameList = (a: ExploreList | null, b: ExploreList) =>
  a?.kind === b.kind && (a.kind === 'directory' || (b.kind !== 'directory' && a.id === b.id));

/** Satu store per venue yang dibuka (dibuat ExploreProvider), jadi pilihan tidak terbawa ke venue lain. */
export const createExploreStore = (origin: RoutePlace | null = null) =>
  createStore<ExploreState>()((set, get) => ({
    ...INITIAL,
    origin,

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

    requestRoute: (destination) =>
      set((s) =>
        s.origin
          ? { destination, originMode: 'off', detail: null, sheetSnap: 'half' }
          : {
              destination,
              originMode: 'choose',
              detail: null,
              query: '',
              list: null,
              sheetSnap: 'half',
            },
      ),

    chooseOrigin: () =>
      set({ originMode: 'choose', detail: null, query: '', list: null, sheetSnap: 'half' }),

    tapOrigin: () => set({ originMode: 'tap', detail: null, sheetSnap: 'peek' }),

    setOrigin: (origin) =>
      set((s) => ({
        origin,
        originSeq: s.originSeq + 1,
        originMode: 'off',
        detail: null,
        query: '',
        list: null,
        sheetSnap: s.destination ? 'half' : 'peek',
      })),

    cancelOrigin: () =>
      set((s) => ({
        originMode: 'off',
        // Tanpa titik asal, permintaan rute yang menunggunya ikut batal.
        destination: s.origin ? s.destination : null,
        sheetSnap: s.origin && s.destination ? 'half' : 'peek',
      })),

    closeRoute: () => set({ destination: null, sheetSnap: 'peek' }),
  }));

/** Yang disorot di peta: detail yang terbuka, atau daftar kategori/jenis fasilitas saat tidak mencari. */
export function selectionOf(
  state: Pick<ExploreState, 'detail' | 'query' | 'list'>,
): ExploreSelection | null {
  if (state.detail) return state.detail;
  if (state.query || !state.list || state.list.kind === 'directory') return null;
  return state.list;
}
