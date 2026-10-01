import type { EntrancePlan, FloorId } from '@indoor/domain';
import { create } from 'zustand';
import { useEditorStore } from '../store/editor-store';

interface EntranceState {
  /** Saran titik masuk yang sedang ditinjau, beserta lantai tempat saran itu dihitung. */
  review: { floorId: FloorId; plan: EntrancePlan } | null;
  /** Indeks saran yang disorot dari daftar. */
  hovered: number | null;
  /** Unit atau fasilitas yang sedang disambung manual: klik jalur berikutnya membuat titik masuk. */
  linkingId: string | null;
  /** Pesan untuk klik yang tidak mengenai jalur saat menyambung manual. */
  linkingMessage: string | null;
  setReview(review: EntranceState['review']): void;
  setHovered(index: number | null): void;
  startLinking(featureId: string): void;
  setLinkingMessage(message: string | null): void;
  stopLinking(): void;
  reset(): void;
}

const IDLE = { review: null, hovered: null, linkingId: null, linkingMessage: null };

/** Keadaan panel Titik masuk; dikosongkan setiap lantai berganti. */
export const useEntranceStore = create<EntranceState>()((set) => ({
  ...IDLE,
  setReview(review) {
    set({ review, hovered: null });
  },
  setHovered(hovered) {
    set({ hovered });
  },
  startLinking(linkingId) {
    // Titik masuk disambung dengan mengklik jalur, jadi edge harus terlihat.
    useEditorStore.getState().setGraphVisible('edges', true);
    set({ linkingId, linkingMessage: null });
  },
  setLinkingMessage(linkingMessage) {
    set({ linkingMessage });
  },
  stopLinking() {
    set({ linkingId: null, linkingMessage: null });
  },
  reset() {
    set(IDLE);
  },
}));
