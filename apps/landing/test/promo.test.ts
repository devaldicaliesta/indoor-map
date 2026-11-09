// Video promosi (motion-promo): jadwal di ketukan musik, batas teks kinetik, dan kontras teks.
import { describe, expect, it } from 'vitest';
import { BPM, COPY, SCENES } from '../motion-promo/pengelola/copy';
import { C } from '../motion-promo/shared/draw';
import { parseHeadline } from '../motion-promo/shared/kinetic';
import { buildSchedule, estimateSpeech, toSrt } from '../motion-promo/shared/schedule';

const beat = 60 / BPM;

function luminance(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

describe('jadwal video pengelola', () => {
  it('timeline bawaan: 88 ketukan, setiap batas adegan di awal birama', () => {
    const s = buildSchedule({ bpm: BPM, scenes: SCENES, lines: COPY.id.lines });
    expect(s.duration).toBeCloseTo(88 * beat, 2);
    for (const scene of s.scenes) {
      const beats = scene.start / beat;
      expect(Math.abs(beats - Math.round(beats))).toBeLessThan(0.01);
      expect(Math.round(beats) % 4).toBe(0);
    }
    for (const cue of s.cues) {
      const scene = s.scenes[cue.scene];
      expect(cue.start).toBeCloseTo(
        (scene?.start ?? 0) + (SCENES[cue.scene]?.leadBeats ?? 0) * beat,
        2,
      );
      expect(cue.end).toBeLessThanOrEqual(scene?.end ?? 0);
      expect(cue.voiced).toBe(false);
    }
  });

  it('klip suara yang panjang memperpanjang adegannya per birama', () => {
    const clips = SCENES.map((_, i) => ({
      id: String(i + 1).padStart(2, '0'),
      duration: i === 1 ? 12 : 2,
    }));
    const s = buildSchedule({ bpm: BPM, scenes: SCENES, lines: COPY.id.lines, clips });
    const editor = s.scenes[1];
    expect(editor?.beats).toBe(24);
    expect(s.cues[1]?.end).toBeLessThanOrEqual(editor?.end ?? 0);
    expect(s.cues.every((c) => c.voiced)).toBe(true);
    expect(s.scenes[2]?.start).toBeCloseTo((12 + 24) * beat, 2);
  });

  it('perkiraan bicara bertambah dengan panjang kalimat', () => {
    expect(estimateSpeech('Data tetap milik Anda.')).toBeLessThan(
      estimateSpeech(COPY.id.lines[0] ?? ''),
    );
  });

  it('SRT memakai format jam:menit:detik,milidetik', () => {
    const srt = toSrt([
      { id: '01', scene: 0, start: 1.25, end: 62.5, text: 'Halo', voiced: false },
    ]);
    expect(srt).toBe('1\n00:00:01,250 --> 00:01:02,500\nHalo\n');
  });
});

describe('teks layar', () => {
  it.each(['id', 'en'] as const)('teks kinetik (%s) paling banyak lima kata', (lang) => {
    for (const headline of COPY[lang].headlines) {
      expect(parseHeadline(headline).length).toBeLessThanOrEqual(5);
    }
  });

  it('naskah ID dan EN punya kalimat untuk setiap adegan', () => {
    expect(COPY.id.lines).toHaveLength(SCENES.length);
    expect(COPY.en.lines).toHaveLength(SCENES.length);
  });

  it('pasangan warna teks lolos kontras 4.5:1', () => {
    const pairs: [string, string][] = [
      [C.ink, C.canvas],
      [C.ink, C.signal],
      [C.ink, C.signalSoft],
      [C.surface, C.ink],
      [C.muted, C.surface],
      [C.muted, C.canvas],
      [C.surface, C.danger],
      [C.danger, '#fdf1ee'],
      [C.surface, '#2b3036'],
    ];
    for (const [fg, bg] of pairs) expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
