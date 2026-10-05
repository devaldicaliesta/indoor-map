import type { VenueId } from '@indoor/domain';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@indoor/ui';
import { useSelectedVenue } from '../venue-store';

export function VenuePicker() {
  const { venues, venue, setVenueId, isLoading } = useSelectedVenue();

  if (isLoading) return <Skeleton className="h-9 w-56" />;
  if (!venue) return <span className="text-ink-muted">Belum ada venue</span>;

  return (
    <Select value={venue.id} onValueChange={(id) => setVenueId(id as VenueId)}>
      <SelectTrigger
        aria-label="Venue aktif"
        title={venue.name}
        className="w-64 min-w-0 shrink font-bold"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {venues.map((v) => (
          <SelectItem key={v.id} value={v.id}>
            {v.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
