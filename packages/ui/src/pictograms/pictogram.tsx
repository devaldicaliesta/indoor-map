import type { PictogramKey } from '@indoor/domain';
import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';
import { PICTOGRAM_SHAPES, type PictogramPart } from './shapes';

function partAttributes(part: PictogramPart) {
  return part.stroke
    ? {
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: part.stroke,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
      }
    : { fill: 'currentColor', fillRule: 'evenodd' as const };
}

/** Piktogram bawaan sebagai elemen SVG; warnanya mengikuti `color` teks induk. */
export function Pictogram({
  name,
  className,
  ...props
}: { name: PictogramKey } & ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('size-5 shrink-0', className)}
      {...props}
    >
      {PICTOGRAM_SHAPES[name].map((part) => (
        <path key={part.d} d={part.d} {...partAttributes(part)} />
      ))}
    </svg>
  );
}

/**
 * Piktogram sebagai teks SVG mandiri (untuk sprite peta). Hanya berisi path dari set
 * bawaan, tanpa skrip atau rujukan luar.
 */
export function pictogramSvg(name: PictogramKey, size = 96, color = '#000000'): string {
  const paths = PICTOGRAM_SHAPES[name]
    .map((part) =>
      part.stroke
        ? `<path d="${part.d}" fill="none" stroke="${color}" stroke-width="${part.stroke}" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="${part.d}" fill="${color}" fill-rule="evenodd"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">${paths}</svg>`;
}
