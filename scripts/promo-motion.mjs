// Video promosi PanduArah (bukan video landing 15 detik): halaman apps/landing/motion-promo/<konsep>
// dibangun Vite, digambar per frame di Chromium Playwright (30 fps, deterministik), dikodekan ke
// MP4 H.264 + AAC dengan ffmpeg sistem. Audio: klip dubber audio/<lang>/NN.mp3 (durasinya
// diukur ffprobe → timeline.json yang dibaca halaman) dan music.mp3; tanpa music.mp3, musik
// sintetis dibuat sesuai BPM konsep. Hasil di apps/landing/motion-promo/out/ (tidak di-commit).
//
//   node scripts/promo-motion.mjs --concept pengelola --size 1920x1080 --lang id [--burn-subs]
//   node scripts/promo-motion.mjs --concept pengelola --stills 0,3.4,8   # gambar diam (detik)
import { spawn, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { autoStills, frozenRuns } from './promo-checks.mjs';
import { duckGain, mixdown, RATE, synthMusic, wav } from './promo-music.mjs';

const FFMPEG = '/usr/bin/ffmpeg';
const FFPROBE = '/usr/bin/ffprobe';
const FPS = 30;
const SIZES = ['1920x1080', '1080x1920'];
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

const { values: args } = parseArgs({
  options: {
    concept: { type: 'string', default: 'pengelola' },
    size: { type: 'string', default: SIZES[0] },
    lang: { type: 'string', default: 'id' },
    'burn-subs': { type: 'boolean', default: false },
    stills: { type: 'string' },
  },
});
if (!SIZES.includes(args.size)) throw new Error(`--size harus ${SIZES.join(' atau ')}`);
if (!['id', 'en'].includes(args.lang)) throw new Error('--lang harus id atau en');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const promo = join(root, 'apps/landing/motion-promo');
const OUT = join(promo, 'out');
const [W, H] = args.size.split('x').map(Number);
const base = `${args.concept}-${args.size}-${args.lang}${args['burn-subs'] ? '-subs' : ''}`;
mkdirSync(OUT, { recursive: true });

function run(cmd, list, options = {}) {
  const result = spawnSync(cmd, list, { encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(`${cmd} gagal: ${result.stderr ?? ''}`);
  return result.stdout ?? '';
}
/** Argumen tetap ffmpeg ditulis sebagai satu string agar mudah dibaca. */
const flags = (value) => value.split(' ');
const probe = (file, entries) =>
  JSON.parse(run(FFPROBE, ['-v', 'error', '-print_format', 'json', ...entries, file]));

/** Klip dubber per kalimat: folder konsep dulu, lalu folder bersama motion-promo/audio. */
function voiceClips() {
  for (const dir of [
    join(promo, args.concept, 'audio', args.lang),
    join(promo, 'audio', args.lang),
  ]) {
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir)
      .filter((f) => /^\d\d\.mp3$/.test(f))
      .sort();
    if (!files.length) continue;
    return files.map((f) => ({
      id: f.slice(0, 2),
      file: join(dir, f),
      duration: Number(probe(join(dir, f), ['-show_format']).format.duration),
    }));
  }
  return [];
}
const musicFile = [join(promo, args.concept, 'music.mp3'), join(promo, 'music.mp3')].find(
  existsSync,
);
const clips = voiceClips();
const timelineInput = clips.length
  ? { lang: args.lang, clips: clips.map((c) => ({ ...c, file: relative(root, c.file) })) }
  : null;

const build = mkdtempSync(join(tmpdir(), 'promo-motion-'));
run(
  'pnpm',
  [
    '--filter',
    '@indoor/landing',
    'exec',
    'vite',
    'build',
    '--config',
    'vite.promo.config.ts',
    '--outDir',
    build,
    '--emptyOutDir',
  ],
  {
    cwd: root,
    env: { ...process.env, PROMO_CONCEPT: args.concept },
    stdio: ['ignore', 'ignore', 'pipe'],
  },
);

const require = createRequire(join(root, 'e2e/package.json'));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.route('http://promo.local/**', (route) => {
  const path = new URL(route.request().url()).pathname.replace(/^\/+/, '') || 'index.html';
  if (path.endsWith('timeline.json')) {
    return timelineInput
      ? route.fulfill({ body: JSON.stringify(timelineInput), contentType: TYPES['.json'] })
      : route.fulfill({ status: 404 });
  }
  const file = join(build, path);
  if (!existsSync(file)) return route.fulfill({ status: 404 });
  return route.fulfill({
    body: readFileSync(file),
    contentType: TYPES[extname(file)] ?? 'application/octet-stream',
  });
});
const query = new URLSearchParams({ size: args.size, lang: args.lang });
if (args['burn-subs']) query.set('subs', '');
page.on('pageerror', (e) => process.stderr.write(`Halaman: ${e.message}\n`));
await page.goto(`http://promo.local/motion-promo/${args.concept}/index.html?record&${query}`);
await page.waitForFunction(() => window.motionReady === true, null, { timeout: 60_000 });
const info = await page.evaluate(() => window.motionInfo);
const shot = async (seconds, path) => {
  await page.evaluate((ms) => window.seekMotion(ms), seconds * 1000);
  return page.screenshot({ type: 'jpeg', quality: 92, ...(path ? { path } : {}) });
};

if (args.stills) {
  const dir = join(OUT, 'stills');
  mkdirSync(dir, { recursive: true });
  const times =
    args.stills === 'auto' ? autoStills(info.schedule) : args.stills.split(',').map(Number);
  for (const s of times) await shot(s, join(dir, `${base}-${s.toFixed(2)}.jpg`));
  await browser.close();
  rmSync(build, { recursive: true, force: true });
  process.stdout.write(`${times.length} gambar diam di ${relative(root, dir)}\n`);
  process.exit(0);
}

// 1. Video: JPEG per frame lewat pipa ke ffmpeg sistem.
const silent = join(build, 'video.mp4');
const encoder = spawn(
  FFMPEG,
  [
    ...flags(`-hide_banner -loglevel error -y -f image2pipe -framerate ${FPS} -c:v mjpeg -i -`),
    ...flags(`-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r ${FPS}`),
    silent,
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] },
);
const encoded = new Promise((done, fail) =>
  encoder.on('close', (code) => (code ? fail(new Error(`ffmpeg ${code}`)) : done())),
);
const frames = Math.round(info.duration * FPS);
for (let i = 0; i < frames; i++) {
  const buffer = await shot(i / FPS);
  if (!encoder.stdin.write(buffer)) await new Promise((r) => encoder.stdin.once('drain', r));
  if (i % 150 === 0) process.stdout.write(`frame ${i}/${frames}\n`);
}
encoder.stdin.end();
await encoded;
await shot(0, join(OUT, `${base}-thumb.jpg`));
await browser.close();

// 2. Audio: musik (berkas atau sintetis) diredam saat dubber bicara, efek UI, klip dubber.
const decode = (file, channels) => {
  const raw = spawnSync(
    FFMPEG,
    ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', String(channels), '-ar', String(RATE), '-'],
    {
      maxBuffer: 1 << 30,
    },
  );
  if (raw.status !== 0) throw new Error(`ffmpeg gagal membaca ${file}`);
  return new Float32Array(raw.stdout.buffer, raw.stdout.byteOffset, raw.stdout.byteLength / 4);
};
const synth = synthMusic({ schedule: info.schedule, sfx: info.sfx });
let music = synth.music;
if (musicFile) {
  const decoded = decode(musicFile, 1);
  music = new Float32Array(synth.music.length);
  music.set(decoded.subarray(0, music.length));
  const fade = Math.min(music.length, RATE * 1.2);
  for (let i = 0; i < fade; i++) music[music.length - fade + i] *= (1 - i / fade) ** 2;
}
const voices = info.schedule.cues
  .filter((c) => c.voiced && c.file)
  .map((c) => ({ start: c.start, samples: decode(join(root, c.file), 1) }));
const gain = duckGain(music.length, info.schedule.cues);
const audio = join(build, 'audio.wav');
writeFileSync(audio, wav(mixdown({ music, fx: synth.fx, gain, voices })));

// 3. Gabungkan, subtitle, lembar kontak, laporan.
const mp4 = join(OUT, `${base}.mp4`);
// loudnorm: kenyaringan rata −16 LUFS seperti konten media sosial, puncak di bawah −1,5 dBTP.
run(FFMPEG, [
  ...flags('-hide_banner -loglevel error -y -i'),
  silent,
  '-i',
  audio,
  ...flags('-c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -movflags +faststart'),
  ...['-ar', String(RATE), '-shortest', mp4],
]);
writeFileSync(join(OUT, `${base}.srt`), info.srt);
const cols = W > H ? 8 : 10;
run(FFMPEG, [
  ...flags('-hide_banner -loglevel error -y -i'),
  mp4,
  '-vf',
  `fps=1,scale=${Math.round(W / 5)}:-1,tile=${cols}x${Math.ceil(info.duration / cols)}:padding=6:color=white`,
  ...flags('-frames:v 1 -q:v 3'),
  join(OUT, `${base}-contact.jpg`),
]);
const closing = info.schedule.scenes[info.schedule.scenes.length - 1].start;
const frozen = frozenRuns({ ffmpeg: FFMPEG, file: mp4, W, H, fps: FPS }).filter(
  (r) => r.to <= closing + 1,
);
const meta = probe(mp4, ['-show_streams', '-show_format']);
const video = meta.streams.find((s) => s.codec_type === 'video');
const sound = meta.streams.find((s) => s.codec_type === 'audio');
const sync = info.schedule.cues.map((c) => {
  const headline = info.headlines.find((h) => h.scene === c.scene);
  return {
    cue: c.id,
    voice: c.start,
    text: headline?.onset ?? null,
    diff: headline ? Math.abs(headline.onset - c.start) : null,
  };
});
const report = {
  file: relative(root, mp4),
  duration: Number(meta.format.duration),
  expected: info.duration,
  video: {
    codec: video?.codec_name,
    fps: video?.avg_frame_rate,
    size: `${video?.width}x${video?.height}`,
    frames: Number(video?.nb_frames),
  },
  audio: { codec: sound?.codec_name, rate: sound?.sample_rate, channels: sound?.channels },
  faststart: true,
  voice: timelineInput ? 'klip dubber' : 'tanpa klip dubber (timeline bawaan)',
  music: musicFile ? relative(root, musicFile) : `sintetis ${info.schedule.bpm} BPM`,
  scenes: info.schedule.scenes.map((s) => ({
    id: s.id,
    start: s.start,
    end: s.end,
    beats: s.beats,
  })),
  sync,
  frozenOutsideClosing: frozen,
};
writeFileSync(
  join(OUT, `${base}.timeline.json`),
  JSON.stringify({ input: timelineInput, schedule: info.schedule, sfx: info.sfx }, null, 2),
);
writeFileSync(join(OUT, `${base}.report.json`), JSON.stringify(report, null, 2));
rmSync(build, { recursive: true, force: true });
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
