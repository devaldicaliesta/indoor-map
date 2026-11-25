/** Sama dengan `GOTRUE_PASSWORD_MIN_LENGTH` (deploy) dan `minimum_password_length` (Supabase). */
export const PASSWORD_MIN_LENGTH = 12;

/** Sama dengan `GOTRUE_SESSIONS_INACTIVITY_TIMEOUT` (ASVS 3.3.2 L2: paling lama 30 menit). */
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function isSessionIdle(
  lastActivityMs: number,
  nowMs: number,
  timeoutMs: number = SESSION_IDLE_TIMEOUT_MS,
): boolean {
  return nowMs - lastActivityMs >= timeoutMs;
}

export type PasswordProblem = 'too_short' | 'too_common';
export type NewPasswordProblem = PasswordProblem | 'mismatch';

/** Data akun yang tidak boleh menjadi inti password. */
export interface PasswordContext {
  email?: string;
  name?: string;
}

// Kata yang paling sering menjadi inti password bocor, ditambah kata khas produk dan bahasa
// Indonesia. Server tanpa internet tidak bisa memakai pengecekan HaveIBeenPwned GoTrue, jadi
// daftar ini menjadi lapis yang selalu jalan.
const COMMON_WORDS = new Set([
  'abc',
  'abcd',
  'abcdef',
  'admin',
  'administrator',
  'asdfgh',
  'asdfghjkl',
  'bismillah',
  'changeme',
  'cinta',
  'default',
  'dragon',
  'football',
  'iloveyou',
  'indonesia',
  'indoormap',
  'jakarta',
  'katasandi',
  'letmein',
  'login',
  'master',
  'merdeka',
  'monkey',
  'panduarah',
  'passw',
  'password',
  'princess',
  'qwerty',
  'qwertyuiop',
  'rahasia',
  'root',
  'sandi',
  'sayang',
  'sayangku',
  'secret',
  'sunshine',
  'superadmin',
  'test',
  'testing',
  'user',
  'welcome',
  'zxcvbnm',
]);

const LEET: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '3': 'e',
  '1': 'i',
  '!': 'i',
  '0': 'o',
  $: 's',
  '5': 's',
  '7': 't',
};

/** Inti huruf password: angka/simbol di awal dan akhir dibuang, leet di tengah dibaca huruf. */
function letterCore(password: string): string {
  const inner = password.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');
  return [...inner]
    .map((char) => LEET[char] ?? char)
    .join('')
    .replace(/[^a-z]/g, '');
}

const letters = (text: string) => text.toLowerCase().replace(/[^a-z]/g, '');

function contextWords(context: PasswordContext): string[] {
  const local = context.email?.split('@')[0] ?? '';
  const name = context.name ?? '';
  return [letters(local), letters(name), ...name.split(/\s+/).map(letters)].filter(
    (word) => word.length >= 4,
  );
}

/** Karakter sama semua, atau deret naik/turun (angka boleh melingkar 9→0). */
function isTrivialSequence(password: string): boolean {
  const chars = [...password.toLowerCase()];
  if (chars.every((char) => char === chars[0])) return true;
  const steps = chars.slice(1).map((char, i) => {
    const prev = chars[i] ?? '';
    const isDigit = /\d/.test(char) && /\d/.test(prev);
    const diff = char.charCodeAt(0) - prev.charCodeAt(0);
    return isDigit ? (diff + 10) % 10 : diff;
  });
  const isDigits = /^\d+$/.test(password);
  return steps.every((step) => step === 1) || steps.every((step) => step === (isDigits ? 9 : -1));
}

/** Aturan password baru (ASVS 2.1.1 dan 2.1.7); dipakai form Admin dan aktivasi lisensi. */
export function passwordProblem(
  password: string,
  context: PasswordContext = {},
): PasswordProblem | null {
  if (password.length < PASSWORD_MIN_LENGTH) return 'too_short';
  if (isTrivialSequence(password)) return 'too_common';
  const core = letterCore(password);
  if (core && (COMMON_WORDS.has(core) || contextWords(context).includes(core))) {
    return 'too_common';
  }
  return null;
}

export function checkNewPassword(
  password: string,
  confirmation: string,
  context: PasswordContext = {},
): NewPasswordProblem | null {
  const problem = passwordProblem(password, context);
  if (problem) return problem;
  if (password !== confirmation) return 'mismatch';
  return null;
}
