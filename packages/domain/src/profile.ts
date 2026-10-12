import { z } from 'zod';
import type { UserId } from './ids';

/** Urutan dari hak terbesar ke terkecil (lihat Aktor dan role di spesifikasi). */
export const APP_ROLES = ['super_admin', 'admin', 'editor', 'operator', 'viewer'] as const;
export const AppRoleSchema = z.enum(APP_ROLES);
export type AppRole = z.infer<typeof AppRoleSchema>;

export interface Profile {
  userId: UserId;
  fullName: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  /** true: akses semua venue (on-premise). false: hanya venue keanggotaannya (pengguna trial). */
  allVenues: boolean;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProfilePatch = Partial<Pick<Profile, 'fullName' | 'role' | 'isActive'>>;
