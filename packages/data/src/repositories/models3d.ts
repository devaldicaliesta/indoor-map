import { checkGlb, GLB_MIME, GLB_PROBLEM_MESSAGES, type VenueId } from '@indoor/domain';
import { DataError, toDataError } from '../errors';
import type { Db } from '../supabase';

const ASSETS_BUCKET = 'public-assets';

export interface Models3dRepository {
  upload(venueId: VenueId, file: File): Promise<string>;
  url(path: string): string;
}

const safeName = (name: string) =>
  name
    .replace(/\.glb$/i, '')
    .normalize('NFD')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .toLowerCase() || 'model';

export function createModels3dRepository(db: Db): Models3dRepository {
  const storage = () => db.storage.from(ASSETS_BUCKET);
  return {
    async upload(venueId, file) {
      const problem = checkGlb(await file.arrayBuffer());
      if (problem) throw new DataError('invalid', { message: GLB_PROBLEM_MESSAGES[problem] });
      const path = `models/${venueId}/${safeName(file.name)}-${Date.now()}.glb`;
      const { error } = await storage().upload(path, new Blob([file], { type: GLB_MIME }), {
        contentType: GLB_MIME,
      });
      if (error) throw toDataError(error);
      return path;
    },
    url(path) {
      return storage().getPublicUrl(path).data.publicUrl;
    },
  };
}
