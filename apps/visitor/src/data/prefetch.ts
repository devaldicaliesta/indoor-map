/** Permintaan `latest.json` dari skrip di index.html, diambil sekali oleh `loadSnapshot`. */
interface SnapshotPrefetch {
  url: string;
  response: Promise<Response>;
}

export function takeSnapshotPrefetch(url: string): Promise<Response> | undefined {
  const holder = window as Window & { __snapshotPrefetch?: SnapshotPrefetch };
  const prefetch = holder.__snapshotPrefetch;
  if (!prefetch || prefetch.url !== url) return undefined;
  delete holder.__snapshotPrefetch;
  return prefetch.response;
}
