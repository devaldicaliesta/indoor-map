import { describe, expect, it, vi } from 'vitest';
import { detectWebGL, type WebGLProbeCanvas } from '../src/webgl';

function canvas(getContext: (kind: string) => unknown): WebGLProbeCanvas {
  return { getContext } as unknown as WebGLProbeCanvas;
}

describe('detectWebGL', () => {
  it('true bila WebGL2 tersedia, lalu konteks uji dilepas', () => {
    const loseContext = vi.fn();
    const getContext = vi.fn(() => ({
      getExtension: (name: string) => (name === 'WEBGL_lose_context' ? { loseContext } : null),
    }));
    expect(detectWebGL(() => canvas(getContext))).toBe(true);
    expect(getContext).toHaveBeenCalledWith('webgl2');
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it('true walau ekstensi pelepas konteks tidak ada', () => {
    expect(detectWebGL(() => canvas(() => ({ getExtension: () => null })))).toBe(true);
  });

  it('false bila hanya WebGL1 yang ada (MapLibre 6 butuh WebGL2)', () => {
    const getContext = (kind: string) => (kind === 'webgl' ? { getExtension: () => null } : null);
    expect(detectWebGL(() => canvas(getContext))).toBe(false);
  });

  it('false bila WebGL dimatikan atau pembuatan canvas melempar galat', () => {
    expect(detectWebGL(() => canvas(() => null))).toBe(false);
    expect(
      detectWebGL(() =>
        canvas(() => {
          throw new Error('WebGL diblokir');
        }),
      ),
    ).toBe(false);
    expect(
      detectWebGL(() => {
        throw new Error('tanpa DOM');
      }),
    ).toBe(false);
  });
});
