// Orang mini dari @indoor/map-core (renderCrowdSprite), sama seperti video landing; hanya
// ilustrasi, tidak menggambarkan posisi pengunjung sungguhan.
import {
  CROWD_FRAMES,
  type CrowdFacing,
  renderCrowdSprite,
  seededRandom,
  uniqueLooks,
} from '@indoor/map-core';

export interface Crowd {
  count: number;
  /** Kaki orang di (x, y); `size` = kelipatan ukuran asli sprite. */
  draw(
    ctx: CanvasRenderingContext2D,
    who: number,
    x: number,
    y: number,
    o: { facing?: CrowdFacing; walking?: boolean; t?: number; size?: number; alpha?: number },
  ): void;
  height: number;
}

export async function loadCrowd(count: number, seed: string): Promise<Crowd> {
  const looks = uniqueLooks(count, seededRandom(seed));
  const sprites = new Map<string, ImageBitmap>();
  await Promise.all(
    looks.flatMap((look, i) =>
      CROWD_FRAMES.flatMap((frame) =>
        (['left', 'right'] as CrowdFacing[]).map(async (facing) => {
          const image = renderCrowdSprite(look, frame, facing);
          const bitmap = await createImageBitmap(
            new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
          );
          sprites.set(`${i}-${frame}-${facing}`, bitmap);
        }),
      ),
    ),
  );
  const sample = sprites.get('0-stand-right');
  return {
    count,
    height: sample?.height ?? 48,
    draw(ctx, who, x, y, o) {
      const step = o.walking
        ? Math.floor(((o.t ?? 0) + who * 0.07) / 0.16) % 2
          ? 'stepA'
          : 'stepB'
        : 'stand';
      const sprite = sprites.get(`${who % count}-${step}-${o.facing ?? 'right'}`);
      if (!sprite) return;
      const size = o.size ?? 1;
      ctx.save();
      ctx.globalAlpha *= o.alpha ?? 1;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        sprite,
        Math.round(x - (sprite.width * size) / 2),
        Math.round(y - sprite.height * size),
        Math.round(sprite.width * size),
        Math.round(sprite.height * size),
      );
      ctx.restore();
    },
  };
}
