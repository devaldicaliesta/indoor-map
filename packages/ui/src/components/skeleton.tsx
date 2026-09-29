import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

/** Pengganti spinner: bentuknya mengikuti konten yang sedang dimuat. */
function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('animate-pulse rounded-sm bg-line', className)}
      {...props}
    />
  );
}

export { Skeleton };
