// Membuat ruang kerja trial (T-614b, arch §3.5 `provisionTrial`):
//   1. venue demo sesuai jenis gedung dibaca seperti publish (`readSource`), dipangkas ke batas
//      trial (`trialSample`), diberi id baru (`withNewIds`), dijadikan baris tabel (`venueRows`);
//   2. akun Auth pemohon dibuat dengan password acak yang tidak pernah dikirim ke mana pun;
//   3. `hosting_provision_trial` menyisipkan venue, data contoh, profil, anggota, dan `trials`
//      dalam satu transaksi (gagal → akun dihapus);
//   4. publish pertama dijalankan SEBAGAI pemohon (masuk sekali dengan password acak tadi, lalu
//      keluar), sehingga semua pemeriksaan publish berlaku seperti biasa tanpa jalur khusus.
// Pemohon membuat password sendiri lewat tautan di email "Trial aktif".
import type { BuildingType } from '../../../packages/domain/src/trial-request.ts';
import {
  slugFromName,
  TRIAL_TEMPLATES,
  trialSample,
} from '../../../packages/domain/src/trial-sample.ts';
import { venueRows, withNewIds } from '../../../packages/domain/src/venue-rows.ts';
import { serviceHeaders, url } from '../_shared/auth.ts';
import { newToken } from '../_shared/token.ts';
import { serviceRest } from '../publish/rest.ts';
import { readSource } from '../publish/source.ts';

const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const anonHeaders = { apikey: anonKey, 'Content-Type': 'application/json' };

// Penanda Area Luar venue demo di data contoh; SQL menggantinya dengan Area Luar venue baru.
const OUTDOOR_PLACEHOLDER = '00000000-0000-4000-8000-0000000000a0';

export interface TrialRequest {
  id: string;
  name: string;
  institution: string;
  title: string;
  email: string;
  phone: string;
  building_type: BuildingType;
  building_size: string;
  language: 'id' | 'en';
}

export interface Workspace {
  venueId: string;
  slug: string;
  endsAt: string;
  /** Publish pertama berhasil; bila tidak, Visitor menunggu pemohon menerbitkan sendiri. */
  published: boolean;
}

async function serviceJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: { ...serviceHeaders, ...init.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${path}: ${response.status} ${JSON.stringify(body)}`);
  return body as T;
}

/** Venue demo yang menjadi sumber data contoh (slug dari `db:seed-demo`, T-613). */
async function templateVenue(type: BuildingType) {
  const { slug } = TRIAL_TEMPLATES[type];
  const [venue] = await serviceJson<{ id: string; timezone: string; center: unknown }[]>(
    `/rest/v1/venues?select=id,timezone,center&slug=eq.${encodeURIComponent(slug)}`,
  );
  if (!venue) throw new Error(`Venue demo "${slug}" belum ada; jalankan db:seed-demo di server.`);
  return venue;
}

async function createUser(email: string, name: string, password: string): Promise<string> {
  const user = await serviceJson<{ id?: string }>('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    }),
  });
  if (!user.id) throw new Error('Akun pemohon tidak dibuat.');
  return user.id;
}

async function deleteUser(id: string) {
  await fetch(`${url}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: serviceHeaders });
}

/** Publish pertama atas nama pemohon; sesi dibuang sesudahnya. */
async function firstPublish(email: string, password: string, venueId: string): Promise<boolean> {
  const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: anonHeaders,
    body: JSON.stringify({ email, password }),
  });
  const { access_token: token } = (await login.json().catch(() => ({}))) as {
    access_token?: string;
  };
  if (!login.ok || !token) return false;
  const authorization = { ...anonHeaders, Authorization: `Bearer ${token}` };
  try {
    const publish = await fetch(`${url}/functions/v1/publish`, {
      method: 'POST',
      headers: authorization,
      body: JSON.stringify({ venueId, notes: 'Peta contoh trial' }),
    });
    return publish.ok;
  } finally {
    await fetch(`${url}/auth/v1/logout`, { method: 'POST', headers: authorization });
  }
}

export async function provisionTrial(request: TrialRequest): Promise<Workspace> {
  const template = await templateVenue(request.building_type);
  const source = await readSource(serviceRest(), template.id, {
    version: 0,
    publishedAt: new Date().toISOString(),
    enabledFeatures: [],
  });
  const sample = trialSample(source);
  const venueId = crypto.randomUUID();
  const outdoor = sample.floors.find((f) => f.isOutdoor)?.id;
  const fixed = new Map([[template.id, venueId]]);
  if (outdoor) fixed.set(outdoor, OUTDOOR_PLACEHOLDER);
  const rows = venueRows(
    withNewIds(sample, () => crypto.randomUUID(), fixed),
    venueId,
  );

  const password = newToken();
  const userId = await createUser(request.email, request.name, password);
  let created: { venue_id: string; slug: string; ends_at: string };
  try {
    [created] = await serviceJson<(typeof created)[]>('/rest/v1/rpc/hosting_provision_trial', {
      method: 'POST',
      body: JSON.stringify({
        p_request_id: request.id,
        p_user_id: userId,
        p_venue: {
          id: venueId,
          name: request.institution,
          slug: slugFromName(request.institution),
          venueType: TRIAL_TEMPLATES[request.building_type].venueType,
          timezone: template.timezone,
          center: template.center,
        },
        p_rows: rows,
        p_outdoor_placeholder: OUTDOOR_PLACEHOLDER,
      }),
    });
  } catch (error) {
    await deleteUser(userId);
    throw error;
  }
  const published = await firstPublish(request.email, password, created.venue_id).catch(
    () => false,
  );
  return {
    venueId: created.venue_id,
    slug: created.slug,
    endsAt: created.ends_at,
    published,
  };
}

/** Tautan sekali pakai untuk membuat password, menuju halaman reset password Admin. */
export async function passwordLink(email: string, adminUrl: string): Promise<string> {
  const link = await serviceJson<{ action_link?: string; properties?: { action_link?: string } }>(
    '/auth/v1/admin/generate_link',
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'recovery',
        email,
        redirect_to: `${adminUrl.replace(/\/+$/, '')}/reset-password`,
      }),
    },
  );
  const action = link.action_link ?? link.properties?.action_link;
  if (!action) throw new Error('Tautan pembuatan password tidak didapat.');
  return action;
}
