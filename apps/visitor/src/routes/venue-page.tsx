import { useParams } from 'react-router';

// Placeholder; peta venue dibuat di T-118.
export function VenuePage() {
  const { venueId } = useParams();
  return <h1 data-venue-id={venueId}>Venue {venueId}</h1>;
}
