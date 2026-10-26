import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useId } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import {
  clampPage,
  isPageSize,
  PAGE_SIZES,
  pageBounds,
  pageCount,
  pageWindow,
  type TableController,
} from './table-state';

const number = new Intl.NumberFormat('id-ID');

/** Baris per halaman, posisi "26–50 dari 212", dan nomor halaman. */
export function TablePagination({
  table,
  label,
  total,
}: {
  table: TableController;
  label: string;
  total: number;
}) {
  const { size } = table.state;
  const count = pageCount(total, size);
  const page = clampPage(table.state.page, total, size);
  const { first, last } = pageBounds(page, size, total);
  const sizeLabel = useId();

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
      data-tour="table-pagination"
    >
      <div className="flex items-center gap-2">
        <span id={sizeLabel} className="text-ink-muted">
          Baris per halaman
        </span>
        <Select
          value={String(size)}
          onValueChange={(value) => {
            const next = Number(value);
            if (isPageSize(next)) table.setSize(next);
          }}
        >
          <SelectTrigger aria-labelledby={sizeLabel} className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <p role="status" className="font-mono tabular-nums">
          {total === 0
            ? `0 dari 0`
            : `${number.format(first)}–${number.format(last)} dari ${number.format(total)}`}
        </p>
        <nav aria-label={`Halaman ${label.toLowerCase()}`} className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            aria-label="Halaman sebelumnya"
            disabled={page <= 1}
            onClick={() => table.setPage(page - 1)}
          >
            <ChevronLeftIcon aria-hidden="true" strokeWidth={1.75} />
          </Button>
          {pageWindow(page, count).map((p, i) =>
            p === null ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: elipsis tidak punya identitas selain posisinya.
              <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink-muted">
                …
              </span>
            ) : (
              <Button
                key={p}
                size="sm"
                variant="ghost"
                aria-label={`Halaman ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'min-w-8 px-2 font-mono tabular-nums',
                  p === page && 'bg-signal-soft hover:bg-signal-soft',
                )}
                onClick={() => table.setPage(p)}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            size="sm"
            variant="ghost"
            aria-label="Halaman berikutnya"
            disabled={page >= count}
            onClick={() => table.setPage(page + 1)}
          >
            <ChevronRightIcon aria-hidden="true" strokeWidth={1.75} />
          </Button>
        </nav>
      </div>
    </div>
  );
}
