/** NFR-SEC-02: panjang password minimal. Sama dengan `minimum_password_length` di Supabase. */
export const PASSWORD_MIN_LENGTH = 8;

/** FR-AUTH-01: sesi Admin berakhir setelah 60 menit tanpa aktivitas. */
export const SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000;

export function isSessionIdle(
  lastActivityMs: number,
  nowMs: number,
  timeoutMs: number = SESSION_IDLE_TIMEOUT_MS,
): boolean {
  return nowMs - lastActivityMs >= timeoutMs;
}

export type NewPasswordProblem = 'too_short' | 'mismatch';

export function checkNewPassword(
  password: string,
  confirmation: string,
): NewPasswordProblem | null {
  if (password.length < PASSWORD_MIN_LENGTH) return 'too_short';
  if (password !== confirmation) return 'mismatch';
  return null;
}
