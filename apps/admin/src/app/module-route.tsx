import {
  type AdminModule,
  type ModuleAccess,
  moduleAccessFor,
  visibleModulesFor,
} from '@indoor/domain';
import { Badge, EmptyState } from '@indoor/ui';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useCurrentProfile } from './auth/current-profile';
import { MODULE_NAV } from './navigation';
import { type AdminTour, AdminTourButton } from './tour';
import { useSelectedVenue } from './venue-store';

/** Menolak modul yang tidak boleh dibuka role ini; server tetap menegakkan lewat RLS. */
export function ModuleRoute({
  module,
  children,
}: {
  module: AdminModule;
  children: (access: ModuleAccess) => ReactNode;
}) {
  const profile = useCurrentProfile().data;
  const access = profile ? moduleAccessFor(profile, module) : null;
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

// Modul yang berlaku untuk seluruh instalasi, bukan per venue.
const INSTALLATION_MODULES: ReadonlySet<AdminModule> = new Set(['users', 'license']);

export function ModulePage({
  module,
  access,
  actions,
  tour,
  children,
}: {
  module: AdminModule;
  access: ModuleAccess;
  actions?: ReactNode;
  /** Tur halaman: mulai sendiri pertama kali, diulang lewat tombol "Tur halaman". */
  tour?: AdminTour;
  children: ReactNode;
}) {
  const { venue } = useSelectedVenue();
  return (
    <div className="grid gap-4 p-(--panel-padding)">
      <div className="flex items-baseline gap-3">
        <h1 className="font-bold text-xl">{MODULE_NAV[module].label}</h1>
        {venue && !INSTALLATION_MODULES.has(module) ? (
          <span className="text-ink-muted">{venue.name}</span>
        ) : null}
        {access === 'read' ? <Badge>Mode baca</Badge> : null}
        {actions || tour ? (
          <div className="ml-auto flex gap-2">
            {tour ? <AdminTourButton tour={tour} /> : null}
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Beranda: menu pertama yang boleh diubah role ini (Operator → Penutupan), atau dibaca. */
export function HomeRedirect() {
  const profile = useCurrentProfile().data;
  const modules = profile ? visibleModulesFor(profile) : [];
  const target = modules.find((m) => m.access === 'edit') ?? modules[0];
  return <Navigate to={target ? MODULE_NAV[target.module].path : '/login'} replace />;
}
