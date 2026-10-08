import { VENDOR_EMAIL } from '@indoor/ui';
import { home, SiteFooter, SiteHeader } from './chrome';
import { useDocumentMeta, useLanguage } from './language';

export function PrivacyPage() {
  const { language, copy } = useLanguage();
  const p = copy.privacy;
  useDocumentMeta(`${p.title} — PanduArah`, copy.meta.description);
  return (
    <>
      <SiteHeader sections={false} />
      <main id="isi" className="bg-surface">
        <article className="mx-auto grid max-w-3xl gap-6 px-4 py-12">
          <a href={home(language)} className="w-fit font-bold underline">
            ← {p.back}
          </a>
          <header className="grid gap-2">
            <h1 className="font-bold text-4xl">{p.title}</h1>
            <p className="text-ink-muted">{p.updated}</p>
          </header>
          {p.sections.map(([title, body]) => (
            <section key={title} className="grid gap-2">
              <h2 className="font-bold text-2xl">{title}</h2>
              <p className="text-lg">{body}</p>
            </section>
          ))}
          <p className="text-lg">
            {p.contact}{' '}
            <a href={`mailto:${VENDOR_EMAIL}`} className="font-bold underline">
              {VENDOR_EMAIL}
            </a>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
