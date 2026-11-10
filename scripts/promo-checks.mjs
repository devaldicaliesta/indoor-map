// Pemeriksaan video promosi (scripts/promo-motion.mjs): waktu gambar diam untuk dinilai dan
// deteksi frame diam lebih dari satu detik.
import { spawnSync } from 'node:child_process';

/** t = 0, tengah setiap adegan, dan setiap transisi (sesaat sebelum/sesudah batas adegan). */
export function autoStills(schedule) {
  const times = [0];
  for (const s of schedule.scenes) {
    times.push((s.start + s.end) / 2);
    if (s.index) times.push(s.start - 0.3, s.start + 0.3);
  }
  times.push(schedule.duration - 0.05);
  return [...new Set(times.map((t) => Math.round(t * 100) / 100))].sort((a, b) => a - b);
}

/** Rentang frame tanpa perubahan berarti lebih dari 1 detik (selain kartu penutup). */
export function frozenRuns({ ffmpeg, file, W, H, fps }) {
  const w = 160;
  const h = Math.round((w * H) / W);
  const raw = spawnSync(
    ffmpeg,
    [
      '-v',
      'error',
      '-i',
      file,
      '-vf',
      `scale=${w}:${h}`,
      '-f',
      'rawvideo',
      '-pix_fmt',
      'gray',
      '-',
    ],
    {
      maxBuffer: 1 << 30,
    },
  ).stdout;
  const size = w * h;
  const runs = [];
  let start = null;
  for (let f = 1; f * size < raw.length; f++) {
    let diff = 0;
    for (let i = 0; i < size; i++) diff += Math.abs(raw[f * size + i] - raw[(f - 1) * size + i]);
    const still = diff / size < 0.02;
    if (still && start === null) start = f;
    if ((!still || (f + 1) * size >= raw.length) && start !== null) {
      if (f - start >= fps) runs.push({ from: start / fps, to: f / fps });
      start = null;
    }
  }
  return runs;
}
