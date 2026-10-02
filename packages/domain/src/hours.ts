/** Rentang buka dalam jam dinding venue. `closes` ≤ `opens` berarti lewat tengah malam;
 * `opens` = `closes` berarti buka 24 jam. */
export interface OpeningSpan {
  opens: string;
  closes: string;
}

/**
 * Jam operasional: `weekly[0]` Senin … `weekly[6]` Minggu (hari kosong = libur), dan
 * `special` per tanggal `YYYY-MM-DD` yang menggantikan jadwal mingguan hari itu.
 */
export interface OpeningHours {
  weekly: OpeningSpan[][];
  special: Record<string, OpeningSpan[]>;
}

export type OpenState =
  | { open: true; closesAt: string | null }
  | { open: false; opensAt: { time: string; daysAhead: number } | null };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** Tanggal, hari ISO (1 = Senin), dan menit sejak tengah malam di zona waktu venue. */
function localParts(instant: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday')) + 1;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    weekday,
    minute: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** Tanggal kalender + `days` (tanpa zona waktu: aritmetika tanggal saja). */
function shiftDate(date: string, days: number): { date: string; weekday: number } {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return { date: d.toISOString().slice(0, 10), weekday: ((d.getUTCDay() + 6) % 7) + 1 };
}

function spansOn(hours: OpeningHours, date: string, weekday: number): OpeningSpan[] {
  return hours.special[date] ?? hours.weekly[weekday - 1] ?? [];
}

/**
 * Buka atau tutup pada `instant` menurut jam dinding `timezone` venue (bukan zona perangkat
 * pengunjung). Saat buka: jam tutup (`null` bila 24 jam); saat tutup: pembukaan berikutnya dalam
 * 7 hari ke depan.
 */
export function isOpenAt(hours: OpeningHours, timezone: string, instant: Date): OpenState {
  const now = localParts(instant, timezone);
  const today = spansOn(hours, now.date, now.weekday);
  for (const span of today) {
    const opens = minutes(span.opens);
    const closes = minutes(span.closes);
    if (opens === closes) return { open: true, closesAt: null };
    if (closes > opens ? now.minute >= opens && now.minute < closes : now.minute >= opens) {
      return { open: true, closesAt: span.closes };
    }
  }
  // Rentang kemarin yang melewati tengah malam masih berjalan pagi ini.
  const yesterday = shiftDate(now.date, -1);
  for (const span of spansOn(hours, yesterday.date, yesterday.weekday)) {
    const opens = minutes(span.opens);
    const closes = minutes(span.closes);
    if (closes < opens && now.minute < closes) return { open: true, closesAt: span.closes };
  }
  for (let days = 0; days <= 7; days++) {
    const day = days === 0 ? { date: now.date, weekday: now.weekday } : shiftDate(now.date, days);
    const next = spansOn(hours, day.date, day.weekday)
      .map((s) => s.opens)
      .filter((opens) => days > 0 || minutes(opens) > now.minute)
      .sort()[0];
    if (next) return { open: false, opensAt: { time: next, daysAhead: days } };
  }
  return { open: false, opensAt: null };
}

export type OpeningHoursProblem = 'time_format' | 'date_format';

export function checkOpeningHours(hours: OpeningHours): OpeningHoursProblem[] {
  const problems: OpeningHoursProblem[] = [];
  const spans = [...hours.weekly.flat(), ...Object.values(hours.special).flat()];
  if (spans.some((s) => !TIME.test(s.opens) || !TIME.test(s.closes))) problems.push('time_format');
  if (Object.keys(hours.special).some((d) => !DATE.test(d))) problems.push('date_format');
  return problems;
}

export const EMPTY_OPENING_HOURS: OpeningHours = {
  weekly: [[], [], [], [], [], [], []],
  special: {},
};

/** Jadwal tanpa satu pun rentang atau tanggal khusus: tidak ditampilkan di Visitor. */
export function hasOpeningHours(hours: OpeningHours): boolean {
  return hours.weekly.some((d) => d.length > 0) || Object.keys(hours.special).length > 0;
}

/** Baris tabel `opening_hours` (Edge Function publish dan repository memakai bentuk yang sama). */
export interface OpeningHoursRow {
  weekday: number | null;
  special_date: string | null;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
}

const hhmm = (time: string | null) => (time ?? '').slice(0, 5);

/** Baris `opening_hours` (Senin = 1) menjadi jadwal; hari tanpa baris atau tutup = libur. */
export function openingHoursFromRows(rows: readonly OpeningHoursRow[]): OpeningHours {
  const weekly: OpeningHours['weekly'] = [[], [], [], [], [], [], []];
  const special: OpeningHours['special'] = {};
  const sorted = [...rows].sort((a, b) => hhmm(a.opens_at).localeCompare(hhmm(b.opens_at)));
  for (const row of sorted) {
    const span =
      row.is_closed || !row.opens_at || !row.closes_at
        ? null
        : { opens: hhmm(row.opens_at), closes: hhmm(row.closes_at) };
    if (row.special_date) {
      special[row.special_date] ??= [];
      if (span) special[row.special_date]?.push(span);
    } else if (row.weekday && span) {
      weekly[row.weekday - 1]?.push(span);
    }
  }
  return { weekly, special };
}
