import { isOpenAt, type OpeningHours, type OpenState } from '@indoor/domain';
import { StatusDot } from '@indoor/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useExplore } from '../search/explore-context';

/** Menit sekarang, diperbarui tiap menit agar label buka/tutup berganti tanpa muat ulang. */
function useMinute(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** "08.00" (ID) atau "08:00" (EN) dari "08:00". */
const clock = (time: string, language: string | undefined) =>
  language === 'en' ? time : time.replace(':', '.');

/** Hari pembukaan berikutnya dalam zona waktu venue (Senin = 0). */
function weekdayIn(timezone: string, now: Date, daysAhead: number): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(
    now,
  );
  const today = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(name);
  return (today + daysAhead) % 7;
}

/**
 * "Buka · tutup 16.00" atau "Tutup · buka 08.00" menurut jam operasional dan zona waktu venue
 * (bukan zona waktu perangkat pengunjung).
 */
export function OpenStatus({
  hours,
  className,
}: {
  hours: OpeningHours;
  className?: string | undefined;
}) {
  const { t, i18n } = useTranslation();
  const { snapshot } = useExplore();
  const now = useMinute();
  const timezone = snapshot.venue.timezone;
  const state: OpenState = isOpenAt(hours, timezone, now);
  const language = i18n.resolvedLanguage;
  if (state.open) {
    return (
      <StatusDot tone="ok" className={className}>
        {state.closesAt
          ? t('hours.openUntil', { time: clock(state.closesAt, language) })
          : t('hours.open24')}
      </StatusDot>
    );
  }
  const next = state.opensAt;
  let text = t('hours.closed');
  if (next?.daysAhead === 0) {
    text = t('hours.closedOpensToday', { time: clock(next.time, language) });
  } else if (next?.daysAhead === 1) {
    text = t('hours.closedOpensTomorrow', { time: clock(next.time, language) });
  } else if (next) {
    const day = t(`hours.day.${DAY_KEYS[weekdayIn(timezone, now, next.daysAhead)] ?? 'mon'}`);
    text = t('hours.closedOpensOn', { day, time: clock(next.time, language) });
  }
  return (
    <StatusDot tone="danger" hollow className={className}>
      {text}
    </StatusDot>
  );
}
