import { HEALTH_THRESHOLDS, type HealthAlert } from '@indoor/domain';

export const dateTime = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
export const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' });

const text = (value: unknown, fallback: string) =>
  typeof value === 'string' && value ? value : fallback;

const sentence = (value: string) => (/[.!?]$/.test(value) ? value : `${value}.`);

/** Kalimat peringatan dari rincian database (sama dengan isi email). */
export function alertText({ kind, details }: HealthAlert): string {
  switch (kind) {
    case 'backup_failed':
      return `Backup gagal ${HEALTH_THRESHOLDS.backupFailures} kali berturut-turut. Pesan terakhir: ${sentence(text(details.message, 'tanpa keterangan'))}`;
    case 'disk_high':
      return `Disk ${text(details.path, 'server')} terpakai ${Number(details.percent) || 0}% (batas ${HEALTH_THRESHOLDS.diskPercent}%).`;
    case 'cert_expiring': {
      const days = Number(details.days_left);
      return `Sertifikat HTTPS ${text(details.domain, 'server')} ${days > 0 ? `berakhir dalam ${days} hari` : 'sudah atau hampir berakhir'}.`;
    }
  }
}

const SERVICE_STATES: Record<string, string> = {
  running: 'berjalan',
  exited: 'berhenti',
  restarting: 'terus memulai ulang',
  paused: 'dijeda',
  created: 'belum dijalankan',
  dead: 'mati',
};

export function serviceStateText(state: string, health: string): string {
  if (state === 'running' && health === 'unhealthy') return 'berjalan, tidak sehat';
  if (state === 'running' && health === 'starting') return 'sedang memulai';
  return SERVICE_STATES[state] ?? state;
}
