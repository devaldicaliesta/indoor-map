import { SESSION_IDLE_TIMEOUT_MS } from '@indoor/domain';

/** `from` dibawa ke /login lewat state router. */
export function readFromPath(state: unknown): string | undefined {
  if (typeof state !== 'object' || state === null) return undefined;
  const { from } = state as Record<string, unknown>;
  return typeof from === 'string' ? from : undefined;
}

const IDLE_MINUTES = SESSION_IDLE_TIMEOUT_MS / 60_000;

export const NOTICES = {
  idle: `Sesi berakhir karena tidak ada aktivitas selama ${IDLE_MINUTES} menit. Silakan masuk lagi.`,
  passwordChanged: 'Password berhasil diubah. Masuk dengan password baru.',
} as const;

// Pesan sekali tampil untuk halaman /login. Disimpan di sessionStorage (bukan state router)
// karena keluar dari sesi memicu beberapa pengalihan yang bisa menimpa state.
const FLASH_KEY = 'indoor-admin.login-notice';

export function setLoginNotice(message: string) {
  try {
    sessionStorage.setItem(FLASH_KEY, message);
  } catch {
    // Penyimpanan diblokir: pesan tidak tampil, tetapi alurnya tetap benar.
  }
}

export function peekLoginNotice(): string | null {
  try {
    return sessionStorage.getItem(FLASH_KEY);
  } catch {
    return null;
  }
}

export function clearLoginNotice() {
  try {
    sessionStorage.removeItem(FLASH_KEY);
  } catch {
    // Diabaikan; lihat setLoginNotice.
  }
}
