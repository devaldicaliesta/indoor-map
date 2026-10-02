import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

/** Sidebar diciutkan menjadi deret ikon untuk memberi ruang editor peta; pilihan diingat. */
export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({ collapsed: false, toggle: () => set((s) => ({ collapsed: !s.collapsed })) }),
    {
      name: 'indoor-admin.sidebar',
    },
  ),
);
