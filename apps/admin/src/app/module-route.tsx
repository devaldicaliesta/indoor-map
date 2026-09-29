import { type AdminModule, type ModuleAccess, moduleAccess, visibleModules } from '@indoor/domain';
import { Badge, EmptyState } from '@indoor/ui';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useCurrentProfile } from './auth/current-profile';
import { MODULE_NAV } from './navigation';
import { useSelectedVenue } from './venue-store';

/** Menolak modul yang tidak boleh dibuka role ini; server tetap menegakkan lewat RLS. */
export function ModuleRoute({
  module,
  children,
}: {
  module: AdminModule;
  children: (access: ModuleAccess) => ReactNode;
}) {
  const role = useCurrentProfile().data?.role;
  const access = role ? moduleAccess(role, module) : null;
  if (!access) {
    return (
      <div className="p-6">
        <EmptyState
          title="Tidak punya akses"
          description={`Menu ${MODULE_NAV[module].label} tidak tersedia untuk role Anda. Hubungi Super Admin jika Anda membutuhkannya.`}
        />
      </div>
    );
  }
  return children(access);
}

export function ModulePage({
  module,
  access,
  children,
}: {
  module: AdminModule;
  access: ModuleAccess;
  children: ReactNode;
}) {
  const { venue } = useSelectedVenue();
  return (
    <div className="grid gap-4 p-(--panel-padding)">
      <div className="flex items-baseline gap-3">
        <h1 className="font-bold text-xl">{MODULE_NAV[module].label}</h1>
        {venue ? <span className="text-ink-muted">{venue.name}</span> : null}
        {access === 'read' ? <Badge>Mode baca</Badge> : null}
      </div>
      {children}
    </div>
  );
}

/** Beranda: menu pertama yang boleh diubah role ini (Operator → Penutupan), atau dibaca. */
export function HomeRedirect() {
  const role = useCurrentProfile().data?.role;
  const modules = role ? visibleModules(role) : [];
  const target = modules.find((m) => m.access === 'edit') ?? modules[0];
  return <Navigate to={target ? MODULE_NAV[target.module].path : '/login'} replace />;
}
