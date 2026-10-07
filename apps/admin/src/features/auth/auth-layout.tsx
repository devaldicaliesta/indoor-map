import { BrandLogo } from '@indoor/ui';
import type { ReactNode } from 'react';

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <div className="grid w-full max-w-sm gap-6">
        <div className="flex items-end gap-2">
          <BrandLogo className="h-10" />
          <span className="pb-0.5 text-ink-muted text-sm">Admin</span>
        </div>
        <section className="grid gap-4 rounded-lg border border-line bg-surface p-6">
          <div className="grid gap-1">
            <h1 className="font-bold text-lg">{title}</h1>
            <p className="text-ink-muted">{description}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

export function FormNotice({ tone, children }: { tone: 'info' | 'error'; children: ReactNode }) {
  return tone === 'error' ? (
    <p role="alert" className="border-danger border-l-4 bg-surface py-1 pl-3 text-danger">
      {children}
    </p>
  ) : (
    <p role="status" className="border-signal border-l-4 bg-signal-soft py-2 pl-3">
      {children}
    </p>
  );
}
