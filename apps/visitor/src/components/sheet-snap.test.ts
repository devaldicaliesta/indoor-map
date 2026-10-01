import { describe, expect, it } from 'vitest';
import { cycleSnap, nearestSnap, snapHeight, stepSnap } from './sheet-snap';

const viewport = 800;

describe('bottom sheet', () => {
  it('tinggi tiap snap', () => {
    expect(snapHeight('peek', viewport)).toBe(96);
    expect(snapHeight('half', viewport)).toBe(400);
    expect(snapHeight('full', viewport)).toBe(728);
  });

  it('drag berhenti di snap terdekat', () => {
    expect(nearestSnap(150, viewport)).toBe('peek');
    expect(nearestSnap(380, viewport)).toBe('half');
    expect(nearestSnap(700, viewport)).toBe('full');
  });

  it('panah atas/bawah berhenti di ujung', () => {
    expect(stepSnap('peek', 'up')).toBe('half');
    expect(stepSnap('full', 'up')).toBe('full');
    expect(stepSnap('peek', 'down')).toBe('peek');
  });

  it('klik pegangan berputar', () => {
    expect([cycleSnap('peek'), cycleSnap('half'), cycleSnap('full')]).toEqual([
      'half',
      'full',
      'peek',
    ]);
  });
});
