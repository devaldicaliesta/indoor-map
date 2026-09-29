import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-(--control-height) w-full min-w-0 rounded-sm border border-ink-muted bg-surface px-3 text-ink placeholder:text-ink-muted disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger file:border-0 file:bg-transparent file:font-bold',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
