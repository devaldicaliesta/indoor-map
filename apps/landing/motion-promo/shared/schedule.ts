// Jadwal video: batas adegan di ketukan musik, satu kalimat dubber per adegan. Tanpa audio,
// panjang kalimat diperkirakan dari jumlah huruf (timeline bawaan konsep); dengan audio,
// `timeline.json` dari scripts/promo-motion.mjs berisi durasi tiap klip hasil ffprobe.

export interface SceneSpec {
  id: string;
  /** Panjang bawaan dalam ketukan (kelipatan 4 = satu birama). */
  beats: number;
  /** Ketukan setelah awal adegan saat dubber mulai bicara. */
  leadBeats: number;
}

export interface VoiceClip {
  id: string;
  duration: number;
  file?: string;
}

/** Isi `timeline.json` yang ditulis perekam. */
export interface TimelineInput {
  lang: string;
  clips: VoiceClip[];
}

export interface ScheduledScene {
  id: string;
  index: number;
  start: number;
  end: number;
  beats: number;
}

export interface Cue {
  id: string;
  scene: number;
  start: number;
  end: number;
  text: string;
  /** Ada klip suara sungguhan untuk kalimat ini. */
  voiced: boolean;
  file?: string;
}

export interface Schedule {
  bpm: number;
  beat: number;
  duration: number;
  scenes: ScheduledScene[];
  cues: Cue[];
}

/** Perkiraan lama bicara dubber (±15 huruf per detik, sedikit napas di tanda baca). */
export function estimateSpeech(text: string): number {
  const pauses = (text.match(/[,.:?!…]/g) ?? []).length;
  return Math.round((text.length / 15 + pauses * 0.12 + 0.2) * 100) / 100;
}

export function buildSchedule(o: {
  bpm: number;
  scenes: readonly SceneSpec[];
  lines: readonly string[];
  clips?: readonly (VoiceClip | undefined)[];
  /** Jeda setelah kalimat selesai sebelum adegan boleh berganti. */
  tail?: number;
}): Schedule {
  const beat = 60 / o.bpm;
  const bar = beat * 4;
  const tail = o.tail ?? 0.45;
  const scenes: ScheduledScene[] = [];
  const cues: Cue[] = [];
  let at = 0;
  o.scenes.forEach((spec, index) => {
    const line = o.lines[index] ?? '';
    const clip = o.clips?.[index];
    const speech = clip ? clip.duration : estimateSpeech(line);
    const lead = spec.leadBeats * beat;
    const needed = lead + speech + tail;
    // Adegan diperpanjang per birama agar batas adegan tetap jatuh di ketukan pertama.
    const bars = Math.max(spec.beats / 4, Math.ceil((needed - 1e-6) / bar));
    const beats = bars * 4;
    const start = round(at);
    const end = round(at + beats * beat);
    scenes.push({ id: spec.id, index, start, end, beats });
    if (line) {
      const cue: Cue = {
        id: String(index + 1).padStart(2, '0'),
        scene: index,
        start: round(start + lead),
        end: round(start + lead + speech),
        text: line,
        voiced: Boolean(clip),
      };
      if (clip?.file) cue.file = clip.file;
      cues.push(cue);
    }
    at += beats * beat;
  });
  return { bpm: o.bpm, beat, duration: round(at), scenes, cues };
}

const round = (v: number) => Math.round(v * 1000) / 1000;

/** Adegan yang sedang berjalan pada detik `t`. */
export function sceneAt(schedule: Schedule, t: number): ScheduledScene {
  const found = schedule.scenes.find((s) => t < s.end);
  return found ?? (schedule.scenes[schedule.scenes.length - 1] as ScheduledScene);
}

/** Subtitle SRT dari cue (waktu hh:mm:ss,mmm). */
export function toSrt(cues: readonly Cue[]): string {
  const stamp = (s: number) => {
    const ms = Math.round(s * 1000);
    const hh = String(Math.floor(ms / 3_600_000)).padStart(2, '0');
    const mm = String(Math.floor(ms / 60_000) % 60).padStart(2, '0');
    const ss = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss},${String(ms % 1000).padStart(3, '0')}`;
  };
  return cues
    .map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`)
    .join('\n');
}
