import { describe, expect, it } from 'vitest';
import { applyEntitlements, enabledFeatures, lockedFeatureMessage } from '../src/entitlements';

describe('enabledFeatures', () => {
  it('hanya fitur berbayar yang dikenal, urutan tetap', () => {
    expect(enabledFeatures(['info_point', 'lain', '3d'])).toEqual(['3d', 'info_point']);
    expect(enabledFeatures([])).toEqual([]);
  });
  it('pesan kunci menyebut fiturnya', () => {
    expect(lockedFeatureMessage('3d')).toBe('Tampilan 3D tidak termasuk paket lisensi ini.');
  });
});

describe('applyEntitlements', () => {
  const snapshot = {
    version: 2,
    enabledFeatures: ['3d', 'info_point'],
    infoPoints: [{ id: 'ip' }],
  };
  it('fitur dari lisensi, Info Point dibuang tanpa fiturnya', () => {
    expect(applyEntitlements(snapshot, ['cad_import'])).toEqual({
      version: 2,
      enabledFeatures: ['cad_import'],
      infoPoints: [],
    });
  });
  it('Info Point tetap bila fiturnya ada', () => {
    expect(applyEntitlements(snapshot, ['info_point']).infoPoints).toHaveLength(1);
  });
});
