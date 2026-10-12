/**
 * Permintaan yang dimulai skrip di index.html, bersamaan dengan unduhan bundel aplikasi, lalu
 * diambil sekali oleh pemakainya: `latest.json` (`loadSnapshot`) dan penunjuk slug
 * `slugs/{slug}.json` (alamat `/v/<slug>`).
 */
interface Prefetch {
  url: string;
  response: Promise<Response>;
}

type PrefetchHolder = Window & { __snapshotPrefetch?: Prefetch; __slugPrefetch?: Prefetch };

function take(key: '__snapshotPrefetch' | '__slugPrefetch', url: string) {
  const holder = window as PrefetchHolder;
  const prefetch = holder[key];
  if (!prefetch || prefetch.url !== url) return undefined;
  delete holder[key];
  return prefetch.response;
}

export function takeSnapshotPrefetch(url: string): Promise<Response> | undefined {
  return take('__snapshotPrefetch', url);
}

export function takeSlugPrefetch(url: string): Promise<Response> | undefined {
  return take('__slugPrefetch', url);
}
