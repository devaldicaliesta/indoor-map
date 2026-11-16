import { encodeQr } from '@indoor/domain';
import { useMemo } from 'react';

const QUIET = 4;

export function QrCode({
  url,
  label,
  className,
}: {
  url: string;
  label: string;
  className?: string;
}) {
  const matrix = useMemo(() => encodeQr(url), [url]);
  const size = matrix.length + QUIET * 2;
  const path = useMemo(
    () =>
      matrix
        .flatMap((row, y) =>
          row.map((dark, x) => (dark ? `M${x + QUIET} ${y + QUIET}h1v1h-1z` : '')),
        )
        .join(''),
    [matrix],
  );
  return (
    <svg
      role="img"
      aria-label={label}
      data-url={url}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      shapeRendering="crispEdges"
    >
      <path d={path} fill="#000" />
    </svg>
  );
}
