import type { AdminModule } from '@indoor/domain';
import { EmptyState } from '@indoor/ui';
import { ModulePage, ModuleRoute } from './module-route';

/** Kerangka halaman modul sampai fiturnya dibangun di task masing-masing. */
export function PlaceholderPage({
  module,
  title,
  description,
}: {
  module: AdminModule;
  title: string;
  description: string;
}) {
  return (
    <ModuleRoute module={module}>
      {(access) => (
        <ModulePage module={module} access={access}>
          <EmptyState title={title} description={description} />
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
