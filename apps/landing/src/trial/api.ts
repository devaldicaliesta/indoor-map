// Panggilan ke Edge Function trial di server vendor (T-614). Langsung dengan fetch, tanpa
// supabase-js, agar landing tetap ringan; keduanya tidak butuh login.
import type {
  HostedTrialRequestInput,
  TrialRequestField,
  TrialRequestProblem,
} from '@indoor/domain/trial-request';

const functionsUrl = `${String(import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')}/functions/v1`;

/** Visitor ter-hosting; demo publik ada di `/v/demo` (T-613). */
const visitorUrl = String(
  import.meta.env.VITE_VISITOR_URL || 'https://app.panduarah.my.id',
).replace(/\/+$/, '');
export const DEMO_URL = `${visitorUrl}/v/demo`;

export type RequestResult =
  | { kind: 'sent' }
  | { kind: 'invalid'; problems: Partial<Record<TrialRequestField, TrialRequestProblem>> }
  | { kind: 'rate_limited' }
  | { kind: 'failed' };

/** `website`: kolom jebakan bot (honeypot), dikirim apa adanya. */
export async function requestTrial(
  input: HostedTrialRequestInput,
  website: string,
): Promise<RequestResult> {
  try {
    const response = await fetch(`${functionsUrl}/trial-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, website }),
    });
    if (response.ok) return { kind: 'sent' };
    if (response.status === 429) return { kind: 'rate_limited' };
    if (response.status === 422) {
      const body = (await response.json().catch(() => ({}))) as {
        problems?: Partial<Record<TrialRequestField, TrialRequestProblem>>;
      };
      return { kind: 'invalid', problems: body.problems ?? {} };
    }
    return { kind: 'failed' };
  } catch {
    return { kind: 'failed' };
  }
}

export type VerifyResult =
  | { outcome: 'active'; adminUrl: string; visitorUrl: string }
  | { outcome: 'queued' | 'rejected' | 'expired' | 'invalid' | 'failed' };

const OUTCOMES = ['queued', 'rejected', 'expired', 'invalid'] as const;

async function postVerify(token: string): Promise<VerifyResult> {
  try {
    const response = await fetch(`${functionsUrl}/trial-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const body = (await response.json().catch(() => ({}))) as {
      outcome?: string;
      adminUrl?: string;
      visitorUrl?: string;
    };
    if (!response.ok) return { outcome: 'failed' };
    if (body.outcome === 'active' && body.adminUrl && body.visitorUrl) {
      return { outcome: 'active', adminUrl: body.adminUrl, visitorUrl: body.visitorUrl };
    }
    const known = OUTCOMES.find((outcome) => outcome === body.outcome);
    return { outcome: known ?? 'failed' };
  } catch {
    return { outcome: 'failed' };
  }
}

// Token sekali pakai: permintaan kedua (mis. efek React StrictMode yang dijalankan dua kali di
// pengembangan) harus memakai hasil yang sama, bukan menghabiskan token lalu melihat "invalid".
const pending = new Map<string, Promise<VerifyResult>>();

export function verifyTrial(token: string): Promise<VerifyResult> {
  let result = pending.get(token);
  if (!result) {
    result = postVerify(token);
    pending.set(token, result);
  }
  return result;
}

/** Percobaan ulang setelah galat jaringan/server: hasil gagal yang tersimpan dibuang dulu. */
export function retryVerify(token: string): Promise<VerifyResult> {
  pending.delete(token);
  return verifyTrial(token);
}
