import { can } from '@indoor/domain';
import { EmptyState, Tabs, TabsContent, TabsList, TabsTrigger } from '@indoor/ui';
import { useRole } from '../../app/auth/can';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { FacilityTypesPanel } from '../facilities/facility-types-panel';
import { AuditLog } from './audit-log';
import { DisplaySettingsPanel } from './display/display-settings';
import { SystemSettingsForm } from './system-settings-form';

export function SettingsPage() {
  const role = useRole();
  const { venue } = useSelectedVenue();
  // Sistem dan Catatan berlaku untuk seluruh instalasi; hanya Super Admin (T-010, T-012).
  const system = role !== null && can(role, 'settings.system');
  return (
    <ModuleRoute module="settings">
      {(access) => (
        <ModulePage module="settings" access={access}>
          <Tabs defaultValue="facility-types">
            <TabsList>
              <TabsTrigger value="facility-types">Jenis fasilitas</TabsTrigger>
              <TabsTrigger value="display">Tampilan</TabsTrigger>
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
