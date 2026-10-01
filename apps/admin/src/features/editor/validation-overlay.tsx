import { GEOMETRY_ISSUE_CODES, type GeometryIssueCode, type ValidationIssue } from '@indoor/domain';
import { type MapInstance, setIssueHighlight } from '@indoor/map-core';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  StatusDot,
} from '@indoor/ui';
import { useEffect, useRef } from 'react';
import { useEditorStore } from './store/editor-store';

export function ValidationOverlay({
  map,
  featureIds,
}: {
  map: MapInstance | null;
  featureIds: readonly string[];
}) {
  // Setiap aksi menghasilkan array baru; filter peta (dan repaint) hanya bila isinya berubah.
  const key = featureIds.join(',');
  const latest = useRef(featureIds);
  latest.current = featureIds;
  useEffect(() => {
    if (map) setIssueHighlight(map, latest.current);
  }, [map, key]);
  return null;
}

const count = new Intl.NumberFormat('id-ID');

/** Judul kelompok temuan di ringkasan. */
const ISSUE_TITLES: Record<GeometryIssueCode, string> = {
  polygon_not_closed: 'Poligon tidak tertutup',
  polygon_self_intersection: 'Poligon memotong diri',
  unit_overlap: 'Unit tumpang tindih',
  outside_floor: 'Di luar batas gedung',
  duplicate_unit_code: 'Kode unit ganda',
};
/** Menu dengan ratusan butir terasa berat; sisanya tetap terlihat lewat ikon di daftar fitur. */
const ITEMS_PER_GROUP = 20;

/**
 * Ringkasan di bilah atas editor (05-desain-ui.md "● 3 Error"): jumlah temuan lantai ini,
 * dikelompokkan per jenis; setiap temuan bisa diklik untuk memilih fitur dan mengarahkan
 * peta ke sana.
 */
export function ValidationSummary({ issues }: { issues: readonly ValidationIssue[] }) {
  const focus = useEditorStore((s) => s.focus);
  if (issues.length === 0) {
    return (
      <span className="text-sm">
        <StatusDot tone="ok">Geometri valid</StatusDot>
      </span>
    );
  }
  const groups = GEOMETRY_ISSUE_CODES.flatMap((code) => {
    const list = issues.filter((i) => i.code === code);
    return list.length ? [{ code, list }] : [];
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" aria-label={`${issues.length} temuan validasi geometri`}>
          <StatusDot tone="danger">{count.format(issues.length)} temuan</StatusDot>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)]">
        {groups.map(({ code, list }, index) => (
          <DropdownMenuGroup key={code}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>
              {ISSUE_TITLES[code]} · {count.format(list.length)}
            </DropdownMenuLabel>
            {list.slice(0, ITEMS_PER_GROUP).map((issue) => (
              <DropdownMenuItem
                key={issue.featureIds.join('-')}
                className="items-start whitespace-normal"
                onSelect={() => {
                  const [first] = issue.featureIds;
                  if (first) focus(first);
                }}
              >
                {issue.message}
              </DropdownMenuItem>
            ))}
            {list.length > ITEMS_PER_GROUP ? (
              <p className="px-2 py-1 text-ink-muted text-sm">
                dan {count.format(list.length - ITEMS_PER_GROUP)} lainnya, bertanda merah di daftar
                fitur.
              </p>
            ) : null}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
