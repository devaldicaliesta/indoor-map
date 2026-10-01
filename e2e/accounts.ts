import type { AppRole } from '@indoor/domain';

/** Akun seed per role di supabase/seed.sql; semuanya memakai SEED_ADMIN_PASSWORD. */
export const ACCOUNTS: Record<AppRole, { email: string; name: string }> = {
  super_admin: { email: 'admin@local.test', name: 'Super Admin Lokal' },
  admin: { email: 'pengelola@local.test', name: 'Admin Lokal' },
  editor: { email: 'editor@local.test', name: 'Editor Lokal' },
  operator: { email: 'operator@local.test', name: 'Operator Lokal' },
  viewer: { email: 'viewer@local.test', name: 'Viewer Lokal' },
};
