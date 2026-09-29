import type { EditorTool } from '@indoor/map-core';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@indoor/ui';
import { MapPinIcon, MousePointer2Icon, PentagonIcon, SplineIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { useEditorStore } from './editor-store';

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
];

export function EditorToolbar({ canEdit }: { canEdit: boolean }) {
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
              aria-pressed={tool === value}
              disabled={!canEdit && value !== 'select'}
              onClick={() => setTool(value)}
              className={cn(
                'flex size-10 cursor-pointer items-center justify-center rounded-sm text-ink hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-5',
                tool === value && 'bg-signal-soft shadow-[inset_0_0_0_1px_var(--ink)]',
              )}
            >
              <Icon />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span className="font-bold">{label}</span> · {hint}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
