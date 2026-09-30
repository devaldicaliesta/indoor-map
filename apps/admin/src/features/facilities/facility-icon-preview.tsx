import { FACILITY_ICON_SIZE, type IconSource, renderFacilityIcon } from '@indoor/map-core';
import { useEffect, useRef } from 'react';

/** Ikon persis seperti di peta: dibuat dengan fungsi sprite yang sama (map-core). */
export function FacilityIconPreview({
  source,
  isSafety,
  label,
  scale = 1,
}: {
  source: IconSource | null;
  isSafety: boolean;
  /** Tanpa label, ikon dianggap hiasan (nama jenisnya sudah tertulis di sebelahnya). */
  label?: string;
  scale?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const key = source ? ('svg' in source ? source.svg : source.url) : '';
  useEffect(() => {
    let active = true;
    void renderFacilityIcon(source, isSafety).then((image) => {
      const element = canvas.current;
      if (!active || !element) return;
      element.width = image.width;
      element.height = image.height;
      element.getContext('2d')?.putImageData(image, 0, 0);
    });
    return () => {
      active = false;
    };
  }, [key, isSafety]);
  const size = FACILITY_ICON_SIZE * scale;
  return (
    <canvas
      ref={canvas}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      className="shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
