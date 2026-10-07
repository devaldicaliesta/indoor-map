import { BrandLogo, BrandSymbol, PRODUCT_TAGLINE } from '@indoor/ui';
import { Section } from './gallery-section';

/** Logo PanduArah: warna di latar terang, varian putih di latar gelap (tanpa kotak latar). */
export function BrandGallery() {
  return (
    <Section title="Merek">
      <p className="text-ink-muted">{PRODUCT_TAGLINE}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <figure className="grid gap-4 rounded-lg border border-line bg-surface p-6">
          <BrandLogo className="h-12" />
          <div className="flex items-end gap-6">
            <BrandSymbol className="h-12" />
            <BrandLogo className="h-7" />
            <BrandSymbol className="h-7" />
          </div>
          <figcaption className="text-ink-muted text-sm">Warna · latar terang</figcaption>
        </figure>
        <figure data-testid="brand-dark" className="grid gap-4 rounded-lg bg-ink p-6">
          <BrandLogo tone="white" className="h-12" />
          <div className="flex items-end gap-6">
            <BrandSymbol tone="white" className="h-12" />
            <BrandLogo tone="white" className="h-7" />
            <BrandSymbol tone="white" className="h-7" />
          </div>
          <figcaption className="text-on-strong text-sm">Putih · latar gelap</figcaption>
        </figure>
      </div>
    </Section>
  );
}
