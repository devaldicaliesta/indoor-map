import { Button } from '@indoor/ui';
import { Component, lazy, type ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../language';
import { DEMO_URL } from '../trial/api';

// MapLibre dan data demo cukup besar, jadi dimuat hanya saat kartu demo sebagian besar terlihat
// (atau tombol diklik). Kartu menembus tepi bawah hero, sehingga baru tampil sedikit saat halaman
// dibuka; ambang 50% menjaga halaman pertama tetap cepat di HP.
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

/** Peta demo 3D di kartu yang menembus hero, lalu judul bagiannya di bawah. */
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
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [load]);
  const placeholder = (
    <div className="relative flex h-[460px] items-center justify-center overflow-hidden rounded-lg border border-line bg-canvas sm:h-[560px]">
      <img
        src="/screens/visitor-concert.jpg"
        alt=""
        width={1280}
        height={800}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover opacity-60"
      />
      {load ? (
        <span className="relative rounded-sm bg-surface px-3 py-2 font-bold text-ink">
          {copy.demo.loading}
        </span>
      ) : (
        <Button type="button" variant="primary" className="relative" onClick={() => setLoad(true)}>
          {copy.demo.load}
        </Button>
      )}
    </div>
  );
  return (
    <section
      id="demo"
      aria-labelledby="demo-judul"
      // Kartu naik 160 px ke hero; jarak gulir menyisakan ruang untuk kepala halaman.
      className="scroll-mt-52 bg-surface pb-20"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4">
        <div
          ref={anchor}
          className="-mt-40 relative min-w-0 rounded-lg border border-line bg-surface p-3 shadow-float sm:p-4"
        >
          {load ? (
            <DemoBoundary
              fallback={
                <p className="rounded-lg border border-line bg-canvas p-6">{copy.demo.failed}</p>
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
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="grid max-w-2xl gap-3">
            <h2 id="demo-judul" className="display font-bold text-3xl sm:text-4xl">
              {copy.demo.title}
            </h2>
            <p className="text-ink-muted text-lg">{copy.demo.lead}</p>
          </div>
          <Button asChild className="w-fit">
            <a href={DEMO_URL}>{copy.demo.full}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
