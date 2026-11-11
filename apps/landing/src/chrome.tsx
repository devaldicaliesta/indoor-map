import { BrandLogo, Button, cn, VENDOR_EMAIL } from '@indoor/ui';
import { MailIcon, MenuIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Language } from './copy';
import { useLanguage } from './language';
import { ThemeToggle } from './theme';

/** Tautan antarhalaman tetap membawa bahasa yang dipilih. */
export const home = (language: Language, hash = '') => `/?lang=${language}${hash}`;
export const privacyPage = (language: Language) => `/privasi/?lang=${language}`;

function LanguageSwitch() {
  const { language, copy, setLanguage } = useLanguage();
  return (
    <fieldset
      aria-label={copy.nav.language}
      className="m-0 flex min-w-0 overflow-hidden rounded-sm border border-line bg-surface p-0"
    >
      {(['id', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={language === code}
          // Nama yang dibacakan memuat teks yang terlihat (WCAG 2.5.3).
          aria-label={code === 'id' ? 'ID · Bahasa Indonesia' : 'EN · English'}
          onClick={() => setLanguage(code)}
          className={cn(
            'h-(--control-height) min-w-(--control-height) cursor-pointer px-3 font-bold uppercase',
            language === code ? 'bg-ink text-surface' : 'text-ink-muted hover:text-ink',
          )}
        >
          {code}
        </button>
      ))}
    </fieldset>
  );
}

/**
 * Menu bagian untuk layar di bawah 1024 px, tempat baris tautan desktop tidak muat. Tombolnya
 * berlabel teks agar jelas ada menu; Escape dan memilih tautan menutupnya.
 */
function MobileMenu({ links, trialHref }: { links: [string, string][]; trialHref: string }) {
  const { copy } = useLanguage();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  const Icon = open ? XIcon : MenuIcon;
  return (
    <div className="lg:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="menu-layar-kecil"
        onClick={() => setOpen(!open)}
        className="flex h-(--control-height) cursor-pointer items-center gap-1.5 rounded-sm border border-line px-2.5 font-bold text-ink hover:bg-canvas"
      >
        {/* Di bawah 380 px ikon disembunyikan agar kepala halaman muat; label teks tetap. */}
        <Icon aria-hidden="true" className="size-5 max-[379px]:hidden" strokeWidth={1.75} />
        {copy.nav.menu}
      </button>
      {open ? (
        <nav
          id="menu-layar-kecil"
          aria-label={copy.nav.menu}
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-line border-b bg-surface shadow-float"
        >
          <ul className="m-0 mx-auto grid max-w-6xl list-none gap-1 px-4 py-3">
            {links.map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-sm px-3 font-bold text-ink hover:bg-canvas"
                >
                  {label}
                </a>
              </li>
            ))}
            <li className="mt-2 border-line border-t pt-3">
              <Button asChild variant="primary" className="w-full">
                <a href={trialHref} onClick={() => setOpen(false)}>
                  {copy.nav.trial}
                </a>
              </Button>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

/** Kepala halaman: logo, navigasi bagian, bahasa, tema, dan aksi utama. */
export function SiteHeader({ sections = true }: { sections?: boolean }) {
  const { language, copy } = useLanguage();
  const at = (hash: string) => (sections ? hash : home(language, hash));
  const links: [string, string][] = [
    ['#fitur', copy.nav.features],
    ['#demo', copy.nav.demo],
    ['#cara-kerja', copy.nav.how],
    ['#lisensi', copy.nav.license],
  ];
  return (
    <header className="sticky top-0 z-20 border-line border-b bg-surface/95 backdrop-blur">
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:rounded-sm focus:bg-signal focus:px-3 focus:py-2 focus:font-bold focus:text-on-signal"
      >
        {copy.nav.skip}
      </a>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <a href={home(language)} aria-label="PanduArah" className="shrink-0">
          <BrandLogo className="h-7 w-auto sm:h-8" label="" />
        </a>
        {sections ? (
          <nav aria-label={copy.nav.menu} className="ml-4 hidden gap-1 lg:flex">
            {links.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-sm px-3 py-2 font-bold text-ink-muted hover:bg-canvas hover:text-ink"
              >
                {label}
              </a>
            ))}
          </nav>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitch />
          <ThemeToggle />
          <a
            href={at('#kontak')}
            className="hidden rounded-sm px-3 py-2 font-bold text-ink hover:bg-canvas md:inline-block"
          >
            {copy.nav.contact}
          </a>
          <Button asChild variant="primary" className="hidden sm:inline-flex">
            <a href={at('#trial')}>{copy.nav.trial}</a>
          </Button>
          {sections ? (
            <MobileMenu
              links={[...links, ['#kontak', copy.nav.contact]]}
              trialHref={at('#trial')}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { language, copy } = useLanguage();
  return (
    <footer className="bg-night text-on-night">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1fr_auto]">
        <div className="grid content-start gap-3">
          <BrandLogo tone="white" className="h-8 w-auto" />
          <p className="text-on-night-muted">{copy.footer.tagline}</p>
          <p className="text-on-night-muted text-sm">© 2026 PanduArah. {copy.footer.rights}</p>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <span className="font-bold">{copy.footer.contact}</span>
          <a href={`mailto:${VENDOR_EMAIL}`} className="flex items-center gap-2 underline">
            <MailIcon aria-hidden="true" className="size-4" strokeWidth={1.75} />
            {VENDOR_EMAIL}
          </a>
          <a href={privacyPage(language)} className="underline">
            {copy.footer.privacy}
          </a>
          <a href="/third-party-notices.txt" className="underline">
            {copy.footer.openSource}
          </a>
        </div>
      </div>
    </footer>
  );
}
