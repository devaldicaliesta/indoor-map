import { Button, VENDOR_EMAIL } from '@indoor/ui';
import { MailIcon } from 'lucide-react';
import { useLanguage } from '../language';
import { Section } from './content';

/** Ajakan menghubungi vendor lewat email; form trial belum dipasang di situs terbit. */
export function Contact() {
  const { copy } = useLanguage();
  return (
    <Section id="kontak" title={copy.contact.title} lead={copy.contact.lead} tone="surface">
      <div className="flex flex-wrap items-center gap-4">
        <Button asChild variant="primary">
          <a href={`mailto:${VENDOR_EMAIL}`}>
            <MailIcon aria-hidden="true" strokeWidth={1.75} />
            {copy.contact.email}
          </a>
        </Button>
        <a href={`mailto:${VENDOR_EMAIL}`} className="font-bold underline">
          {VENDOR_EMAIL}
        </a>
      </div>
    </Section>
  );
}
