import { Button, cn } from '@indoor/ui';
import {
  Building2Icon,
  FactoryIcon,
  GraduationCapIcon,
  HeadsetIcon,
  HospitalIcon,
  Layers3Icon,
  type LucideIcon,
  MonitorSmartphoneIcon,
  OctagonXIcon,
  PauseIcon,
  PenToolIcon,
  PlaneIcon,
  PlayIcon,
  QrCodeIcon,
  RouteIcon,
  SearchIcon,
  ServerIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TicketIcon,
  WifiOffIcon,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../language';
import { DEMO_URL } from '../trial/api';

const TONES = {
  canvas: 'bg-canvas',
  surface: 'bg-surface',
  night: 'bg-night text-on-night',
} as const;

export function Section({
  id,
  title,
  lead,
  tone = 'canvas',
  align = 'start',
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  tone?: keyof typeof TONES;
  align?: 'start' | 'center';
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-judul`}
      className={cn('scroll-mt-16 py-20', TONES[tone])}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4">
        <div className={cn('grid max-w-2xl gap-3', align === 'center' && 'mx-auto text-center')}>
          <h2 id={`${id}-judul`} className="display font-bold text-3xl sm:text-4xl">
            {title}
          </h2>
          {lead ? (
            <p
              className={cn('text-lg', tone === 'night' ? 'text-on-night-muted' : 'text-ink-muted')}
            >
              {lead}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Video motion graphic PanduArah: diputar otomatis tanpa suara kecuali pengguna meminta gerak
 * dikurangi; tombol putar/jeda selalu ada (WCAG 2.2.2).
 */
function MotionVideo() {
  const { copy } = useLanguage();
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element || reducedMotion()) return;
    element.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, []);
  function toggle() {
    const element = video.current;
    if (!element) return;
    if (element.paused) void element.play().then(() => setPlaying(true));
    else {
      element.pause();
      setPlaying(false);
    }
  }
  return (
    <figure className="relative m-0 overflow-hidden rounded-lg border border-night-line bg-night shadow-float">
      <video
        ref={video}
        className="block aspect-video w-full"
        poster="/media/panduarah-motion-poster.jpg"
        muted
        loop
        playsInline
        preload="none"
        aria-label={copy.hero.videoLabel}
        width={1280}
        height={720}
      >
        <source src="/media/panduarah-motion.webm" type="video/webm" />
      </video>
      <Button
        type="button"
        size="icon"
        onClick={toggle}
        aria-label={playing ? copy.hero.pause : copy.hero.play}
        className="absolute right-3 bottom-3 bg-surface/90"
      >
        {playing ? <PauseIcon strokeWidth={1.75} /> : <PlayIcon strokeWidth={1.75} />}
      </Button>
    </figure>
  );
}

/** Latar hero di separuh kanan: denah samar, ruang berbagi dinding seperti denah sungguhan. */
function HeroPlan() {
  const rooms = [
    [60, 40, 210, 250],
    [270, 40, 240, 250],
    [590, 40, 210, 250],
    [60, 330, 450, 250],
    [590, 330, 210, 250],
    [60, 660, 220, 180],
    [280, 660, 230, 180],
    [590, 660, 210, 180],
  ];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 800 840"
      preserveAspectRatio="xMinYMid slice"
      // Di layar sempit teks hero menempati seluruh lebar; denah hanya untuk layar lebar.
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block"
    >
      <g fill="none" stroke="var(--night-line)" strokeWidth="1.5">
        {rooms.map(([x, y, w, h]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />
        ))}
      </g>
    </svg>
  );
}

/**
 * Satu rute kuning (warna logo) mengelilingi video: dari titik asal di kiri bawah, menyusuri
 * bawah dan sisi kanan, sampai tujuan di atas. Koordinat persen mengikuti ukuran video, jadi
 * bentuknya sama di setiap lebar layar. Digambar sekali saat halaman dibuka (index.css).
 */
function HeroRoute() {
  const line = {
    fill: 'none',
    stroke: 'var(--signal)',
    strokeWidth: 10,
    strokeLinecap: 'round',
    pathLength: 1,
  } as const;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      // SVG absolut tidak meregang mengikuti inset; ukuran = video + 64 px lebar, + 88 px tinggi.
      // Mulai 1280 px: di bawahnya video menempel tepi layar sehingga sisi kanan rute terpotong.
      className="-top-10 -left-6 pointer-events-none absolute hidden h-[calc(100%+88px)] w-[calc(100%+64px)] overflow-visible xl:block"
    >
      <line {...line} className="hero-route hero-route-1" x1="0%" y1="100%" x2="100%" y2="100%" />
      <line {...line} className="hero-route hero-route-2" x1="100%" y1="100%" x2="100%" y2="0%" />
      <line {...line} className="hero-route hero-route-3" x1="100%" y1="0%" x2="82%" y2="0%" />
      <circle
        cx="0%"
        cy="100%"
        r="13"
        fill="var(--night)"
        stroke="var(--on-night)"
        strokeWidth="5"
      />
      <g className="hero-route-stop">
        <circle cx="82%" cy="0%" r="20" fill="var(--signal)" />
        <circle cx="82%" cy="0%" r="7" fill="var(--night)" />
      </g>
    </svg>
  );
}
export function Hero() {
  const { copy } = useLanguage();
  return (
    <section
      aria-labelledby="hero-judul"
      className="relative overflow-hidden bg-night text-on-night"
    >
      <HeroPlan />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-60 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-64">
        <div className="grid gap-7">
          <h1 id="hero-judul" className="display font-bold text-4xl sm:text-5xl lg:text-6xl">
            {copy.hero.title}
          </h1>
          <p className="max-w-xl text-lg text-on-night-muted">{copy.hero.lead}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="primary">
              <a href="#trial">{copy.hero.primary}</a>
            </Button>
            {/* Demo publik = Visitor sungguhan berisi venue demo (T-613), bukan cuplikan. */}
            <Button
              asChild
              variant="ghost"
              className="border border-on-night-muted text-on-night hover:bg-night-raised"
            >
              <a href={DEMO_URL}>{copy.hero.secondary}</a>
            </Button>
          </div>
          <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-4">
            {copy.hero.facts.map(([value, label]) => (
              <li key={value} className="border-signal border-l-4 pl-3">
                <strong className="block">{value}</strong>
                <span className="text-on-night-muted text-sm">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <HeroRoute />
          <MotionVideo />
        </div>
      </div>
    </section>
  );
}

/** Piktogram ala papan penunjuk arah: simbol di kotak biru logo. */
function Pictogram({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-night text-on-night">
      <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
    </span>
  );
}

const BUILDING_ICONS = [
  ShoppingBagIcon,
  HospitalIcon,
  GraduationCapIcon,
  Building2Icon,
  PlaneIcon,
  FactoryIcon,
  TicketIcon,
];

export function Buildings() {
  const { copy } = useLanguage();
  return (
    <Section
      id="gedung"
      title={copy.buildings.title}
      lead={copy.buildings.lead}
      tone="canvas"
      align="center"
    >
      <ul className="m-0 grid list-none gap-x-8 gap-y-10 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {copy.buildings.items.map(([title, body], i) => (
          <li key={title} className="flex gap-4">
            <Pictogram icon={BUILDING_ICONS[i] ?? Building2Icon} />
            <div className="grid content-start gap-1">
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-ink-muted">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const FEATURE_ICONS = [
  Layers3Icon,
  RouteIcon,
  QrCodeIcon,
  MonitorSmartphoneIcon,
  SearchIcon,
  OctagonXIcon,
  PenToolIcon,
  WifiOffIcon,
];

export function Features() {
  const { copy } = useLanguage();
  return (
    <section id="fitur" aria-labelledby="fitur-judul" className="scroll-mt-16 bg-surface py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1fr_2fr]">
        <h2
          id="fitur-judul"
          className="display font-bold text-3xl sm:text-4xl lg:sticky lg:top-24 lg:self-start"
        >
          {copy.features.title}
        </h2>
        <ul className="m-0 grid list-none gap-x-10 p-0 sm:grid-cols-2">
          {copy.features.items.map(([title, body], i) => {
            const Icon = FEATURE_ICONS[i] ?? Layers3Icon;
            return (
              <li key={title} className="grid content-start gap-2 border-line border-t py-6">
                <Icon aria-hidden="true" className="size-6 text-accent-blue" strokeWidth={1.75} />
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-ink-muted">{body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const { copy } = useLanguage();
  return (
    <Section id="cara-kerja" title={copy.how.title} tone="canvas">
      <ol className="m-0 grid list-none gap-8 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {copy.how.steps.map(([title, body], i) => (
          <li key={title} className="grid content-start gap-3 border-signal border-t-4 pt-5">
            <span
              className="flex size-9 items-center justify-center rounded-sm bg-signal font-bold text-on-signal"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-ink-muted">{body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Licensing() {
  const { copy } = useLanguage();
  const icons = [ServerIcon, ShieldCheckIcon, HeadsetIcon];
  return (
    <Section id="lisensi" title={copy.license.title} lead={copy.license.lead} tone="night">
      <ul className="m-0 grid list-none gap-8 p-0 md:grid-cols-3">
        {copy.license.items.map(([title, body], i) => {
          const Icon = icons[i] ?? ServerIcon;
          return (
            <li key={title} className="grid content-start gap-3 border-night-line border-t pt-6">
              <Icon aria-hidden="true" className="size-7 text-signal" strokeWidth={1.75} />
              <h3 className="font-bold text-xl">{title}</h3>
              <p className="text-on-night-muted">{body}</p>
            </li>
          );
        })}
      </ul>
      <div>
        <Button asChild variant="primary">
          <a href="#kontak">{copy.nav.contact}</a>
        </Button>
      </div>
    </Section>
  );
}

/** Tangkapan layar sebagai baris bergantian: gambar besar, judul, dan apa yang terlihat. */
export function Screens() {
  const { copy } = useLanguage();
  return (
    <Section id="tangkapan-layar" title={copy.screens.title} tone="surface" align="center">
      <ul className="m-0 grid list-none gap-20 p-0">
        {copy.screens.items.map(([file, caption, detail], i) => (
          <li key={file} className="grid items-center gap-8 lg:grid-cols-[2fr_3fr] lg:gap-14">
            <div className={cn('grid gap-3', i % 2 === 1 && 'lg:order-last')}>
              <h3 className="display font-bold text-2xl">{caption}</h3>
              <p className="text-ink-muted text-lg">{detail}</p>
            </div>
            <img
              src={`/screens/${file}.jpg`}
              // Isi gambar dijelaskan judul di sampingnya; alt kosong agar tidak dibacakan dua kali.
              alt=""
              width={1280}
              height={800}
              loading="lazy"
              decoding="async"
              className="h-auto w-full rounded-lg border border-line bg-surface shadow-float"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
