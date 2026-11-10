import {
  isNotificationKind,
  type NotificationKind,
  type NotificationPreferences,
  withDefaultPreferences,
} from '@indoor/domain';
import { toDataError } from '../errors';
import type { Db } from '../supabase';

/** Preferensi email pengguna yang sedang masuk (RLS: hanya miliknya) dan berhenti langganan. */
export interface NotificationsRepository {
  preferences(): Promise<NotificationPreferences>;
  setPreference(kind: NotificationKind, enabled: boolean): Promise<void>;
  /**
   * Tautan berhenti berlangganan dari email, tanpa login. `apply = false` hanya menanyakan
   * jenisnya. `null` bila token tidak dikenal.
   */
  unsubscribe(token: string, apply: boolean): Promise<NotificationKind | null>;
}

export function createNotificationsRepository(db: Db): NotificationsRepository {
  return {
    async preferences() {
      const { data, error } = await db.from('notification_preferences').select('kind, enabled');
      if (error) throw toDataError(error);
      const saved: Partial<NotificationPreferences> = {};
      for (const row of data) if (isNotificationKind(row.kind)) saved[row.kind] = row.enabled;
      return withDefaultPreferences(saved);
    },

    async setPreference(kind, enabled) {
      // user_id diisi server dari sesi (default auth.uid()), tidak pernah dari klien.
      const { error } = await db
        .from('notification_preferences')
        .upsert(
          { kind, enabled, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,kind' },
        );
      if (error) throw toDataError(error);
    },

    async unsubscribe(token, apply) {
      const { data, error } = await db.rpc('notification_unsubscribe', {
        p_token: token,
        p_apply: apply,
      });
      if (error) throw toDataError(error);
      return isNotificationKind(data) ? data : null;
    },
  };
}
