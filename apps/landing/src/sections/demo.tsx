import { Button } from '@indoor/ui';
import { Component, lazy, type ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../language';
import { Section } from './content';

// MapLibre dan data demo cukup besar, jadi dimuat hanya saat bagian demo hampir terlihat agar
// halaman pertama tetap cepat di HP.
const DemoMap = lazy(() => import('../demo/demo-map'));

/** Galat peta (mis. WebGL hilang) cukup mengganti bagian demo, bukan mengosongkan halaman. */
class DemoBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Demo() {
  const { copy } = useLanguage();
  const anchor = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const element = anchor.current;
    if (!element || load) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setLoad(true);
      },
      { rootMargin: '300px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [load]);
  const placeholder = (
    <div className="flex h-[460px] items-center justify-center rounded-lg border border-line bg-surface sm:h-[560px]">
      {load ? (
        <span className="text-ink-muted">{copy.demo.loading}</span>
      ) : (
        <Button type="button" variant="primary" onClick={() => setLoad(true)}>
          {copy.demo.load}
        </Button>
      )}
    </div>
  );
  return (
    <Section id="demo" title={copy.demo.title} lead={copy.demo.lead}>
      <div ref={anchor} className="min-w-0">
        {load ? (
          <DemoBoundary
            fallback={
              <p className="rounded-lg border border-line bg-surface p-6">{copy.demo.failed}</p>
            }
          >
            <Suspense fallback={placeholder}>
              <DemoMap />
            </Suspense>
          </DemoBoundary>
        ) : (
          placeholder
        )}
      </div>
    </Section>
  );
}
