// Musik sintetis dan campuran audio video promosi (dipakai scripts/promo-motion.mjs). Tanpa
// dependency: gelombang dihitung langsung di JavaScript lalu ditulis sebagai WAV 16-bit.
// Musik mengikuti jadwal halaman: birama, aksen di batas adegan, efek suara UI, dan diredam
// −14 dB selama dubber berbicara.

export const RATE = 48_000;

const TAU = Math.PI * 2;
const midi = (n) => 440 * 2 ** ((n - 69) / 12);
// Cmaj7 – Am7 – Fmaj7 – G6: cerah dan tenang untuk video korporat.
const CHORDS = [
  [48, 55, 59, 64, 67],
  [45, 52, 55, 60, 64],
  [41, 48, 52, 57, 64],
  [43, 50, 55, 59, 64],
];

/** Derau putih deterministik (xorshift) agar render berulang menghasilkan audio yang sama. */
function noiseSource(seed = 7) {
  let s = seed;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };
}

function addTone(buf, start, length, fn) {
  const from = Math.max(0, Math.floor(start * RATE));
  const to = Math.min(buf.length, from + Math.floor(length * RATE));
  for (let i = from; i < to; i++) buf[i] += fn((i - from) / RATE);
}

function addNoise(buf, start, length, gain, decay, hp = 0.6, seed = 1) {
  const rnd = noiseSource(seed + Math.floor(start * 1000));
  let prevX = 0;
  let prevY = 0;
  addTone(buf, start, length, (t) => {
    const x = rnd();
    // Highpass satu kutub: menyisakan "desis" untuk hi-hat dan tepuk.
    const y = hp * (prevY + x - prevX);
    prevX = x;
    prevY = y;
    return y * gain * Math.exp(-t / decay);
  });
}

function kick(buf, at, gain) {
  let phase = 0;
  addTone(buf, at, 0.45, (t) => {
    const f = 45 + 95 * Math.exp(-t * 28);
    phase += (TAU * f) / RATE;
    return Math.sin(phase) * gain * Math.exp(-t * 7);
  });
}

function pluck(buf, at, note, gain) {
  const f = midi(note);
  addTone(buf, at, 0.6, (t) => {
    const env = Math.min(1, t * 400) * Math.exp(-t * 7.5);
    return (
      (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t) + 0.08 * Math.sin(TAU * 3 * f * t)) *
      env *
      gain
    );
  });
}

function pad(buf, at, length, notes, gain) {
  addTone(buf, at, length + 0.6, (t) => {
    const env = Math.min(1, t / 0.35) * (t > length ? Math.exp(-(t - length) * 6) : 1);
    let v = 0;
    for (const n of notes) {
      const f = midi(n + 12);
      v += Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 1.003 * t + 1.3);
    }
    return (v / notes.length) * env * gain;
  });
}

function bass(buf, at, length, note, gain) {
  const f = midi(note - 12);
  addTone(buf, at, length, (t) => {
    const env = Math.min(1, t * 200) * Math.exp(-t * 2.2);
    return (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t)) * env * gain;
  });
}

function sfx(buf, at, kind) {
  switch (kind) {
    case 'click':
      addTone(buf, at, 0.04, (t) => Math.sin(TAU * 2600 * t) * 0.22 * Math.exp(-t * 160));
      addNoise(buf, at, 0.02, 0.12, 0.004, 0.9, 3);
      break;
    case 'tick':
      addTone(buf, at, 0.05, (t) => Math.sin(TAU * 1900 * t) * 0.1 * Math.exp(-t * 120));
      break;
    case 'type':
      addNoise(buf, at, 0.03, 0.08, 0.006, 0.95, 5);
      break;
    case 'pop':
      addTone(
        buf,
        at,
        0.12,
        (t) => Math.sin(TAU * (520 + 2600 * t) * t) * 0.24 * Math.exp(-t * 32),
      );
      break;
    case 'ding':
      addTone(
        buf,
        at,
        0.9,
        (t) =>
          (Math.sin(TAU * 1318.5 * t) + 0.4 * Math.sin(TAU * 2637 * t)) * 0.16 * Math.exp(-t * 5),
      );
      addTone(buf, at + 0.09, 0.9, (t) => Math.sin(TAU * 1975.5 * t) * 0.12 * Math.exp(-t * 5));
      break;
    case 'whoosh': {
      const rnd = noiseSource(11 + Math.floor(at * 100));
      let low = 0;
      addTone(buf, at - 0.25, 0.7, (t) => {
        const env = Math.sin(Math.PI * Math.min(1, t / 0.7)) ** 2;
        low += (0.05 + 0.25 * env) * (rnd() - low);
        return low * 0.9 * env;
      });
      break;
    }
    case 'hit':
      addNoise(buf, at, 1.6, 0.2, 0.45, 0.85, 9);
      kick(buf, at, 0.5);
      break;
    default:
      break;
  }
}

/** Musik 1 kanal sepanjang jadwal, lengkap dengan aksen adegan dan efek suara. */
export function synthMusic({ schedule, sfx: effects }) {
  const n = Math.ceil(schedule.duration * RATE);
  const music = new Float32Array(n);
  const fx = new Float32Array(n);
  const beat = schedule.beat;
  const totalBeats = Math.round(schedule.duration / beat);
  const lastScene = schedule.scenes[schedule.scenes.length - 1];
  const outroBeat = Math.round(lastScene.start / beat);
  for (let b = 0; b < totalBeats; b++) {
    const at = b * beat;
    const bar = Math.floor(b / 4);
    const inBar = b % 4;
    const chord = CHORDS[bar % CHORDS.length];
    const intro = b < 8;
    const outro = b >= outroBeat;
    const tail = b >= outroBeat + 4;
    if (inBar === 0 && !tail) {
      pad(music, at, beat * 4, chord.slice(1), 0.05);
      bass(music, at, beat * 2, chord[0], 0.22);
    }
    if (!tail && inBar === 2 && !intro) bass(music, at + beat / 2, beat * 1.5, chord[0], 0.16);
    if (!tail) {
      if (inBar === 0 || inBar === 2 || (!intro && !outro)) kick(music, at, intro ? 0.32 : 0.42);
      if (!intro && (inBar === 1 || inBar === 3)) addNoise(music, at, 0.25, 0.16, 0.07, 0.75, b);
      addNoise(music, at + beat / 2, 0.06, intro ? 0.04 : 0.07, 0.018, 0.95, b + 99);
    }
    // Arpeggio seperdelapan dari nada akor.
    if (!tail || b === outroBeat + 4) {
      for (let k = 0; k < 2; k++) {
        const note = (chord[1 + ((inBar * 2 + k) % 4)] ?? 60) + 12;
        pluck(music, at + (k * beat) / 2, note, intro ? 0.05 : 0.065);
      }
    }
  }
  if (lastScene) {
    // Riser dua ketukan sebelum adegan penutup, lalu akor akhir yang dibiarkan berbunyi.
    const rnd = noiseSource(42);
    let low = 0;
    addTone(music, lastScene.start - beat * 2, beat * 2, (t) => {
      const p = t / (beat * 2);
      low += (0.02 + 0.3 * p) * (rnd() - low);
      return low * 0.5 * p * p;
    });
    const end = lastScene.start + beat * 4;
    pad(music, end, schedule.duration - end - 0.5, [60, 64, 67, 71, 74], 0.06);
    bass(music, end, 3, 48, 0.24);
    kick(music, end, 0.4);
  }
  for (const scene of schedule.scenes.slice(1)) sfx(fx, scene.start, 'hit');
  for (const e of effects) sfx(fx, e.t, e.kind);
  // Pudar di akhir agar tidak terpotong.
  const fade = Math.floor(1.2 * RATE);
  for (let i = 0; i < fade; i++) {
    const g = (1 - i / fade) ** 2;
    music[n - fade + i] *= g;
    fx[n - fade + i] *= g;
  }
  return { music, fx };
}

/** Penguatan musik per sampel: −14 dB saat dubber bicara, transisi 120 ms. */
export function duckGain(n, cues) {
  const gain = new Float32Array(n).fill(1);
  const low = 10 ** (-14 / 20);
  const ramp = 0.12;
  for (const cue of cues.filter((c) => c.voiced)) {
    const a = cue.start - 0.08;
    const b = cue.end + 0.15;
    const from = Math.max(0, Math.floor((a - ramp) * RATE));
    const to = Math.min(n, Math.ceil((b + ramp) * RATE));
    for (let i = from; i < to; i++) {
      const t = i / RATE;
      const into = Math.min(1, Math.max(0, (t - (a - ramp)) / ramp));
      const out = Math.min(1, Math.max(0, (b + ramp - t) / ramp));
      const g = 1 - (1 - low) * Math.min(into, out);
      gain[i] = Math.min(gain[i], g);
    }
  }
  return gain;
}

/** Gabungkan musik, efek, dan suara dubber menjadi stereo, puncak dinormalkan ke −1 dBFS. */
export function mixdown({ music, fx, gain, voices }) {
  const n = music.length;
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const m = music[i] * gain[i];
    const e = fx[i] * (0.55 + 0.45 * gain[i]);
    left[i] = m + e;
    right[i] = m + e;
  }
  for (const v of voices) {
    const from = Math.floor(v.start * RATE);
    for (let i = 0; i < v.samples.length && from + i < n; i++) {
      left[from + i] += v.samples[i] * 0.95;
      right[from + i] += v.samples[i] * 0.95;
    }
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const k = peak > 0 ? 0.89 / peak : 1;
  for (let i = 0; i < n; i++) {
    left[i] *= k;
    right[i] *= k;
  }
  return { left, right };
}

export function wav({ left, right }) {
  const n = left.length;
  const out = Buffer.alloc(44 + n * 4);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + n * 4, 4);
  out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(2, 22);
  out.writeUInt32LE(RATE, 24);
  out.writeUInt32LE(RATE * 4, 28);
  out.writeUInt16LE(4, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), 44 + i * 4);
    out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), 46 + i * 4);
  }
  return out;
}
