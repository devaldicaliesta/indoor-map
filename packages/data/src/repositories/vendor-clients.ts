import type { VendorClient, VendorInstallation } from '@indoor/domain';
import { type LicenseFile, readLicensePayload } from '@indoor/domain/license';
import {
  type LicenseIssueRequest,
  type VendorLicense,
  vendorLicenseStatus,
} from '@indoor/domain/license-issue';
import { isOnPremTrialStatus, type VendorTrialRequest } from '@indoor/domain/onprem-trial';
import type { Database } from '../database.types';
import { DataError, toDataError } from '../errors';
import type { Db } from '../supabase';

export interface NewVendorClient {
  name: string;
  institution: string;
  email: string;
  phone: string;
}

export interface NewVendorInstallation {
  clientId: string;
  instanceId: string;
  name: string;
}

export interface TrialApproval {
  license: LicenseFile;
  emailed: boolean;
}

export interface VendorClientsRepository {
  clients(): Promise<VendorClient[]>;
  installations(): Promise<VendorInstallation[]>;
  createClient(input: NewVendorClient): Promise<string>;
  createInstallation(input: NewVendorInstallation): Promise<string>;
  licenses(installationId: string): Promise<VendorLicense[]>;
  issueLicense(request: LicenseIssueRequest): Promise<LicenseFile>;
  revokeLicense(id: string): Promise<void>;
  trialRequests(): Promise<VendorTrialRequest[]>;
  approveTrial(requestId: string, days: number): Promise<TrialApproval>;
  rejectTrial(requestId: string, reason: string): Promise<{ emailed: boolean }>;
}

type Functions = Database['public']['Functions'];
type LicenseRow = Functions['vendor_licenses']['Returns'][number];
type TrialRow = Functions['vendor_trial_requests']['Returns'][number];

function readLicenseFile(value: unknown): LicenseFile | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const { signature, ...rest } = value as Record<string, unknown>;
  const payload = readLicensePayload(rest);
  return payload && typeof signature === 'string' ? { ...payload, signature } : null;
}

function toLicense(row: LicenseRow, now: Date): VendorLicense {
  const status = vendorLicenseStatus(row.status, row.valid_until, now);
  const file = readLicenseFile(row.file);
  if (!status || !file) {
    throw new DataError('unknown', { message: `Lisensi ${row.license_id} tidak terbaca.` });
  }
  return {
    id: row.id,
    licenseId: row.license_id,
    status,
    plan: row.plan,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    issuedAt: row.issued_at,
    issuedByEmail: row.issued_by_email,
    revokedAt: row.revoked_at,
    file,
  };
}

function toTrialRequest(row: TrialRow): VendorTrialRequest {
  if (!isOnPremTrialStatus(row.status)) {
    throw new DataError('unknown', { message: `Status permintaan tidak dikenal: ${row.status}` });
  }
  return {
    id: row.id,
    name: row.name,
    institution: row.institution,
    email: row.email,
    instanceId: row.instance_id,
    status: row.status,
    rejectReason: row.reject_reason,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
    decidedByEmail: row.decided_by_email,
    licenseId: row.license_id,
  };
}

async function functionError(error: unknown): Promise<DataError> {
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    const body = (await context.json().catch(() => null)) as { message?: unknown } | null;
    if (body && typeof body.message === 'string') {
      const kind = context.status === 401 || context.status === 403 ? 'forbidden' : 'invalid';
      return new DataError(kind, { message: body.message, code: String(context.status) });
    }
  }
  return toDataError(error);
}

export function createVendorClientsRepository(db: Db): VendorClientsRepository {
  return {
    async clients() {
      const { data, error } = await db.rpc('vendor_clients');
      if (error) throw toDataError(error);
      return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        institution: row.institution,
        email: row.email,
        phone: row.phone,
        createdAt: row.created_at,
        installationsCount: row.installations_count,
      }));
    },

    async installations() {
      const { data, error } = await db.rpc('vendor_installations');
      if (error) throw toDataError(error);
      return (data ?? []).map((row) => ({
        id: row.id,
        clientId: row.client_id,
        clientName: row.client_name,
        instanceId: row.instance_id,
        name: row.name,
        plan: row.plan,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        lastVersion: row.last_version,
        lastCheckinAt: row.last_checkin_at,
        createdAt: row.created_at,
      }));
    },

    async createClient(input) {
      const { data, error } = await db.rpc('vendor_client_create', {
        p_name: input.name,
        p_institution: input.institution,
        p_email: input.email,
        p_phone: input.phone,
      });
      if (error) throw toDataError(error);
      return data;
    },

    async createInstallation(input) {
      const { data, error } = await db.rpc('vendor_installation_create', {
        p_client_id: input.clientId,
        p_instance_id: input.instanceId,
        p_name: input.name,
      });
      if (error) throw toDataError(error);
      return data;
    },

    async licenses(installationId) {
      const { data, error } = await db.rpc('vendor_licenses', {
        p_installation_id: installationId,
      });
      if (error) throw toDataError(error);
      const now = new Date();
      return (data ?? []).map((row) => toLicense(row, now));
    },

    async issueLicense(request) {
      const { data, error } = await db.functions.invoke<{ license: unknown }>('vendor-license', {
        body: request,
      });
      if (error) throw await functionError(error);
      const file = readLicenseFile(data?.license);
      if (!file) throw new DataError('unknown', { message: 'Balasan lisensi tidak terbaca.' });
      return file;
    },

    async revokeLicense(id) {
      const { error } = await db.rpc('vendor_license_revoke', { p_license_id: id });
      if (error) throw toDataError(error);
    },

    async trialRequests() {
      const { data, error } = await db.rpc('vendor_trial_requests');
      if (error) throw toDataError(error);
      return (data ?? []).map(toTrialRequest);
    },

    async approveTrial(requestId, days) {
      const { data, error } = await db.functions.invoke<{ license: unknown; emailed: boolean }>(
        'vendor-trial',
        { body: { requestId, decision: 'approve', days } },
      );
      if (error) throw await functionError(error);
      const license = readLicenseFile(data?.license);
      if (!license) throw new DataError('unknown', { message: 'Balasan lisensi tidak terbaca.' });
      return { license, emailed: data?.emailed === true };
    },

    async rejectTrial(requestId, reason) {
      const { data, error } = await db.functions.invoke<{ emailed: boolean }>('vendor-trial', {
        body: { requestId, decision: 'reject', reason },
      });
      if (error) throw await functionError(error);
      return { emailed: data?.emailed === true };
    },
  };
}
