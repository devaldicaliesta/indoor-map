import { cn } from '@indoor/ui';
import { ChevronDownIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import type { GraphStatus } from './graph-status';

type LegendStyle = 'path' | 'inaccessible' | 'closed' | 'isolated';

const count = new Intl.NumberFormat('id-ID');

/** Contoh gaya graf di peta, digambar dengan token warna yang sama. */
function Swatch({ style }: { style: LegendStyle }) {
  const hatchId = useId();
  return (
    <svg viewBox="0 0 28 14" className="h-3.5 w-7 shrink-0" aria-hidden="true">
      {style === 'closed' ? (
        <>
          <defs>
            <pattern
              id={hatchId}
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="1.5" height="4" className="fill-danger" opacity="0.4" />
            </pattern>
          </defs>
          <rect y="1" width="28" height="12" fill={`url(#${hatchId})`} />
        </>
      ) : null}
      {style === 'isolated' ? (
        <>
          <circle cx="14" cy="7" r="5.5" fill="none" className="stroke-warn" strokeWidth="2" />
          <circle cx="14" cy="7" r="2.5" className="fill-surface stroke-ink" strokeWidth="1" />
        </>
      ) : (
        <line
          x1="0"
          y1="7"
          x2="28"
          y2="7"
          strokeWidth="2"
          className={style === 'closed' ? 'stroke-danger' : 'stroke-ink'}
          strokeDasharray={style === 'inaccessible' ? '6 4' : undefined}
        />
      )}
    </svg>
  );
}

const ITEMS: { style: LegendStyle; label: string; hint: string }[] = [
  { style: 'path', label: 'Jalur', hint: 'Edge yang bisa dilalui kursi roda' },
  { style: 'inaccessible', label: 'Tidak aksesibel', hint: 'Tidak dipakai rute kursi roda' },
  { style: 'closed', label: 'Tertutup', hint: 'Penutupan sementara yang sedang berlaku' },
  { style: 'isolated', label: 'Terisolasi', hint: 'Tidak terhubung ke jaringan jalur utama venue' },
];

function VisibilityToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        className="size-4 accent-ink"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

/** Legenda kecil gaya graf dan sakelar tampil node/edge di pojok kanvas editor. */
export function GraphLegend({ status }: { status: GraphStatus }) {
  const visibility = useEditorStore((s) => s.graphVisibility);
  const setVisible = useEditorStore((s) => s.setGraphVisible);
  const [open, setOpen] = useState(true);
  const headingId = useId();
  const listId = useId();
  const isolated = status.isolated.size;
  return (
    <section
      aria-labelledby={headingId}
      className="grid w-48 gap-2 rounded-md bg-surface p-3 text-sm shadow-(--shadow-float)"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="font-bold">
          Graf jalur
        </h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={open ? 'Sembunyikan legenda' : 'Tampilkan legenda'}
          onClick={() => setOpen(!open)}
          className="-m-1 flex size-6 cursor-pointer items-center justify-center rounded-sm hover:bg-canvas"
        >
          <ChevronDownIcon className={cn('size-4', !open && 'rotate-180')} />
        </button>
      </div>
      <div className="flex gap-4">
        <VisibilityToggle
          label="Node"
          checked={visibility.nodes}
          onChange={(checked) => setVisible('nodes', checked)}
        />
        <VisibilityToggle
          label="Edge"
          checked={visibility.edges}
          onChange={(checked) => setVisible('edges', checked)}
        />
      </div>
      {open ? (
        <ul id={listId} className="grid gap-1.5 border-line border-t pt-2">
          {ITEMS.map(({ style, label, hint }) => (
            <li key={style} className="flex items-center gap-2" title={hint}>
              <Swatch style={style} />
              <span>{label}</span>
              {style === 'isolated' && isolated > 0 ? (
                <span className="ml-auto font-mono text-ink-muted text-xs tabular-nums">
                  {count.format(isolated)}
                  <span className="sr-only"> node di lantai ini</span>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
