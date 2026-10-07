import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const mailpit = process.env.SUPABASE_MAILPIT_URL ?? '';
const REDIRECT = 'http://127.0.0.1:5173/reset-password';

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

interface MailpitMessage {
  ID: string;
  Subject: string;
}

async function waitForMail(to: string): Promise<{ subject: string; text: string }> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await fetch(
      `${mailpit}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
    );
    const { messages } = (await search.json()) as { messages: MailpitMessage[] };
    const [first] = messages;
    if (first) {
      const detail = (await (await fetch(`${mailpit}/api/v1/message/${first.ID}`)).json()) as {
        Text: string;
      };
      return { subject: first.Subject, text: detail.Text };
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Email ke ${to} tidak sampai di Mailpit.`);
}

// Butuh seed: SMTP Pengaturan Sistem menunjuk Mailpit lokal (supabase/seed.sql).
describe.runIf(url && anonKey && serviceKey && mailpit)(
  'email Auth lewat SMTP Pengaturan Sistem (Supabase lokal)',
  () => {
    const service = newDb(serviceKey);
    const created: string[] = [];

    afterAll(async () => {
      for (const id of created) await service.auth.admin.deleteUser(id);
    });

    it('tautan reset password dikirim hook auth-email dan membuka sesi pemulihan', async () => {
      const email = `reset-${randomUUID().slice(0, 8)}@auth-email.test`;
      const { data, error } = await service.auth.admin.createUser({
        email,
        password: 'Integrasi-2026!',
        email_confirm: true,
      });
      if (error) throw error;
      created.push(data.user.id);

      await createRepositories(newDb(anonKey)).auth.requestPasswordReset(email, REDIRECT);
      const mail = await waitForMail(email);
      expect(mail.subject).toBe('Atur ulang password Admin PanduArah');
      const link = /(http\S+\/auth\/v1\/verify\?\S+)/.exec(mail.text)?.[1] ?? '';
      expect(link).toContain('type=recovery');
      const verified = await fetch(link, { redirect: 'manual' });
      expect(verified.status).toBe(303);
      expect(verified.headers.get('location')).toMatch(
        new RegExp(`^${REDIRECT.replace(/[.?]/g, '\\$&')}#access_token=`),
      );
    });

    it('panggilan ke hook tanpa tanda tangan GoTrue ditolak', async () => {
      const response = await fetch(`${url}/functions/v1/auth-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: { email: 'korban@auth-email.test' },
          email_data: { email_action_type: 'recovery' },
        }),
      });
      expect(response.status).toBe(401);
    });
  },
);
