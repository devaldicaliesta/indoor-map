import { type AppRole, visibleModules } from '@indoor/domain';
import { cn } from '@indoor/ui';
import { EyeIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import { MODULE_NAV } from '../navigation';

export function Sidebar({ role }: { role: AppRole }) {
  return (
    <aside className="row-span-2 flex flex-col border-line border-r bg-surface">
      <div className="flex h-14 items-center gap-2 border-line border-b px-4">
        <span aria-hidden="true" className="size-4 rounded-sm bg-signal ring-1 ring-ink" />
        <span className="font-bold">Indoor Map</span>
        <span className="text-ink-muted text-xs">Admin</span>
      </div>
      <nav aria-label="Menu utama" className="flex flex-col gap-0.5 p-2">
        {visibleModules(role).map(({ module, access }) => {
          const { path, label, icon: Icon } = MODULE_NAV[module];
          return (
            <NavLink
              key={module}
              to={path}
              className={({ isActive }) =>
                cn(
                  'flex h-9 items-center gap-3 rounded-sm px-3 text-ink hover:bg-canvas',
                  isActive && 'bg-signal-soft font-bold hover:bg-signal-soft',
                )
              }
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {access === 'read' ? (
                <span className="flex items-center gap-1 text-ink-muted text-xs">
                  <EyeIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                  baca
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
