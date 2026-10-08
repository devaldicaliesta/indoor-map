import { BrandLogo, Button, cn, VENDOR_EMAIL } from '@indoor/ui';
import { MailIcon } from 'lucide-react';
import type { Language } from './copy';
import { useLanguage } from './language';

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

/** Kepala halaman: logo, navigasi bagian (desktop), bahasa, dan aksi utama. */
export function SiteHeader({ sections = true }: { sections?: boolean }) {
  const { language, copy } = useLanguage();
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
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:rounded-sm focus:bg-signal focus:px-3 focus:py-2 focus:font-bold"
      >
        {copy.nav.skip}
      </a>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
        <a href={home(language)} aria-label="PanduArah" className="shrink-0">
          <BrandLogo className="h-8 w-auto" label="" />
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
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitch />
          <Button asChild variant="primary" className="hidden sm:inline-flex">
            <a href={sections ? '#trial' : home(language, '#trial')}>{copy.nav.trial}</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { language, copy } = useLanguage();
  return (
    <footer className="border-line border-t bg-ink text-surface">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-2">
          <p className="font-bold text-xl">
            PanduArah <span className="font-normal text-line">— {copy.footer.tagline}</span>
          </p>
          <p className="text-line text-sm">© 2026 PanduArah. {copy.footer.rights}</p>
        </div>
        <div className="grid gap-2 text-sm">
          <span className="font-bold">{copy.footer.contact}</span>
          <a href={`mailto:${VENDOR_EMAIL}`} className="flex items-center gap-2 underline">
            <MailIcon aria-hidden="true" className="size-4" strokeWidth={1.75} />
            {VENDOR_EMAIL}
          </a>
          <a href={privacyPage(language)} className="underline">
            {copy.footer.privacy}
          </a>
        </div>
      </div>
    </footer>
  );
}
