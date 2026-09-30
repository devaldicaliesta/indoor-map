import { cn } from '@indoor/ui';
import { ChevronRightIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Satu baris daftar pengunjung (hasil cari, anggota kategori, direktori): tombol setinggi target
 * sentuh dengan judul, keterangan, dan status opsional. Daftarnya memakai garis pemisah
 * (`divide-y`), bukan kartu.
 */
export function ListRow({
  icon,
  title,
  subtitle,
  status,
  mono = false,
  onClick,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string | null;
  status?: ReactNode;
  /** Judul berupa kode (unit) memakai font mono. */
  mono?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-(--control-height) w-full cursor-pointer items-center gap-3 py-2 text-left hover:bg-canvas"
    >
      {icon}
      <span className="grid min-w-0 flex-1">
        <span className={cn('truncate font-bold', mono && 'font-mono')}>{title}</span>
        {subtitle ? <span className="truncate text-ink-muted text-sm">{subtitle}</span> : null}
        {status}
      </span>
      <ChevronRightIcon aria-hidden="true" strokeWidth={1.75} className="size-4 text-ink-muted" />
    </button>
  );
}
