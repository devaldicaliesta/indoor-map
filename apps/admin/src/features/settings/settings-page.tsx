import { EmptyState, Tabs, TabsContent, TabsList, TabsTrigger } from '@indoor/ui';
import { Can } from '../../app/auth/can';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { AuditLog } from './audit-log';
import { SystemSettingsForm } from './system-settings-form';

export function SettingsPage() {
  return (
    <ModuleRoute module="settings">
      {(access) => (
        <ModulePage module="settings" access={access}>
          <Can
            action="settings.system"
            fallback={
              <EmptyState
                title="Tampilan dan instruksi"
                description="Atur tinggi 3D, warna, branding, dan teks instruksi rute untuk venue ini."
              />
            }
          >
            <Tabs defaultValue="system">
              <TabsList>
                <TabsTrigger value="system">Sistem</TabsTrigger>
                <TabsTrigger value="display">Tampilan</TabsTrigger>
                <TabsTrigger value="audit">Catatan</TabsTrigger>
              </TabsList>
              <TabsContent value="system">
                <SystemSettingsForm />
              </TabsContent>
              <TabsContent value="display">
                <EmptyState
                  title="Tampilan dan instruksi"
                  description="Atur tinggi 3D, warna, branding, dan teks instruksi rute untuk venue ini."
                />
              </TabsContent>
              <TabsContent value="audit">
                <AuditLog />
              </TabsContent>
            </Tabs>
          </Can>
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
