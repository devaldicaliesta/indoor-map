import {
  AppRoleSchema,
  type Profile,
  type ProfilePatch,
  type UserId,
  UserIdSchema,
} from '@indoor/domain';
import type { Tables, TablesUpdate } from '../database.types';
import { DataError, toDataError } from '../errors';
import { zeroRowsError } from '../mutations';
import type { Db } from '../supabase';

const COLUMNS =
  'user_id, full_name, email, role, is_active, all_venues, locked_until, created_at, updated_at';

export type ProfileRow = Pick<
  Tables<'profiles'>,
  | 'user_id'
  | 'full_name'
  | 'email'
  | 'role'
  | 'is_active'
  | 'all_venues'
  | 'locked_until'
  | 'created_at'
  | 'updated_at'
>;

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    userId: UserIdSchema.parse(row.user_id),
    fullName: row.full_name,
    email: row.email,
    role: AppRoleSchema.parse(row.role),
    isActive: row.is_active,
    allVenues: row.all_venues,
    lockedUntil: row.locked_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toProfileUpdate(patch: ProfilePatch): TablesUpdate<'profiles'> {
  const update: TablesUpdate<'profiles'> = {};
  if (patch.fullName !== undefined) update.full_name = patch.fullName;
  if (patch.role !== undefined) update.role = patch.role;
  if (patch.isActive !== undefined) update.is_active = patch.isActive;
  return update;
}

export interface ProfilesRepository {
  list(): Promise<Profile[]>;
  getById(userId: UserId): Promise<Profile>;
  update(userId: UserId, patch: ProfilePatch): Promise<Profile>;
}

export function createProfilesRepository(db: Db): ProfilesRepository {
  async function isVisible(userId: UserId): Promise<boolean> {
    const { data } = await db
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    return data !== null;
  }

  return {
    async list() {
      const { data, error } = await db.from('profiles').select(COLUMNS).order('full_name');
      if (error) throw toDataError(error);
      return data.map(mapProfileRow);
    },

    async getById(userId) {
      const { data, error } = await db
        .from('profiles')
        .select(COLUMNS)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw toDataError(error);
      if (!data) throw new DataError('not_found', { message: 'Pengguna tidak ditemukan.' });
      return mapProfileRow(data);
    },

    async update(userId, patch) {
      const { data, error } = await db
        .from('profiles')
        .update(toProfileUpdate(patch))
        .eq('user_id', userId)
        .select(COLUMNS);
      if (error) throw toDataError(error);
      const row = data[0];
      if (!row) throw await zeroRowsError(() => isVisible(userId));
      return mapProfileRow(row);
    },
  };
}
