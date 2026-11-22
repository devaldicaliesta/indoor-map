import type { OpeningSpan } from './hours.ts';

interface ParsedUrl {
  protocol: string;
  username: string;
  password: string;
}

const UrlConstructor = (globalThis as unknown as { URL: new (value: string) => ParsedUrl }).URL;

export const API_SCOPES = [
  'locations:read',
  'locations:write',
  'closures:read',
  'closures:write',
] as const;
export type ApiScope = (typeof API_SCOPES)[number];

export const API_SCOPE_LABELS: Record<ApiScope, string> = {
  'locations:read': 'Baca lokasi, kategori, dan jam',
  'locations:write': 'Ubah lokasi, status, kategori, dan jam',
  'closures:read': 'Baca penutupan',
  'closures:write': 'Buat dan akhiri penutupan',
};

export const WEBHOOK_EVENTS = ['publish', 'closure', 'location'] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  publish: 'Publish dan rollback',
  closure: 'Penutupan dibuat, diubah, atau dihapus',
  location: 'Lokasi dibuat, diubah, atau dihapus',
};

export const WEBHOOK_DELIVERY_STATUSES = [
  'pending',
  'sending',
  'delivered',
  'retrying',
  'failed',
] as const;
export type WebhookDeliveryStatus = (typeof WEBHOOK_DELIVERY_STATUSES)[number];

export const WEBHOOK_DELIVERY_STATUS_LABELS: Record<WebhookDeliveryStatus, string> = {
  pending: 'Antre',
  sending: 'Dikirim',
  delivered: 'Terkirim',
  retrying: 'Dicoba ulang',
  failed: 'Gagal',
};

export const API_KEY_NAME_MAX = 80;
export const WEBHOOK_URL_MAX = 500;
export const API_UPSERT_MAX = 1000;

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: ApiScope[];
  venueIds: string[] | null;
  createdAt: string;
  createdBy: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  venueIds: string[] | null;
  active: boolean;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  status: WebhookDeliveryStatus;
  attempts: number;
  responseStatus: number | null;
  error: string | null;
  createdAt: string;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  deliveredAt: string | null;
}

export type IntegrationNameProblem = 'required' | 'too_long';

export function checkIntegrationName(name: string): IntegrationNameProblem | null {
  const trimmed = name.trim();
  if (!trimmed) return 'required';
  if (trimmed.length > API_KEY_NAME_MAX) return 'too_long';
  return null;
}

export type WebhookUrlProblem = 'required' | 'invalid' | 'too_long' | 'credentials';

/** Alamat penerima webhook: http(s) tanpa nama pengguna/password di URL. */
export function checkWebhookUrl(value: string): WebhookUrlProblem | null {
  const trimmed = value.trim();
  if (!trimmed) return 'required';
  if (trimmed.length > WEBHOOK_URL_MAX) return 'too_long';
  let parsed: ParsedUrl;
  try {
    parsed = new UrlConstructor(trimmed);
  } catch {
    return 'invalid';
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return 'invalid';
  if (parsed.username || parsed.password) return 'credentials';
  return null;
}

export const WEBHOOK_URL_MESSAGES: Record<WebhookUrlProblem, string> = {
  required: 'Alamat penerima wajib diisi.',
  invalid: 'Alamat harus diawali https:// atau http://.',
  too_long: `Alamat paling panjang ${WEBHOOK_URL_MAX} karakter.`,
  credentials: 'Jangan taruh nama pengguna atau password di alamat. Gunakan tanda tangan HMAC.',
};

/** Jeda sebelum percobaan berikutnya (detik), per percobaan yang sudah gagal. */
export const WEBHOOK_RETRY_DELAYS_S = [60, 300, 1800, 7200, 21600] as const;
export const WEBHOOK_MAX_ATTEMPTS = WEBHOOK_RETRY_DELAYS_S.length + 1;

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const SPAN = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/;
const STATUSES = ['active', 'coming_soon', 'inactive_temporary', 'inactive_permanent'] as const;
const CODE_MAX = 32;
const CODE_FORMAT = /^[A-Z0-9][A-Z0-9._/-]*$/;
const NAME_MAX = 120;
const CATEGORY_MAX = 20;

export interface ApiHoursRow {
  weekday: number | null;
  special_date: string | null;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
}

/** Satu baris upsert yang sudah diperiksa bentuknya, dalam bentuk yang dibaca `api_upsert_locations`. */
export interface ApiLocationUpsert {
  code: string;
  name?: string;
  type?: string;
  status?: (typeof STATUSES)[number];
  opening_date?: string | null;
  categories?: string[];
  weekly_hours?: ApiHoursRow[];
  special_hours?: ApiHoursRow[];
}

export type ApiParse<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function parseSpans(value: unknown, where: string, errors: string[]): OpeningSpan[] {
  if (!Array.isArray(value)) {
    errors.push(`${where} harus berupa daftar jam, mis. ["08:00-16:00"].`);
    return [];
  }
  return value.flatMap((item) => {
    const match = typeof item === 'string' ? SPAN.exec(item) : null;
    const opens = match?.[1] ?? '';
    const closes = match?.[2] ?? '';
    if (!TIME.test(opens) || !TIME.test(closes)) {
      errors.push(`${where}: "${String(item)}" bukan rentang jam JJ:MM-JJ:MM.`);
      return [];
    }
    return [{ opens, closes }];
  });
}

function parseHours(
  value: unknown,
  where: string,
  errors: string[],
): Pick<ApiLocationUpsert, 'weekly_hours' | 'special_hours'> {
  if (!isRecord(value)) {
    errors.push(`${where}.hours harus berupa objek { weekly, special }.`);
    return {};
  }
  const out: Pick<ApiLocationUpsert, 'weekly_hours' | 'special_hours'> = {};
  if (value.weekly !== undefined) {
    if (!isRecord(value.weekly)) {
      errors.push(`${where}.hours.weekly harus berupa objek per hari (mon … sun).`);
    } else {
      const unknown = Object.keys(value.weekly).filter(
        (day) => !(WEEKDAYS as readonly string[]).includes(day),
      );
      if (unknown.length)
        errors.push(`${where}.hours.weekly: hari tidak dikenal ${unknown.join(', ')}.`);
      const weekly = value.weekly;
      out.weekly_hours = WEEKDAYS.flatMap((day, i) =>
        weekly[day] === undefined
          ? []
          : parseSpans(weekly[day], `${where}.hours.weekly.${day}`, errors).map((span) => ({
              weekday: i + 1,
              special_date: null,
              opens_at: span.opens,
              closes_at: span.closes,
              is_closed: false,
            })),
      );
    }
  }
  if (value.special !== undefined) {
    if (!Array.isArray(value.special)) {
      errors.push(`${where}.hours.special harus berupa daftar { date, spans }.`);
    } else {
      const seen = new Set<string>();
      out.special_hours = value.special.flatMap((entry, i): ApiHoursRow[] => {
        const at = `${where}.hours.special[${i}]`;
        if (!isRecord(entry) || typeof entry.date !== 'string' || !DATE.test(entry.date)) {
          errors.push(`${at}.date harus berupa tanggal YYYY-MM-DD.`);
          return [];
        }
        if (seen.has(entry.date)) {
          errors.push(`${at}: tanggal ${entry.date} disebut dua kali.`);
          return [];
        }
        seen.add(entry.date);
        const spans = parseSpans(entry.spans ?? [], `${at}.spans`, errors);
        return spans.length === 0
          ? [
              {
                weekday: null,
                special_date: entry.date,
                opens_at: null,
                closes_at: null,
                is_closed: true,
              },
            ]
          : spans.map((span) => ({
              weekday: null,
              special_date: entry.date as string,
              opens_at: span.opens,
              closes_at: span.closes,
              is_closed: false,
            }));
      });
    }
  }
  return out;
}

function parseRow(value: unknown, index: number, errors: string[]): ApiLocationUpsert | null {
  const where = `locations[${index}]`;
  if (!isRecord(value)) {
    errors.push(`${where} harus berupa objek.`);
    return null;
  }
  const before = errors.length;
  const code = typeof value.code === 'string' ? value.code.trim().toUpperCase() : '';
  if (!code) errors.push(`${where}.code wajib diisi.`);
  else if (code.length > CODE_MAX)
    errors.push(`${where}.code paling panjang ${CODE_MAX} karakter.`);
  else if (!CODE_FORMAT.test(code))
    errors.push(
      `${where}.code hanya huruf, angka, titik, garis bawah, garis miring, dan tanda hubung.`,
    );
  const row: ApiLocationUpsert = { code };
  if (value.name !== undefined) {
    const name = typeof value.name === 'string' ? value.name.trim() : '';
    if (!name || name.length > NAME_MAX) errors.push(`${where}.name harus 1–${NAME_MAX} karakter.`);
    row.name = name;
  }
  if (value.type !== undefined) {
    if (typeof value.type !== 'string' || !value.type.trim())
      errors.push(`${where}.type harus nama tipe lokasi.`);
    else row.type = value.type.trim();
  }
  if (value.status !== undefined) {
    if (!(STATUSES as readonly unknown[]).includes(value.status)) {
      errors.push(`${where}.status harus salah satu dari ${STATUSES.join(', ')}.`);
    } else row.status = value.status as NonNullable<ApiLocationUpsert['status']>;
  }
  if (value.openingDate !== undefined) {
    if (
      value.openingDate !== null &&
      (typeof value.openingDate !== 'string' || !DATE.test(value.openingDate))
    ) {
      errors.push(`${where}.openingDate harus tanggal YYYY-MM-DD atau null.`);
    } else row.opening_date = value.openingDate as string | null;
  }
  if (row.status === 'coming_soon' && !row.opening_date) {
    errors.push(`${where}.openingDate wajib untuk status coming_soon.`);
  }
  if (value.categories !== undefined) {
    if (
      !Array.isArray(value.categories) ||
      value.categories.length > CATEGORY_MAX ||
      value.categories.some((c) => typeof c !== 'string' || !c.trim())
    ) {
      errors.push(`${where}.categories harus daftar nama kategori (maks. ${CATEGORY_MAX}).`);
    } else {
      row.categories = [...new Set((value.categories as string[]).map((c) => c.trim()))];
    }
  }
  if (value.hours !== undefined) Object.assign(row, parseHours(value.hours, where, errors));
  const known = ['code', 'name', 'type', 'status', 'openingDate', 'categories', 'hours'];
  const extra = Object.keys(value).filter((key) => !known.includes(key));
  if (extra.length) errors.push(`${where}: kolom tidak dikenal ${extra.join(', ')}.`);
  return errors.length === before ? row : null;
}

/** Badan `PUT /v1/venues/{id}/locations`: `{ "locations": [ … ] }`, maks. `API_UPSERT_MAX` baris. */
export function parseLocationUpsert(body: unknown): ApiParse<ApiLocationUpsert[]> {
  if (!isRecord(body) || !Array.isArray(body.locations)) {
    return { ok: false, errors: ['Badan permintaan harus { "locations": [ … ] }.'] };
  }
  if (body.locations.length === 0) return { ok: false, errors: ['Daftar locations kosong.'] };
  if (body.locations.length > API_UPSERT_MAX) {
    return { ok: false, errors: [`Paling banyak ${API_UPSERT_MAX} lokasi per permintaan.`] };
  }
  const errors: string[] = [];
  const rows = body.locations.flatMap((value, i) => parseRow(value, i, errors) ?? []);
  const codes = new Set<string>();
  for (const row of rows) {
    if (codes.has(row.code)) errors.push(`Kode ${row.code} disebut lebih dari sekali.`);
    codes.add(row.code);
  }
  return errors.length ? { ok: false, errors: errors.slice(0, 20) } : { ok: true, value: rows };
}

export interface ApiClosureInput {
  location_code: string | null;
  unit_code: string | null;
  reason: string;
  starts_at: string | null;
  ends_at: string | null;
}

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

/** Badan `POST /v1/venues/{id}/closures`: lokasi (kode) atau unit (kode unit), alasan, waktu. */
export function parseClosureInput(body: unknown): ApiParse<ApiClosureInput> {
  if (!isRecord(body)) return { ok: false, errors: ['Badan permintaan harus berupa objek.'] };
  const errors: string[] = [];
  const text = (key: string) =>
    typeof body[key] === 'string' && (body[key] as string).trim()
      ? (body[key] as string).trim()
      : null;
  const locationCode = text('locationCode');
  const unitCode = text('unitCode');
  if ((locationCode === null) === (unitCode === null)) {
    errors.push('Isi salah satu: locationCode atau unitCode.');
  }
  const reason = text('reason');
  if (!reason) errors.push('reason wajib diisi.');
  else if (reason.length > 200) errors.push('reason paling panjang 200 karakter.');
  const instant = (key: 'startsAt' | 'endsAt') => {
    const value = body[key];
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string' || !ISO_INSTANT.test(value) || Number.isNaN(Date.parse(value))) {
      errors.push(`${key} harus waktu ISO 8601 dengan zona, mis. 2026-12-01T08:00:00+07:00.`);
      return null;
    }
    return value;
  };
  const startsAt = instant('startsAt');
  const endsAt = instant('endsAt');
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
    errors.push('endsAt harus setelah startsAt.');
  }
  return errors.length
    ? { ok: false, errors }
    : {
        ok: true,
        value: {
          location_code: locationCode?.toUpperCase() ?? null,
          unit_code: unitCode,
          reason: reason ?? '',
          starts_at: startsAt,
          ends_at: endsAt,
        },
      };
}
