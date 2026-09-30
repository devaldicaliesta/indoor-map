import { useSyncExternalStore } from 'react';
import { useMatch } from 'react-router';

const QUERY = '(max-width: 1279px)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** Admin untuk layar ≥ 1280 px, kecuali Penutupan yang dipakai Operator dari HP. */
export function NarrowScreenNotice() {
  const isNarrow = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches);
  const onClosures = useMatch('/closures/*');
  if (!isNarrow || onClosures) return null;

  return (
    <p role="status" className="border-line border-b bg-signal-soft px-4 py-2 text-sm">
      Admin dirancang untuk layar lebar (minimal 1280 px). Perbesar jendela browser agar semua panel
      tampil.
    </p>
  );
}
