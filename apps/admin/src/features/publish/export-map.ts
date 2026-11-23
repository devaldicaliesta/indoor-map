import type { VenueId } from '@indoor/domain';
import {
  type ImdfAddress,
  type ImdfSkipped,
  snapshotToGeoJson,
  snapshotToImdf,
  validateImdf,
} from '@indoor/domain/export';
import { useMutation } from '@tanstack/react-query';
import { data } from '../../app/data-client';
import { fileSlug } from '../../app/download';

export type ExportRequest = { format: 'geojson' } | { format: 'imdf'; address: ImdfAddress };

export interface ExportResult {
  blob: Blob;
  filename: string;
  /** Bagian snapshot yang tidak ikut paket IMDF; `null` untuk GeoJSON. */
  skipped: ImdfSkipped | null;
}

async function zip(files: Record<string, unknown>): Promise<Blob> {
  // fflate hanya dimuat saat export, tidak di halaman awal.
  const { strToU8, zipSync } = await import('fflate');
  const entries = Object.fromEntries(
    Object.entries(files).map(([name, value]) => [name, strToU8(JSON.stringify(value))]),
  );
  return new Blob([zipSync(entries, { level: 6 })], { type: 'application/zip' });
}

/** Export versi published aktif sebagai zip GeoJSON atau IMDF; IMDF divalidasi sebelum diunduh. */
export function useExportMap(venueId: VenueId) {
  return useMutation({
    mutationFn: async (request: ExportRequest): Promise<ExportResult> => {
      const [snapshot, venue] = await Promise.all([
        data.publications.activeSnapshot(venueId),
        data.venues.get(venueId),
      ]);
      if (!snapshot) throw new Error('Belum ada versi published untuk diekspor.');
      const name = `${fileSlug(venue.slug ?? venue.name, 'venue')}-v${snapshot.version}`;
      if (request.format === 'geojson') {
        return {
          blob: await zip(snapshotToGeoJson(snapshot)),
          filename: `${name}-geojson.zip`,
          skipped: null,
        };
      }
      const { files, skipped } = await snapshotToImdf({
        snapshot,
        venueType: venue.venueType,
        address: request.address,
        createdAt: new Date().toISOString(),
      });
      const issues = validateImdf(files);
      if (issues.length > 0) {
        const first = issues[0];
        throw new Error(
          `Paket IMDF tidak lolos validasi (${issues.length} temuan). Contoh: ${first?.file} ${first?.message}`,
        );
      }
      return { blob: await zip(files), filename: `${name}-imdf.zip`, skipped };
    },
  });
}

/** Ringkasan bagian yang tidak ikut paket IMDF, untuk notifikasi. */
export function describeSkipped(skipped: ImdfSkipped): string | null {
  const parts = [
    [skipped.walls, 'dinding garis'],
    [skipped.models, 'objek 3D'],
    [skipped.pointsOutsideUnits, 'fasilitas/landmark di luar ruang'],
    [skipped.locationsWithoutUnit, 'lokasi tanpa unit'],
    [skipped.floorsWithoutGeometry, 'lantai kosong'],
  ] as const;
  const text = parts.filter(([n]) => n > 0).map(([n, what]) => `${n} ${what}`);
  return text.length ? `Tidak ada padanan IMDF, tidak ikut: ${text.join(', ')}.` : null;
}
