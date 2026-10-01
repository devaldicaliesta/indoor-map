import type { EditorTool } from '@indoor/map-core';
import { useEffect } from 'react';
import { useEntranceStore } from './graph/entrance-store';
import { useEditorStore } from './store/editor-store';
import type { EditorSession } from './use-editor-session';

/** Pintasan alat; juga ditampilkan di tooltip toolbar. */
export const TOOL_SHORTCUTS: Record<EditorTool, string> = {
  select: 'V',
  polygon: 'P',
  linestring: 'L',
  point: 'T',
  path: 'J',
  connector: 'K',
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

/** Label pintasan undo/redo sesuai sistem (⌘ di macOS). */
export const UNDO_SHORTCUT = /Mac|iPhone|iPad/.test(globalThis.navigator?.platform ?? '')
  ? { undo: '⌘Z', redo: '⇧⌘Z' }
  : { undo: 'Ctrl+Z', redo: 'Ctrl+Shift+Z' };

/**
 * Delete, Esc, V (pilih), P (poligon), L (garis), T (titik), J (jalur), K (konektor),
 * Ctrl/Cmd+Z (undo), Ctrl/Cmd+Shift+Z atau Ctrl+Y (redo).
 */
export function useEditorShortcuts(session: EditorSession, canEdit: boolean) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isTyping(event.target)) return;
      const store = useEditorStore.getState();
      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        const key = event.key.toLowerCase();
        if (!canEdit || (key !== 'z' && key !== 'y')) return;
        event.preventDefault();
        if (key === 'y' || event.shiftKey) session.redo();
        else session.undo();
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Escape') {
        const entrances = useEntranceStore.getState();
        if (entrances.linkingId) entrances.stopLinking();
        else if (store.tool !== 'select') store.setTool('select');
        else store.select(null);
        return;
      }
      if (!canEdit) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (store.graphSelection) {
          event.preventDefault();
          session.graph.removeSelected();
          return;
        }
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
