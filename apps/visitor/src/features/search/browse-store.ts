import { type BrowseTarget, type DirectoryFilter, EMPTY_DIRECTORY_FILTER } from '@indoor/domain';
import { create } from 'zustand';
import type { SheetSnap } from '../../components/sheet-snap';

/** Layer panel yang dibuka di atas beranda (kueri kosong) atau hasil pencarian. */
export type BrowseScreen = BrowseTarget | { kind: 'directory' };

export const isDetailScreen = (screen: BrowseScreen | undefined) =>
  screen?.kind === 'location' || screen?.kind === 'unit' || screen?.kind === 'facility';

export interface BrowseState {
  /** Isi kolom cari; hasil dihitung dari nilainya setelah jeda mengetik. */
  query: string;
  stack: BrowseScreen[];
  /** Tinggi bottom sheet di HP, diatur saat layar berganti; pengunjung tetap bisa menariknya. */
  sheet: SheetSnap;
  /** Permintaan kamera; `seq` naik setiap kali agar membuka target yang sama tetap menggeser peta. */
  focus: { target: BrowseTarget; seq: number } | null;
  directory: DirectoryFilter;
  setQuery(query: string): void;
  /** Dari chip atau daftar: layar dibuka dan targetnya ditunjukkan di peta. */
  open(screen: BrowseScreen): void;
  /** Dari ketuk peta: menggantikan detail yang sedang terbuka, kamera tidak bergerak. */
  openFromMap(target: BrowseTarget): void;
  back(): void;
  setSheet(sheet: SheetSnap): void;
  setDirectory(filter: DirectoryFilter): void;
  reset(): void;
}

const searching = (query: string) => query.trim() !== '';

/** Hasil pencarian dan direktori butuh ruang penuh (keyboard HP menutup separuh layar). */
function sheetFor(screen: BrowseScreen | undefined, query: string): SheetSnap {
  if (!screen) return searching(query) ? 'full' : 'peek';
  return screen.kind === 'directory' ? 'full' : 'half';
}

const INITIAL = {
  query: '',
  stack: [],
  sheet: 'peek',
  focus: null,
  directory: EMPTY_DIRECTORY_FILTER,
} satisfies Partial<BrowseState>;

export const useBrowseStore = create<BrowseState>()((set) => ({
  ...INITIAL,

  setQuery: (query) =>
    set((state) =>
      state.stack.length === 0 && searching(query) === searching(state.query)
        ? { query }
        : { query, stack: [], sheet: sheetFor(undefined, query) },
    ),

  open: (screen) =>
    set((state) => ({
      stack: [...state.stack, screen],
      sheet: sheetFor(screen, state.query),
      focus:
        screen.kind === 'directory'
          ? state.focus
          : { target: screen, seq: (state.focus?.seq ?? 0) + 1 },
    })),

  openFromMap: (target) =>
    set((state) => {
      const stack = isDetailScreen(state.stack.at(-1)) ? state.stack.slice(0, -1) : state.stack;
      return { stack: [...stack, target], sheet: sheetFor(target, state.query) };
    }),

  back: () =>
    set((state) => {
      const stack = state.stack.slice(0, -1);
      return { stack, sheet: sheetFor(stack.at(-1), state.query) };
    }),

  setSheet: (sheet) => set({ sheet }),
  setDirectory: (directory) => set({ directory }),
  reset: () => set(INITIAL),
}));

/** Layar teratas, atau `undefined` di beranda/hasil pencarian. */
export const selectScreen = (state: BrowseState) => state.stack.at(-1);
