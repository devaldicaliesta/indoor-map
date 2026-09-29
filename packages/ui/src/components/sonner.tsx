import type { CSSProperties } from 'react';
import { Toaster as Sonner, type ToasterProps, toast } from 'sonner';

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--surface)',
          '--normal-text': 'var(--ink)',
          '--normal-border': 'var(--line)',
          '--success-bg': 'var(--surface)',
          '--success-text': 'var(--ink)',
          '--success-border': 'var(--ok)',
          '--error-bg': 'var(--surface)',
          '--error-text': 'var(--ink)',
          '--error-border': 'var(--danger)',
          '--border-radius': '4px',
        } as CSSProperties
      }
      toastOptions={{
        classNames: { toast: 'font-sans shadow-float', description: 'text-ink-muted' },
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
