/** Tanggal dan jam dalam zona waktu venue, dengan singkatan zonanya (mis. "WIB"). */
export function inVenueTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short',
  }).format(new Date(iso));
}
