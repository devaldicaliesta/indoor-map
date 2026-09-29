import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

// Tinggi dari --control-height: 36 px Admin, 44 px Visitor, 60 px Info Point.
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: 'bg-signal text-ink hover:bg-signal-soft',
        secondary: 'border border-line bg-surface text-ink hover:bg-canvas',
        ghost: 'text-ink hover:bg-canvas',
        danger: 'bg-danger text-on-strong hover:bg-danger/90',
        link: 'h-auto px-0 text-ink underline underline-offset-4 hover:text-ink-muted',
      },
      size: {
        default: 'h-(--control-height) px-4',
        sm: 'h-8 px-3 text-sm',
        icon: 'size-(--control-height)',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'default' },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

/** Satu aksi utama per layar memakai `variant="primary"`; sisanya `secondary`. */
function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
