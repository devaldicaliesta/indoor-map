import type { ReactNode } from 'react';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-line border-t pt-6">
      <h2 className="font-bold text-lg">{title}</h2>
      {children}
    </section>
  );
}
