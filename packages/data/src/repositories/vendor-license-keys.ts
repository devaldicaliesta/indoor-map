import { readQuota } from '@indoor/domain/license-issue';
import {
  isLicenseKeyStatus,
  type LicenseKeyRequest,
  type VendorLicenseKey,
} from '@indoor/domain/license-key';
import type { Database } from '../database.types';
import { DataError, toDataError } from '../errors';
import type { Db } from '../supabase';

export interface VendorLicenseKeysRepository {
  licenseKeys(clientId: string): Promise<VendorLicenseKey[]>;
  createLicenseKey(request: LicenseKeyRequest): Promise<string>;
  revokeLicenseKey(id: string): Promise<void>;
}

type KeyRow = Database['public']['Functions']['vendor_license_keys']['Returns'][number];

const stringList = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function toLicenseKey(row: KeyRow): VendorLicenseKey {
  const quota = readQuota(row.quota);
  if (!isLicenseKeyStatus(row.status) || !quota) {
    throw new DataError('unknown', { message: `Kunci lisensi ${row.key_hint} tidak terbaca.` });
  }
  return {
    id: row.id,
    hint: row.key_hint,
    status: row.status,
    plan: row.plan,
    durationDays: row.duration_days,
    quota,
    features: stringList(row.features),
    instanceId: row.instance_id ?? null,
    installationName: row.installation_name ?? null,
    licenseId: row.license_id ?? null,
    createdAt: row.created_at,
    createdByEmail: row.created_by_email ?? null,
    activatedAt: row.activated_at ?? null,
    revokedAt: row.revoked_at ?? null,
  };
}

export function createVendorLicenseKeysRepository(db: Db): VendorLicenseKeysRepository {
  return {
    async licenseKeys(clientId) {
      const { data, error } = await db.rpc('vendor_license_keys', { p_client_id: clientId });
      if (error) throw toDataError(error);
      return (data ?? []).map(toLicenseKey);
    },

    async createLicenseKey(request) {
      const { data, error } = await db.rpc('vendor_license_key_create', {
        p_client_id: request.clientId,
        p_plan: request.plan,
        p_duration_days: request.durationDays,
        p_quota: { ...request.quota },
        p_features: request.features,
      });
      if (error) throw toDataError(error);
      return data;
    },

    async revokeLicenseKey(id) {
      const { error } = await db.rpc('vendor_license_key_revoke', { p_key_id: id });
      if (error) throw toDataError(error);
    },
  };
}
