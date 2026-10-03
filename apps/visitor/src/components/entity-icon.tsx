import { parseFacilityIcon } from '@indoor/domain';
import { categoryUnitColors } from '@indoor/map-core';
import { cn, Pictogram } from '@indoor/ui';
import { data } from '../data/client';

/**
 * Ikon kategori atau jenis fasilitas: piktogram di dalam lingkaran (05-desain-ui.md), fasilitas
 * keselamatan berlatar merah. Tanpa ikon tampil titik kecil agar deretan tetap sejajar. `color`
 * (warna kategori) memberi latar dan tepi yang sama dengan unit di peta, sehingga chip menjadi legenda.
 */
export function EntityIcon({
  icon,
  safety = false,
  color = null,
  className,
}: {
  icon: string | null;
  safety?: boolean;
  color?: string | null | undefined;
  className?: string;
}) {
  const parsed = parseFacilityIcon(icon);
  const tone = color && !safety ? categoryUnitColors(color) : null;
  return (
    <span
      aria-hidden="true"
      style={
        tone
          ? { backgroundColor: tone.fill, borderColor: tone.outline, color: tone.outline }
          : undefined
      }
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-full border',
        safety ? 'border-danger bg-danger text-on-strong' : 'border-line bg-surface text-ink',
        className,
      )}
    >
      {parsed?.kind === 'builtin' ? (
        <Pictogram name={parsed.key} className="size-4" />
      ) : parsed ? (
        <img src={data.snapshots.assetUrl(parsed.path)} alt="" className="size-4 object-contain" />
      ) : (
        <span className="size-2 rounded-full bg-current" />
      )}
    </span>
  );
}
