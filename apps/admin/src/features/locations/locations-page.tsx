import type { VenueId } from '@indoor/domain';
import { EmptyState, Tabs, TabsContent, TabsList, TabsTrigger } from '@indoor/ui';
import { useSearchParams } from 'react-router';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { LocationTypesPanel } from '../location-types/location-types-panel';
import { LocationsPanel } from './locations-panel';

function LocationsModule({ venueId }: { venueId: VenueId }) {
  const [params, setParams] = useSearchParams();
  // `categories` dari tautan lama (sebelum T-303) membuka tab yang kini memuat kategori.
  const requested = params.get('tab');
  const tab = requested === 'types' || requested === 'categories' ? 'types' : 'locations';
  return (
    <Tabs value={tab} onValueChange={(value) => setParams(value === 'types' ? { tab: value } : {})}>
      <TabsList>
        <TabsTrigger value="locations">Lokasi</TabsTrigger>
        <TabsTrigger value="types">Tipe lokasi</TabsTrigger>
      </TabsList>
      <TabsContent value="locations">
        <LocationsPanel venueId={venueId} />
      </TabsContent>
      <TabsContent value="types">
        <LocationTypesPanel venueId={venueId} />
      </TabsContent>
    </Tabs>
  );
}

export function LocationsPage() {
  const { venue } = useSelectedVenue();
  return (
    <ModuleRoute module="locations">
      {(access) => (
        <ModulePage module="locations" access={access}>
          {venue ? (
            <LocationsModule key={venue.id} venueId={venue.id} />
          ) : (
            <EmptyState
              title="Belum ada venue"
              description="Buat venue lebih dulu di menu Venue, lalu tambahkan lokasinya di sini."
            />
          )}
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
