import { FEATURE_KINDS, type FeatureKind } from '@indoor/domain';
import { cn } from '@indoor/ui';
import { ChevronRightIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { featureList, useEditorStore } from './editor-store';
import { FEATURE_KIND_LABELS } from './labels';

const collator = new Intl.Collator('id-ID', { numeric: true, sensitivity: 'base' });
const labelOf = (f: ReturnType<typeof featureList>[number]) =>
  f.properties.unitCode ??
  f.properties.name ??
  `${FEATURE_KIND_LABELS[f.properties.kind]} tanpa nama`;

/** Panel daftar fitur per jenis; isi grup baru dirender saat dibuka (lantai bisa 1.000 fitur). */
export function FeatureList({ floorName }: { floorName: string }) {
  const features = useEditorStore((s) => s.features);
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.select);
  const [open, setOpen] = useState<Set<FeatureKind>>(new Set());

  const groups = useMemo(() => {
    const byKind = new Map<FeatureKind, ReturnType<typeof featureList>>();
    for (const f of featureList(features)) {
      const list = byKind.get(f.properties.kind) ?? [];
      list.push(f);
      byKind.set(f.properties.kind, list);
    }
    return FEATURE_KINDS.flatMap((kind) => {
      const list = byKind.get(kind);
      return list
        ? [{ kind, list: list.sort((a, b) => collator.compare(labelOf(a), labelOf(b))) }]
        : [];
    });
  }, [features]);

  // Grup yang memuat fitur terpilih ikut terbuka.
  const selectedKind = selectedId ? features[selectedId]?.properties.kind : undefined;
  const current = useRef<HTMLButtonElement>(null);
  // Gulir setiap kali seleksi berganti (juga saat dipilih dari peta).
  useEffect(() => current.current?.scrollIntoView({ block: 'nearest' }), [selectedId]);

  return (
    <nav aria-label={`Fitur lantai ${floorName}`} className="grid content-start gap-1 p-3">
      <h2 className="px-1 pb-1 font-bold">Fitur {floorName}</h2>
      {groups.length === 0 ? (
        <p className="px-1 text-ink-muted text-sm">
          Belum ada fitur. Pilih alat Poligon, Garis, atau Titik di sebelah kiri.
        </p>
      ) : null}
      {groups.map(({ kind, list }) => {
        const expanded = open.has(kind) || selectedKind === kind;
        return (
          <div key={kind}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  if (next.has(kind)) next.delete(kind);
                  else next.add(kind);
                  return next;
                })
              }
              className="flex w-full cursor-pointer items-center gap-1 rounded-sm px-1 py-1.5 text-left hover:bg-canvas"
            >
              <ChevronRightIcon
                className={cn('size-4 transition-transform', expanded && 'rotate-90')}
              />
              {FEATURE_KIND_LABELS[kind]}
              <span className="ml-auto font-mono text-ink-muted tabular-nums">{list.length}</span>
            </button>
            {expanded ? (
              <ul className="grid">
                {list.map((f) => (
                  <li key={f.properties.id}>
                    <button
                      ref={f.properties.id === selectedId ? current : undefined}
                      type="button"
                      aria-current={f.properties.id === selectedId}
                      onClick={() => select(f.properties.id)}
                      className="w-full cursor-pointer truncate rounded-sm py-1 pr-1 pl-6 text-left text-sm hover:bg-canvas aria-[current=true]:bg-signal-soft aria-[current=true]:font-bold"
                    >
                      {f.properties.unitCode ??
                        f.properties.name ??
                        `${FEATURE_KIND_LABELS[kind]} tanpa nama`}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
