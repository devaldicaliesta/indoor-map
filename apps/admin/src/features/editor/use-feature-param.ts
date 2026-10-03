import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useEditorStore } from './store/editor-store';

/**
 * `?feature=<id>` (dari temuan validasi publish): fitur dipilih dan peta difokuskan setelah
 * fitur lantai itu dimuat, lalu parameternya dilepas agar tidak terulang saat memilih lain.
 */
export function useFeatureParam() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('feature');
  const loaded = useEditorStore((s) => (requested ? Boolean(s.features[requested]) : false));
  const focus = useEditorStore((s) => s.focus);

  useEffect(() => {
    if (!requested || !loaded) return;
    focus(requested);
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('feature');
        return next;
      },
      { replace: true },
    );
  }, [requested, loaded, focus, setParams]);
}
