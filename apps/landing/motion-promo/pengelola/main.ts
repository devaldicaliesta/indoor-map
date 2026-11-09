// Video promosi "Untuk Pengelola Gedung" (B2B): enam adegan di atas satu kanvas, digambar per
// frame oleh scripts/promo-motion.mjs lewat `window.seekMotion`. Bukan bagian build landing.
import logoUrl from '../../../../packages/ui/src/brand/panduarah-logo.svg?url';
import { loadCrowd } from '../shared/crowd';
import { drawHeadline, drawSubtitle } from '../shared/kinetic';
import {
  buildSchedule,
  type Schedule,
  sceneAt,
  type TimelineInput,
  toSrt,
} from '../shared/schedule';
import { createStage, loadFonts, loadImage } from '../shared/stage';
import { BPM, COPY, SCENES } from './copy';
import { layoutFor, type SceneModule, type Sfx } from './scene';
import { scene1 } from './scene-1-resepsionis';
import { scene2 } from './scene-2-editor';
import { scene3 } from './scene-3-qr';
import { scene4 } from './scene-4-penutupan';
import { scene5 } from './scene-5-on-premise';
import { scene6 } from './scene-6-penutup';

const MODULES: SceneModule[] = [scene1, scene2, scene3, scene4, scene5, scene6];

const stage = createStage();
const { ctx } = stage;
const copy = COPY[stage.lang];
const layout = layoutFor(stage);

/** `timeline.json` (durasi klip suara dari ffprobe) disajikan perekam; tanpa itu, timeline bawaan. */
async function loadTimeline(): Promise<TimelineInput | null> {
  try {
    const response = await fetch('./timeline.json');
    return response.ok ? ((await response.json()) as TimelineInput) : null;
  } catch {
    return null;
  }
}

const timeline = await loadTimeline();
const schedule: Schedule = buildSchedule({
  bpm: BPM,
  scenes: SCENES,
  lines: copy.lines,
  clips: SCENES.map((_, i) => timeline?.clips.find((c) => c.id === String(i + 1).padStart(2, '0'))),
});
const [crowd, logo] = await Promise.all([
  loadCrowd(10, 'panduarah-promo-pengelola'),
  loadImage(logoUrl),
]);
const assets = { crowd, logo };

function drawScene(index: number, t: number) {
  const scene = schedule.scenes[index];
  const module = MODULES[index];
  if (!scene || !module) return;
  const prev = schedule.scenes[index - 1];
  const cue = schedule.cues.find((c) => c.scene === index);
  ctx.save();
  module.draw({
    stage,
    ctx,
    t,
    dur: scene.end - scene.start,
    beat: schedule.beat,
    copy,
    assets,
    layout,
    prevDur: prev ? prev.end - prev.start : 0,
    cue: cue ? { start: cue.start - scene.start, end: cue.end - scene.start } : null,
    drawPrev: (pt) => drawScene(index - 1, pt),
  });
  ctx.restore();
}

/** Detik saat teks kinetik tiap adegan mulai muncul: tepat saat kalimat dubber mulai. */
function headlineOnset(index: number) {
  return schedule.cues.find((c) => c.scene === index)?.start ?? schedule.scenes[index]?.start ?? 0;
}

function frame(ms: number) {
  const t = ms / 1000;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  const scene = sceneAt(schedule, t);
  drawScene(scene.index, t - scene.start);
  const headline = copy.headlines[scene.index];
  if (headline) {
    const onset = headlineOnset(scene.index);
    drawHeadline(ctx, {
      text: headline,
      t: t - onset,
      exit: scene.end - 0.4 - onset,
      x: layout.text.x,
      y: layout.text.y,
      maxWidth: layout.text.w,
      size: layout.text.size,
      align: layout.text.align,
      stagger: schedule.beat / 2,
      // Frame pertama (thumbnail) sudah memuat judul utuh.
      alreadyIn: scene.index === 0 ? 99 : 0,
    });
  }
  if (stage.subs) {
    const cue = schedule.cues.find((c) => t >= c.start && t < c.end + 0.25);
    if (cue)
      drawSubtitle(
        ctx,
        stage,
        cue.text,
        Math.min(1, (t - cue.start) / 0.12, (cue.end + 0.25 - t) / 0.12),
      );
  }
}

const sfx: Sfx[] = schedule.scenes.flatMap((scene, i) => {
  const cue = schedule.cues.find((c) => c.scene === i);
  const local = cue ? { start: cue.start - scene.start, end: cue.end - scene.start } : null;
  return (MODULES[i]?.sfx?.(scene.end - scene.start, schedule.beat, local) ?? []).map((s) => ({
    ...s,
    t: s.t + scene.start,
  }));
});

declare global {
  interface Window {
    motionReady: boolean;
    seekMotion: (ms: number) => void;
    motionInfo: {
      duration: number;
      schedule: Schedule;
      sfx: Sfx[];
      srt: string;
      headlines: { scene: number; onset: number }[];
    };
  }
}

window.seekMotion = frame;
window.motionInfo = {
  duration: schedule.duration,
  schedule,
  sfx,
  srt: toSrt(schedule.cues),
  headlines: schedule.scenes.map((s) => ({ scene: s.index, onset: headlineOnset(s.index) })),
};
await loadFonts();
window.motionReady = true;
// Tanpa `?record` halaman diputar langsung (pratinjau di peramban).
if (!new URLSearchParams(location.search).has('record')) {
  const started = performance.now();
  const loop = (now: number) => {
    frame((now - started) % (schedule.duration * 1000));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
