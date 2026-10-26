import { EmptyState, Tabs, TabsContent, TabsList, TabsTrigger } from '@indoor/ui';
import { useSearchParams } from 'react-router';
import { useCan } from '../../app/auth/can';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { FacilityTypesPanel } from '../facilities/facility-types-panel';
import { AuditLog } from './audit-log';
import { BrandingPanel } from './branding/branding-settings';
import { DisplaySettingsPanel } from './display/display-settings';
import { InstructionsPanel } from './instructions/instructions-panel';
import { SystemSettingsForm } from './system-settings-form';

export function SettingsPage() {
  const { venue } = useSelectedVenue();
  // Sistem dan Catatan berlaku untuk seluruh instalasi, jadi hanya untuk Super Admin.
  const system = useCan('settings.system');
  // Tab di URL agar tautan (misalnya dari temuan validasi publish) membuka tab yang tepat.
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'facility-types';
  return (
    <ModuleRoute module="settings">
      {(access) => (
        <ModulePage module="settings" access={access}>
          <Tabs value={tab} onValueChange={(value) => setParams({ tab: value }, { replace: true })}>
            <TabsList>
              <TabsTrigger value="facility-types">Jenis fasilitas</TabsTrigger>
              <TabsTrigger value="display">Tampilan</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="instructions">Instruksi</TabsTrigger>
              {system ? <TabsTrigger value="system">Sistem</TabsTrigger> : null}
              {system ? <TabsTrigger value="audit">Catatan</TabsTrigger> : null}
            </TabsList>
            <TabsContent value="facility-types">
              {venue ? (
                <FacilityTypesPanel venueId={venue.id} venueName={venue.name} />
              ) : (
                <EmptyState
                  title="Belum ada venue"
                  description="Buat venue di menu Venue untuk mengatur jenis fasilitasnya."
                />
              )}
            </TabsContent>
            <TabsContent value="display">
              {venue ? (
                <DisplaySettingsPanel venueId={venue.id} />
              ) : (
                <EmptyState
                  title="Belum ada venue"
                  description="Buat venue di menu Venue untuk mengatur tampilannya."
                />
              )}
            </TabsContent>
            <TabsContent value="branding">
              {venue ? (
                <BrandingPanel venueId={venue.id} />
              ) : (
                <EmptyState
                  title="Belum ada venue"
                  description="Buat venue di menu Venue untuk mengatur branding-nya."
                />
              )}
            </TabsContent>
            <TabsContent value="instructions">
              {venue ? (
                <InstructionsPanel venueId={venue.id} />
              ) : (
                <EmptyState
                  title="Belum ada venue"
                  description="Buat venue di menu Venue untuk mengatur teks instruksinya."
                />
              )}
            </TabsContent>
            {system ? (
              <TabsContent value="system">
                <SystemSettingsForm />
              </TabsContent>
            ) : null}
            {system ? (
              <TabsContent value="audit">
                <AuditLog />
              </TabsContent>
            ) : null}
          </Tabs>
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
