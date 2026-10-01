import type { Connector, Position } from '@indoor/domain';
import { create } from 'zustand';

interface ConnectorDialogState {
  /** Dialog terbuka: konektor baru di `position`, atau mengubah `connector` dari pemberhentiannya. */
  open: { position: Position; connector: Connector | null } | null;
  openNew(position: Position): void;
  openEdit(connector: Connector, position: Position): void;
  close(): void;
}

export const useConnectorDialog = create<ConnectorDialogState>()((set) => ({
  open: null,
  openNew(position) {
    set({ open: { position, connector: null } });
  },
  openEdit(connector, position) {
    set({ open: { position, connector } });
  },
  close() {
    set({ open: null });
  },
}));
