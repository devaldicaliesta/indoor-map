import type { SnapshotLanguage } from '@indoor/domain';
import type { LngLat } from '@indoor/map-core';
import type { RoutePlace, RoutePlan } from '@indoor/routing';
import { create } from 'zustand';
import { useEditorStore } from '../store/editor-store';

export type RouteEndName = 'from' | 'to';

/** Langkah yang dipilih: peta pindah ke lantainya lalu diarahkan ke titik-titiknya. */
export interface StepFocus {
  floorId: string;
  /** Gedung lantai itu; `null` untuk Area Luar. */
  buildingId: string | null;
  coordinates: LngLat[];
  /** Naik setiap permintaan agar memilih langkah yang sama tetap mengarahkan kamera. */
  seq: number;
}

interface TestRouteState {
  venueId: string | null;
  /** Tab Uji rute terbuka; hanya selama itu rute dihitung dan digambar. */
  open: boolean;
  from: RoutePlace | null;
  to: RoutePlace | null;
  accessible: boolean;
  language: SnapshotLanguage;
  /** Ujung yang sedang dipilih lewat klik peta. */
  picking: RouteEndName | null;
  /**
   * Naik setiap asal, tujuan, atau mode berubah. Rencana pertama untuk versi baru membuka langkah
   * pertama; rencana ulang karena graf disunting tidak memindah lantai.
   */
  version: number;
  /**
   * Versi yang langkah pertamanya sudah ditampilkan. Disimpan di store karena panel dipasang ulang
   * saat editor berpindah gedung atau ke Area Luar.
   */
  shownVersion: number | null;
  /** Rencana terakhir dari panel, dibaca lapisan rute di kanvas. */
  plan: RoutePlan | null;
  activeStep: number | null;
  focus: StepFocus | null;
  /** Mengosongkan asal dan tujuan bila venue berganti. */
  selectVenue(venueId: string): void;
  setOpen(open: boolean): void;
  setPlace(end: RouteEndName, place: RoutePlace | null): void;
  swap(): void;
  setAccessible(accessible: boolean): void;
  setLanguage(language: SnapshotLanguage): void;
  startPicking(end: RouteEndName): void;
  stopPicking(): void;
  setPlan(plan: RoutePlan | null): void;
  /** Mengaktifkan langkah dan meminta peta pindah ke lantai serta titiknya. */
  showStep(index: number, focus: Omit<StepFocus, 'seq'>): void;
  markShown(version: number): void;
}

const EMPTY = {
  from: null,
  to: null,
  picking: null,
  plan: null,
  activeStep: null,
  focus: null,
} as const;

/** Keadaan Uji rute; bertahan saat lantai berganti karena rute bisa melewati beberapa lantai. */
export const useTestRouteStore = create<TestRouteState>()((set, get) => ({
  ...EMPTY,
  venueId: null,
  open: false,
  accessible: false,
  language: 'id',
  version: 0,
  shownVersion: null,
  selectVenue(venueId) {
    if (get().venueId !== venueId) set((s) => ({ ...EMPTY, venueId, version: s.version + 1 }));
  },
  setOpen(open) {
    set({ open, picking: null, ...(open ? {} : { plan: null }) });
  },
  setPlace(end, place) {
    set((s) => ({ [end]: place, picking: null, version: s.version + 1, activeStep: null }));
  },
  swap() {
    set((s) => ({ from: s.to, to: s.from, version: s.version + 1, activeStep: null }));
  },
  setAccessible(accessible) {
    set((s) => ({ accessible, version: s.version + 1, activeStep: null }));
  },
  setLanguage(language) {
    set({ language });
  },
  startPicking(picking) {
    // Klik peta hanya diteruskan ke uji rute di alat Pilih.
    useEditorStore.getState().setTool('select');
    set({ picking });
  },
  stopPicking() {
    set({ picking: null });
  },
  setPlan(plan) {
    set((s) => ({
      plan,
      // Langkah aktif tetap selama masih ada di rute yang dihitung ulang; rencana kosong (panel
      // dilepas saat editor berpindah gedung) tidak mengubahnya.
      activeStep:
        plan && (!plan.ok || (s.activeStep ?? 0) >= plan.steps.length) ? null : s.activeStep,
    }));
  },
  showStep(index, focus) {
    set((s) => ({ activeStep: index, focus: { ...focus, seq: (s.focus?.seq ?? 0) + 1 } }));
  },
  markShown(shownVersion) {
    set({ shownVersion });
  },
}));
