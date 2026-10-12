// Mengaktifkan permintaan trial yang slotnya sudah dipesan (status `active`): dipakai
// `trial-verify` (pemohon mengklik tautan) dan `trial-lifecycle` (permintaan antre mendapat slot).
//
// Rahasia lingkungan (tidak di repo): SMTP trial (`_shared/trial-mail.ts`),
//   TRIAL_ADMIN_URL (bawaan https://admin.panduarah.my.id),
//   TRIAL_VISITOR_URL (bawaan https://app.panduarah.my.id).
import { serviceHeaders, url } from '../_shared/auth.ts';
import { sendMail } from '../_shared/smtp.ts';
import { trialEnv, trialSmtpConfig } from '../_shared/trial-mail.ts';
import { activeMail, queuedMail, vendorMail } from './mails.ts';
import { passwordLink, provisionTrial, type TrialRequest } from './provision.ts';

export const adminUrl = trialEnv('TRIAL_ADMIN_URL') || 'https://admin.panduarah.my.id';
export const visitorUrl = (trialEnv('TRIAL_VISITOR_URL') || 'https://app.panduarah.my.id').replace(
  /\/+$/,
  '',
);

export function logError(source: string, message: string) {
  // biome-ignore lint/suspicious/noConsole: log Edge Runtime satu-satunya tempat rincian galat; balasan ke pemohon sengaja umum.
  console.error(`${source}: ${message}`);
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** RPC sebagai service role; fungsi `returns void` dibalas tanpa isi. */
export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify(args),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${fn}: ${response.status} ${text}`);
  return (text ? JSON.parse(text) : null) as T;
}

/** Email dikirim sebaik mungkin: kegagalan SMTP dicatat, langkah lain tetap berjalan. */
export async function send(message: Parameters<typeof sendMail>[1]) {
  const config = trialSmtpConfig();
  if (!config) return logError('trial-mail', 'TRIAL_SMTP_HOST/TRIAL_SMTP_FROM belum diatur');
  await sendMail(config, message).catch((error: unknown) =>
    logError('trial-mail', `email ke ${message.to}: ${messageOf(error)}`),
  );
}

export async function getRequest(id: string): Promise<TrialRequest | null> {
  const [found] = await rpc<TrialRequest[]>('hosting_request_get', { p_request_id: id });
  return found ?? null;
}

export type Activation =
  | { outcome: 'active'; adminUrl: string; visitorUrl: string }
  | { outcome: 'queued' };

/**
 * Membuat ruang kerja lalu mengirim email "Trial siap" dan pemberitahuan vendor. Gagal → slot
 * dilepas kembali ke antrean dan vendor diberi tahu; pemohon menerima email antrean hanya saat
 * baru mengklik tautan (`notifyQueued`), bukan setiap kali antrean dicoba ulang.
 */
export async function activate(
  request: TrialRequest,
  { notifyQueued }: { notifyQueued: boolean },
): Promise<Activation> {
  try {
    const workspace = await provisionTrial(request);
    const visitor = `${visitorUrl}/v/${workspace.slug}`;
    await send(
      activeMail(request, workspace, {
        password: await passwordLink(request.email, adminUrl),
        admin: adminUrl,
        visitor,
      }),
    );
    const note = workspace.published ? '' : ' (publish pertama gagal; pemohon menerbitkan sendiri)';
    await send(vendorMail('active', request, `${visitor}${note}`));
    return { outcome: 'active', adminUrl, visitorUrl: visitor };
  } catch (error) {
    logError('trial-activate', messageOf(error));
    await rpc('hosting_request_requeue', { p_request_id: request.id }).catch(() => undefined);
    if (notifyQueued) await send(queuedMail(request));
    await send(vendorMail('failed', request, messageOf(error)));
    return { outcome: 'queued' };
  }
}
