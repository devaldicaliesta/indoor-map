import { Badge, Button, brandingTokens } from '@indoor/ui';
import { ChevronDownIcon, SearchIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

const CHIPS = ['Toilet', 'Lift', 'ATM'];

function Mark({ logoUrl }: { logoUrl: string | null }) {
  return logoUrl ? (
    <img src={logoUrl} alt="" className="h-8 w-auto max-w-28 shrink-0 object-contain" />
  ) : (
    <span aria-hidden="true" className="size-4 shrink-0 rounded-sm bg-signal ring-1 ring-ink" />
  );
}

/** Potongan peta dengan garis rute: tepi putih, garis --route, tujuan lingkaran --route. */
function RouteSketch() {
  return (
    <svg viewBox="0 0 300 120" className="block h-30 w-full bg-canvas" aria-hidden="true">
      <rect x="16" y="14" width="110" height="44" fill="var(--surface)" stroke="var(--line)" />
      <rect x="150" y="14" width="134" height="44" fill="var(--surface)" stroke="var(--line)" />
      <rect x="16" y="76" width="268" height="32" fill="var(--surface)" stroke="var(--line)" />
      <path
        d="M40 92 H138 V36 H230"
        fill="none"
        stroke="var(--surface)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 92 H138 V36 H230"
        fill="none"
        stroke="var(--route)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="92" r="7" fill="var(--surface)" stroke="var(--route)" strokeWidth="3" />
      <circle cx="230" cy="36" r="8" fill="var(--route)" stroke="var(--surface)" strokeWidth="3" />
    </svg>
  );
}

/**
 * Pratinjau Visitor (HP) dengan branding yang sedang diisi. Token warna ditimpa di elemen ini
 * saja, dengan perhitungan kontras yang sama dengan Visitor.
 */
export function BrandingPreview({
  name,
  logoUrl,
  primaryColor,
  routeColor,
}: {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  routeColor: string | null;
}) {
  const style = brandingTokens({ primaryColor, routeColor }) as CSSProperties;
  return (
    <section aria-labelledby="branding-preview-title" className="grid content-start gap-2">
      <h3 id="branding-preview-title" className="font-bold">
        Pratinjau Visitor
      </h3>
      <div
        data-surface="visitor"
        data-testid="branding-preview"
        style={style}
        className="w-full max-w-[390px] overflow-hidden rounded-lg border border-line bg-surface text-body shadow-float"
      >
        <div className="grid gap-3 p-(--panel-padding)">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Mark logoUrl={logoUrl} />
              <p className="truncate font-bold">{name}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-sm border border-line px-2 py-1 text-sm">
              ID <ChevronDownIcon aria-hidden="true" className="size-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="flex h-(--control-height) items-center gap-2 rounded-sm border border-ink-muted px-3 text-ink-muted">
            <SearchIcon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
            <span className="truncate">Cari di {name}…</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((chip, index) => (
              <span
                key={chip}
                className={
                  index === 0
                    ? 'rounded-sm border border-ink bg-signal-soft px-3 py-1 font-bold text-ink'
                    : 'rounded-sm border border-line px-3 py-1'
                }
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <RouteSketch />
        <div className="grid gap-2 p-(--panel-padding)">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold">Lobi Utama</p>
            <Badge variant="route">120 m</Badge>
          </div>
          <Button type="button" variant="primary" tabIndex={-1} className="w-full">
            Rute ke sini
          </Button>
        </div>
      </div>
      <p className="text-ink-muted text-sm">
        Tampil di Visitor dan Info Point setelah peta diterbitkan.
      </p>
    </section>
  );
}
