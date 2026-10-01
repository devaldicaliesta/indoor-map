import { FACILITY_ICON_SIZE, type IconSource, renderFacilityIcon } from '@indoor/map-core';
import { useEffect, useRef } from 'react';

/**
 * Ikon kategori atau fasilitas persis seperti di peta: digambar dengan fungsi sprite yang sama
 * (lingkaran putih bercincin, keselamatan berlatar merah). Selalu hiasan; namanya tertulis di
 * sebelahnya.
 */
export function MapIcon({ source, isSafety = false }: { source: IconSource; isSafety?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const key = 'svg' in source ? source.svg : source.url;
  // `key` mewakili `source`, yang dibuat ulang setiap render.
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
  return (
    <span aria-hidden="true" className="flex shrink-0">
      <canvas ref={canvas} style={{ width: FACILITY_ICON_SIZE, height: FACILITY_ICON_SIZE }} />
    </span>
  );
}
