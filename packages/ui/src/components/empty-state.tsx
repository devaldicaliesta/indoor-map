import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/utils';

interface EmptyStateProps extends Omit<ComponentProps<'section'>, 'title'> {
  title: ReactNode;
  /** Kalimat langkah berikutnya, misalnya "Tambah gedung pertama untuk mulai menggambar peta." */
  description: ReactNode;
  /** Satu aksi saja, biasanya `<Button variant="primary">`. */
  action?: ReactNode;
}

function EmptyState({ className, title, description, action, ...props }: EmptyStateProps) {
  return (
    <section
      data-slot="empty-state"
      className={cn(
        'flex max-w-md flex-col items-start gap-2 border border-line border-dashed bg-surface p-(--panel-padding)',
        className,
      )}
      {...props}
    >
      <h2 className="font-bold text-lg">{title}</h2>
      <p className="text-ink-muted">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </section>
  );
}

export { EmptyState, type EmptyStateProps };
