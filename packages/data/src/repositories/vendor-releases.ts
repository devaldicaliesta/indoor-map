import type { NewVendorRelease, VendorCheckin, VendorRelease } from '@indoor/domain/vendor-release';
import { toDataError } from '../errors';
import type { Db } from '../supabase';

export interface VendorReleasesRepository {
  checkins(installationId: string): Promise<VendorCheckin[]>;
  releases(): Promise<VendorRelease[]>;
  addRelease(release: NewVendorRelease): Promise<string>;
  removeRelease(id: string): Promise<void>;
}

export function createVendorReleasesRepository(db: Db): VendorReleasesRepository {
  return {
    async checkins(installationId) {
      const { data, error } = await db.rpc('vendor_checkins', {
        p_installation_id: installationId,
      });
      if (error) throw toDataError(error);
      return (data ?? []).map((row) => ({
        at: row.created_at,
        version: row.version ?? null,
        ip: row.ip_address ?? null,
      }));
    },

    async releases() {
      const { data, error } = await db.rpc('vendor_releases');
      if (error) throw toDataError(error);
      return (data ?? []).map((row) => ({
        id: row.id,
        version: row.version,
        releasedOn: row.released_on,
        notes: row.notes,
        downloadUrl: row.download_url,
        sha256: row.sha256,
        createdByEmail: row.created_by_email ?? null,
        createdAt: row.created_at,
      }));
    },

    async addRelease(release) {
      const { data, error } = await db.rpc('vendor_release_add', {
        p_version: release.version,
        p_released_on: release.releasedOn,
        p_notes: release.notes,
        p_download_url: release.downloadUrl,
        p_sha256: release.sha256,
      });
      if (error) throw toDataError(error);
      return data;
    },

    async removeRelease(id) {
      const { error } = await db.rpc('vendor_release_remove', { p_release_id: id });
      if (error) throw toDataError(error);
    },
  };
}
