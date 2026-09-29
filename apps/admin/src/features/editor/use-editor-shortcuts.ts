import type { EditorTool } from '@indoor/map-core';
import { useEffect } from 'react';
import { useEditorStore } from './editor-store';
import type { EditorSession } from './use-editor-session';

/** Pintasan alat; juga ditampilkan di tooltip toolbar. */
export const TOOL_SHORTCUTS: Record<EditorTool, string> = {
  select: 'V',
  polygon: 'P',
  linestring: 'L',
  point: 'T',
};

const TOOL_BY_KEY = Object.fromEntries(
  Object.entries(TOOL_SHORTCUTS).map(([tool, key]) => [key.toLowerCase(), tool as EditorTool]),
);

/** Pintasan tidak berlaku saat mengetik di kolom isian atau memakai menu pilihan. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.closest('[role="listbox"], [role="menu"], [role="dialog"]') !== null
  );
}

/** FR-MAP-03/04: Delete, Esc, V (pilih), P (poligon), L (garis), T (titik). */
export function useEditorShortcuts(session: EditorSession, canEdit: boolean) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target)) return;
      const store = useEditorStore.getState();
      if (event.key === 'Escape') {
        if (store.tool !== 'select') store.setTool('select');
        else store.select(null);
        return;
      }
      if (!canEdit) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (store.selectedIds.length === 0) return;
        event.preventDefault();
        session.removeMany(store.selectedIds);
        return;
      }
      const tool = TOOL_BY_KEY[event.key.toLowerCase()];
      if (tool) {
        event.preventDefault();
        store.setTool(tool);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session, canEdit]);
}
