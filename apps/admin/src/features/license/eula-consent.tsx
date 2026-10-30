import { EULA_VERSION } from '@indoor/domain';
import eula from '../../../../../docs/legal/eula.md?raw';
import { type LegalBlock, parseLegalText } from './legal-text';

const BLOCKS = parseLegalText(eula);

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case 'title':
      return <h2 className="font-bold text-base">{block.text}</h2>;
    case 'heading':
      return <h3 className="pt-2 font-bold">{block.text}</h3>;
    case 'list':
      return (
        <ol className="grid list-decimal gap-1 pl-5">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    default:
      return <p>{block.text}</p>;
  }
}

/**
 * Persetujuan EULA sebelum memasang lisensi, selama versi berlaku belum pernah disetujui
 * instalasi ini. Server menolak aktivasi tanpa persetujuan; centang ini hanya mengirimkannya.
 */
export function EulaConsent({
  accepted,
  onAcceptedChange,
}: {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
}) {
  return (
    <section className="grid gap-2" aria-labelledby="eula-title">
      <h2 id="eula-title" className="font-bold text-sm">
        Perjanjian Lisensi Pengguna Akhir (EULA) versi {EULA_VERSION}
      </h2>
      <section
        // biome-ignore lint/a11y/noNoninteractiveTabindex: wilayah gulir harus bisa difokus agar teksnya bisa digulir dengan keyboard (axe scrollable-region-focusable)
        tabIndex={0}
        aria-label="Teks EULA"
        className="grid max-h-64 gap-2 overflow-y-auto rounded-sm border border-line bg-surface p-3 text-sm"
      >
        {BLOCKS.map((block, index) => (
          <Block key={`${block.kind}-${index}`} block={block} />
        ))}
      </section>
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-ink"
          checked={accepted}
          onChange={(event) => onAcceptedChange(event.target.checked)}
        />
        <span className="text-sm">
          Saya telah membaca dan menyetujui EULA ini, dan berwenang mewakili instansi pemegang
          lisensi.
        </span>
      </label>
    </section>
  );
}
