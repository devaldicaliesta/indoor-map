import type { EditorTool } from '@indoor/map-core';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@indoor/ui';
import {
  ArrowUpDownIcon,
  MapPinIcon,
  MousePointer2Icon,
  PentagonIcon,
  Redo2Icon,
  SplineIcon,
  Undo2Icon,
  WaypointsIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useEditorStore } from './store/editor-store';
import type { EditorSession } from './use-editor-session';
import { TOOL_SHORTCUTS, UNDO_SHORTCUT } from './use-editor-shortcuts';

const TOOLS: { tool: EditorTool; label: string; hint: string; Icon: ComponentType }[] = [
  {
    tool: 'select',
    label: 'Pilih',
    hint: 'Klik fitur untuk memilih dan mengubah bentuknya',
    Icon: MousePointer2Icon,
  },
  {
    tool: 'polygon',
    label: 'Poligon',
    hint: 'Unit, koridor, area. Klik titik demi titik, klik titik awal untuk menutup',
    Icon: PentagonIcon,
  },
  {
    tool: 'linestring',
    label: 'Garis',
    hint: 'Dinding. Klik titik demi titik, klik dua kali untuk selesai',
    Icon: SplineIcon,
  },
  { tool: 'point', label: 'Titik', hint: 'Pintu, fasilitas. Klik satu kali', Icon: MapPinIcon },
  {
    tool: 'path',
    label: 'Jalur',
    hint: 'Graf jalur pengunjung. Klik titik demi titik, klik dua kali untuk selesai',
    Icon: WaypointsIcon,
  },
  {
    tool: 'connector',
    label: 'Konektor',
    hint: 'Lift, eskalator, tangga, pintu gedung. Klik posisinya',
    Icon: ArrowUpDownIcon,
  },
];

const buttonClass =
  'flex size-10 cursor-pointer items-center justify-center rounded-sm text-ink hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-5';

function HistoryButton({
  label,
  shortcut,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-keyshortcuts={shortcut.replace('⌘', 'Meta+').replace('⇧', 'Shift+')}
          disabled={disabled}
          onClick={onClick}
          className={buttonClass}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <span className="font-bold">{label}</span>{' '}
        <kbd className="rounded-sm border border-line px-1 font-mono">{shortcut}</kbd>
      </TooltipContent>
    </Tooltip>
  );
}

export function EditorToolbar({ canEdit, session }: { canEdit: boolean; session: EditorSession }) {
  const canUndo = useEditorStore((s) => s.history.past.length > 0);
  const canRedo = useEditorStore((s) => s.history.future.length > 0);
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);
  return (
    <div
      role="toolbar"
      aria-label="Alat gambar"
      aria-orientation="vertical"
      className="flex flex-col gap-1 p-1"
    >
      {TOOLS.map(({ tool: value, label, hint, Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={label}
              aria-keyshortcuts={TOOL_SHORTCUTS[value]}
              aria-pressed={tool === value}
              disabled={!canEdit && value !== 'select'}
              onClick={() => setTool(value)}
              className={cn(
                buttonClass,
                tool === value && 'bg-signal-soft shadow-[inset_0_0_0_1px_var(--ink)]',
              )}
            >
              <Icon />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span className="font-bold">{label}</span>{' '}
            <kbd className="rounded-sm border border-line px-1 font-mono">
              {TOOL_SHORTCUTS[value]}
            </kbd>{' '}
            · {hint}
          </TooltipContent>
        </Tooltip>
      ))}
      {canEdit ? (
        <>
          <hr className="my-1 border-line" />
          <HistoryButton
            label="Urungkan"
            shortcut={UNDO_SHORTCUT.undo}
            disabled={!canUndo}
            onClick={session.undo}
          >
            <Undo2Icon />
          </HistoryButton>
          <HistoryButton
            label="Ulangi"
            shortcut={UNDO_SHORTCUT.redo}
            disabled={!canRedo}
            onClick={session.redo}
          >
            <Redo2Icon />
          </HistoryButton>
        </>
      ) : null}
    </div>
  );
}
