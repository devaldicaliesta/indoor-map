import { VENDOR_EMAIL } from '@indoor/ui';

/** Email vendor PanduArah untuk lisensi, perpanjangan, dan dukungan. */
export function VendorEmail() {
  return (
    <a href={`mailto:${VENDOR_EMAIL}`} className="font-bold underline underline-offset-4">
      {VENDOR_EMAIL}
    </a>
  );
}
