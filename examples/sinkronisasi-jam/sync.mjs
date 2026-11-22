#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

const DAYS = {
  senin: 'mon',
  selasa: 'tue',
  rabu: 'wed',
  kamis: 'thu',
  jumat: 'fri',
  sabtu: 'sat',
  minggu: 'sun',
};
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SPAN = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

function usage(message) {
  if (message) console.error(`Galat: ${message}\n`);
  console.error(`Pakai: node sync.mjs <jadwal.csv|jadwal.json> [--dry-run]

Variabel lingkungan:
  PANDUARAH_API_URL   mis. https://panduarah.rs.id/functions/v1/api
  PANDUARAH_API_KEY   kunci API dengan izin locations:write
  PANDUARAH_VENUE_ID  id venue (GET /v1/venues)`);
  process.exit(2);
}

function parseCsv(text) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  const header = rows
    .shift()
    ?.toLowerCase()
    .split(',')
    .map((h) => h.trim());
  if (header?.join(',') !== 'kode,hari,jam') usage('baris pertama CSV harus "kode,hari,jam".');

  const byCode = new Map();
  rows.forEach((line, index) => {
    const [code = '', day = '', span = ''] = line.split(',').map((cell) => cell.trim());
    const where = `baris ${index + 2}`;
    if (!code) usage(`${where}: kode kosong.`);
    const location = byCode.get(code.toUpperCase()) ?? { code: code.toUpperCase() };
    byCode.set(location.code, location);
    const closed = span.toLowerCase() === 'tutup';
    if (!closed && !SPAN.test(span))
      usage(`${where}: jam "${span}" bukan JJ:MM-JJ:MM atau "tutup".`);

    const weekday = DAYS[day.toLowerCase()];
    if (weekday) {
      location.hours ??= {};
      location.hours.weekly ??= {};
      location.hours.weekly[weekday] ??= [];
      if (!closed) location.hours.weekly[weekday].push(span);
    } else if (DATE.test(day)) {
      location.hours ??= {};
      location.hours.special ??= [];
      let special = location.hours.special.find((s) => s.date === day);
      if (!special) {
        special = { date: day, spans: [] };
        location.hours.special.push(special);
      }
      if (!closed) special.spans.push(span);
    } else {
      usage(`${where}: hari "${day}" bukan nama hari (senin…minggu) atau tanggal YYYY-MM-DD.`);
    }
  });
  return [...byCode.values()];
}

const [file, ...flags] = process.argv.slice(2);
if (!file) usage();
const dryRun = flags.includes('--dry-run');
const text = readFileSync(file, 'utf8');
const locations =
  extname(file).toLowerCase() === '.json' ? JSON.parse(text).locations : parseCsv(text);
if (!Array.isArray(locations) || locations.length === 0) usage('tidak ada lokasi di berkas.');

if (dryRun) {
  console.log(JSON.stringify({ locations }, null, 2));
  process.exit(0);
}

const { PANDUARAH_API_URL: base, PANDUARAH_API_KEY: key, PANDUARAH_VENUE_ID: venue } = process.env;
if (!base || !key || !venue)
  usage('PANDUARAH_API_URL, PANDUARAH_API_KEY, dan PANDUARAH_VENUE_ID wajib diisi.');

// API menerima paling banyak 1000 lokasi per permintaan; tiap permintaan semua-atau-tidak-sama-sekali.
let failed = false;
for (let i = 0; i < locations.length; i += 1000) {
  const batch = locations.slice(i, i + 1000);
  const response = await fetch(`${base.replace(/\/+$/, '')}/v1/venues/${venue}/locations`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations: batch }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    failed = true;
    console.error(`Ditolak (${response.status}): ${body.message ?? response.statusText}`);
    for (const error of body.errors ?? []) console.error(`  - ${error}`);
    continue;
  }
  const counts = { created: 0, updated: 0, unchanged: 0 };
  for (const row of body.locations) counts[row.action] += 1;
  console.log(
    `${batch.length} lokasi: ${counts.updated} diubah, ${counts.unchanged} tetap, ${counts.created} baru.`,
  );
}
if (!failed)
  console.log('Selesai. Perubahan tampil di Visitor setelah venue dipublish dari Admin.');
process.exitCode = failed ? 1 : 0;
