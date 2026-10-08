import { Button, cn } from '@indoor/ui';
import {
  Building2Icon,
  FactoryIcon,
  GraduationCapIcon,
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
  TimerIcon,
  WifiOffIcon,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../language';

export function Section({
  id,
  title,
  lead,
  tone = 'canvas',
  children,
}: {
  id: string;
  title: string;
  lead?: string;
  tone?: 'canvas' | 'surface';
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-judul`}
      className={cn('scroll-mt-16 py-16', tone === 'surface' ? 'bg-surface' : 'bg-canvas')}
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4">
        <div className="grid max-w-2xl gap-3">
          <h2 id={`${id}-judul`} className="font-bold text-3xl leading-tight">
            {title}
          </h2>
          {lead ? <p className="text-ink-muted text-lg">{lead}</p> : null}
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
    <figure className="relative m-0 overflow-hidden rounded-lg border border-line bg-ink shadow-float">
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

export function Hero() {
  const { copy } = useLanguage();
  return (
    <section aria-labelledby="hero-judul" className="bg-surface">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1fr_1.1fr] lg:py-20">
        <div className="grid gap-6">
          <p className="w-fit rounded-sm bg-signal-soft px-2 py-1 font-bold text-sm uppercase tracking-wide">
            {copy.hero.eyebrow}
          </p>
          <h1 id="hero-judul" className="font-bold text-4xl leading-tight sm:text-5xl">
            {copy.hero.title}
          </h1>
          <p className="text-ink-muted text-lg">{copy.hero.lead}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="primary">
              <a href="#trial">{copy.hero.primary}</a>
            </Button>
            <Button asChild>
              <a href="#demo">{copy.hero.secondary}</a>
            </Button>
          </div>
          <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-4">
            {copy.hero.facts.map(([value, label]) => (
              <li key={value} className="border-signal border-l-4 pl-3">
                <strong className="block">{value}</strong>
                <span className="text-ink-muted text-sm">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <MotionVideo />
      </div>
    </section>
  );
}

function CardGrid({ items, icons }: { items: string[][]; icons: LucideIcon[] }) {
  return (
    <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([title, body], i) => {
        const Icon = icons[i] ?? Layers3Icon;
        return (
          <li
            key={title}
            className="grid content-start gap-2 rounded-lg border border-line bg-surface p-5"
          >
            <span className="flex size-10 items-center justify-center rounded-sm bg-signal-soft">
              <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
            </span>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-ink-muted">{body}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function Buildings() {
  const { copy } = useLanguage();
  return (
    <Section id="gedung" title={copy.buildings.title} lead={copy.buildings.lead}>
      <CardGrid
        items={copy.buildings.items}
        icons={[
          ShoppingBagIcon,
          HospitalIcon,
          GraduationCapIcon,
          Building2Icon,
          PlaneIcon,
          FactoryIcon,
          TicketIcon,
        ]}
      />
    </Section>
  );
}

export function Features() {
  const { copy } = useLanguage();
  return (
    <Section id="fitur" title={copy.features.title} tone="surface">
      <CardGrid
        items={copy.features.items}
        icons={[
          Layers3Icon,
          RouteIcon,
          QrCodeIcon,
          MonitorSmartphoneIcon,
          SearchIcon,
          OctagonXIcon,
          PenToolIcon,
          WifiOffIcon,
        ]}
      />
    </Section>
  );
}

export function HowItWorks() {
  const { copy } = useLanguage();
  return (
    <Section id="cara-kerja" title={copy.how.title} tone="surface">
      <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {copy.how.steps.map(([title, body], i) => (
          <li key={title} className="grid content-start gap-2 border-ink border-t-4 pt-4">
            <span className="font-bold font-mono text-ink-muted" aria-hidden="true">
              0{i + 1}
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
  const icons = [ServerIcon, ShieldCheckIcon, TimerIcon];
  return (
    <Section id="lisensi" title={copy.license.title} lead={copy.license.lead}>
      <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
        {copy.license.items.map(([title, body], i) => {
          const Icon = icons[i] ?? ServerIcon;
          return (
            <li key={title} className="grid content-start gap-2 rounded-lg bg-ink p-6 text-surface">
              <Icon aria-hidden="true" className="size-6 text-signal" strokeWidth={1.75} />
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-line">{body}</p>
            </li>
          );
        })}
      </ul>
      <div>
        <Button asChild variant="primary">
          <a href="#trial">{copy.hero.primary}</a>
        </Button>
      </div>
    </Section>
  );
}

export function Screens() {
  const { copy } = useLanguage();
  return (
    <Section id="tangkapan-layar" title={copy.screens.title}>
      <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-2">
        {copy.screens.items.map(([file, caption]) => (
          <li key={file}>
            <figure className="m-0 grid gap-2">
              <img
                src={`/screens/${file}.jpg`}
                // Keterangan gambar sudah di figcaption; alt kosong agar tidak dibacakan dua kali.
                alt=""
                width={1280}
                height={800}
                loading="lazy"
                decoding="async"
                className="h-auto w-full rounded-lg border border-line bg-surface"
              />
              <figcaption className="text-ink-muted">{caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
