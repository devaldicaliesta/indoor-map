import type { ClosureTarget } from '@indoor/domain';
import { create } from 'zustand';

/** Dialog penutupan baru, dibuka dari halaman Penutupan atau klik kanan di editor. */
interface ClosureDialogState {
  target: ClosureTarget | null;
  open(target: ClosureTarget): void;
  close(): void;
}

export const useClosureDialog = create<ClosureDialogState>((set) => ({
  target: null,
  open: (target) => set({ target }),
  close: () => set({ target: null }),
}));
