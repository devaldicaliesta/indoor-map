import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

const dotVariants = cva('size-2 shrink-0 rounded-full', {
  variants: {
    tone: {
      ok: 'bg-ok',
      warn: 'bg-warn',
      danger: 'bg-danger',
      route: 'bg-route',
      neutral: 'bg-ink-muted',
    },
    hollow: { true: 'border-2 bg-transparent' },
  },
  compoundVariants: [
    { tone: 'ok', hollow: true, className: 'border-ok' },
    { tone: 'warn', hollow: true, className: 'border-warn' },
    { tone: 'danger', hollow: true, className: 'border-danger' },
    { tone: 'route', hollow: true, className: 'border-route' },
    { tone: 'neutral', hollow: true, className: 'border-ink-muted' },
  ],
  defaultVariants: { tone: 'neutral', hollow: false },
});

/** Status = titik berwarna + teks; warna tidak pernah menjadi satu-satunya pembeda. */
function StatusDot({
  className,
  tone,
  hollow,
  children,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof dotVariants>) {
  return (
    <span
      data-slot="status-dot"
      className={cn('inline-flex items-center gap-2 text-ink', className)}
      {...props}
    >
      <span aria-hidden="true" className={dotVariants({ tone, hollow })} />
      {children}
    </span>
  );
}

export { StatusDot };
