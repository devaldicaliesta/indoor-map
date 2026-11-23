import type { OpeningHours, OpeningSpan } from '../hours.ts';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// `opens` = `closes` berarti buka 24 jam; `closes` < `opens` (lewat tengah malam) sudah sah di
// sintaks OSM apa adanya.
const span = ({ opens, closes }: OpeningSpan) =>
  opens === closes ? '00:00-24:00' : `${opens}-${closes}`;

const spans = (list: readonly OpeningSpan[]) => (list.length ? list.map(span).join(',') : 'off');

/**
 * Jam operasional dalam sintaks `opening_hours` OpenStreetMap yang dipakai IMDF: hari berurutan
 * dengan jadwal sama digabung (`Mo-Fr 08:00-16:00`), lalu tanggal khusus menimpa jadwal mingguan
 * (`2026 Dec 25 off`). `null` bila tidak ada jadwal sama sekali.
 */
export function toOsmHours(hours: OpeningHours | null): string | null {
  if (!hours) return null;
  const rules: string[] = [];
  for (let day = 0; day < DAYS.length; ) {
    const value = spans(hours.weekly[day] ?? []);
    let end = day;
    while (end + 1 < DAYS.length && spans(hours.weekly[end + 1] ?? []) === value) end++;
    if (value !== 'off') {
      rules.push(`${DAYS[day]}${end > day ? `-${DAYS[end]}` : ''} ${value}`);
    }
    day = end + 1;
  }
  for (const date of Object.keys(hours.special).sort()) {
    const [year, month, dayOfMonth] = date.split('-');
    rules.push(
      `${year} ${MONTHS[Number(month) - 1]} ${dayOfMonth} ${spans(hours.special[date] ?? [])}`,
    );
  }
  return rules.length ? rules.join('; ') : null;
}
