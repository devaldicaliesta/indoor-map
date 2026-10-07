import type { CSSProperties } from 'react';
import { cn } from '../lib/utils';
import {
  LOGO_HEIGHT,
  LOGO_WIDTH,
  SYMBOL_BLUE,
  SYMBOL_WIDTH,
  SYMBOL_YELLOW,
  WORDMARK,
} from './logo-paths';
import { PRODUCT_NAME } from './product';

interface BrandMarkProps {
  /** `white`: satu warna putih untuk latar gelap, tanpa kotak latar. */
  tone?: 'color' | 'white';
  /**
   * Nama yang dibacakan pembaca layar. Kosongkan bila nama produk sudah tertulis di dekatnya
   * agar tidak dibacakan dua kali.
   */
  label?: string;
  /** Ukuran lewat tinggi (mis. `h-8`); lebar mengikuti proporsi logo. */
  className?: string;
}

interface Part {
  d: string;
  fill: string;
}

const SYMBOL_PARTS: readonly Part[] = [
  { d: SYMBOL_BLUE, fill: 'var(--brand-blue)' },
  { d: SYMBOL_YELLOW, fill: 'var(--brand-yellow)' },
];

function Mark({
  parts,
  width,
  kind,
  tone = 'color',
  label = PRODUCT_NAME,
  className,
}: BrandMarkProps & { parts: readonly Part[]; width: number; kind: 'logo' | 'symbol' }) {
  const style: CSSProperties = { aspectRatio: `${width} / ${LOGO_HEIGHT}` };
  return (
    <svg
      viewBox={`0 0 ${width} ${LOGO_HEIGHT}`}
      data-brand={kind}
      data-tone={tone}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={style}
      className={cn('h-8 w-auto shrink-0', className)}
    >
      {parts.map((part) => (
        <path
          key={part.fill}
          d={part.d}
          fill={tone === 'white' ? 'var(--on-strong)' : part.fill}
          fillRule="evenodd"
        />
      ))}
    </svg>
  );
}

/**
 * Logo resmi PanduArah (simbol + tulisan), digambar dari hasil jiplak vektor berkas pemilik
 * (`docs/brand`). Bentuk dan warna tidak boleh diubah; ubah sumbernya lewat
 * `scripts/brand-assets.mjs`.
 */
export function BrandLogo(props: BrandMarkProps) {
  // Path tulisan hanya dirujuk di sini agar bundel yang memakai simbol saja (Visitor) tidak
  // ikut memuatnya: bundel utama Visitor dibatasi 2 MiB oleh precache service worker.
  const parts = [...SYMBOL_PARTS, { d: WORDMARK, fill: 'var(--brand-ink)' }];
  return <Mark {...props} parts={parts} width={LOGO_WIDTH} kind="logo" />;
}

/** Simbol PanduArah saja: sidebar diciutkan, ikon bawaan Visitor saat venue tanpa logo. */
export function BrandSymbol(props: BrandMarkProps) {
  return <Mark {...props} parts={SYMBOL_PARTS} width={SYMBOL_WIDTH} kind="symbol" />;
}
