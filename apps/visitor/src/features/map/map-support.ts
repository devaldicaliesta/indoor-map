import { supportsWebGL } from '@indoor/map-core';
import { create } from 'zustand';

// Pemeriksaan WebGL bisa lolos tetapi peta tetap gagal dibuat (konteks GPU ditolak); tanda ini
// berlaku untuk seluruh halaman karena kemampuan perangkat tidak berubah per venue.
const failure = create<{ failed: boolean }>(() => ({ failed: false }));

/** Peta bisa digambar di perangkat ini. Tanpa peta, cari dan langkah rute tetap dipakai. */
export function useMapAvailable(): boolean {
  const failed = failure((s) => s.failed);
  return !failed && supportsWebGL();
}

export function markMapFailed(): void {
  failure.setState({ failed: true });
}
