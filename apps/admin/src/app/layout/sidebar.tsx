import { type AppRole, visibleModules } from '@indoor/domain';
import { BrandLogo, BrandSymbol, cn, Tooltip, TooltipContent, TooltipTrigger } from '@indoor/ui';
import { EyeIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { NavLink, useMatch } from 'react-router';
import { MODULE_NAV } from '../navigation';
import { useSidebar } from './sidebar-store';

/** Saat diciutkan, nama menu tetap dibacakan pembaca layar dan muncul sebagai tooltip. */
function WithTooltip({
  show,
  label,
  children,
}: {
  show: boolean;
  label: string;
  children: ReactElement;
}) {
  if (!show) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Status aktif dihitung di sini, bukan lewat `className` fungsi NavLink: pembungkus tooltip
 * (Radix Slot) hanya bisa menggabungkan `className` berupa string.
 */
function NavItem({
  path,
  collapsed,
  children,
  ...props
}: { path: string; collapsed: boolean; children: ReactNode } & Omit<
  ComponentProps<typeof NavLink>,
  'to' | 'className' | 'children'
>) {
  const active = useMatch({ path, end: false }) !== null;
  return (
    <NavLink
      to={path}
      {...props}
      className={cn(
        'flex h-9 items-center gap-3 rounded-sm text-ink hover:bg-canvas',
        collapsed ? 'justify-center' : 'px-3',
        active && 'bg-signal-soft font-bold hover:bg-signal-soft',
      )}
    >
      {children}
    </NavLink>
  );
}

export function Sidebar({ role }: { role: AppRole }) {
  const collapsed = useSidebar((s) => s.collapsed);
  const toggle = useSidebar((s) => s.toggle);
  const ToggleIcon = collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon;
  const toggleLabel = collapsed ? 'Lebarkan menu' : 'Ciutkan menu';

  return (
    <aside
      data-collapsed={collapsed}
      className="row-span-2 flex min-w-0 flex-col overflow-hidden border-line border-r bg-surface"
    >
      <div
        className={cn(
          'flex h-14 shrink-0 items-center gap-2 border-line border-b',
          collapsed ? 'justify-center' : 'px-4',
        )}
      >
        {collapsed ? (
          <BrandSymbol label="PanduArah Admin" className="h-8" />
        ) : (
          <>
            <BrandLogo className="h-9" />
            <span className="pt-1 text-ink-muted text-xs">Admin</span>
          </>
        )}
      </div>
      <nav aria-label="Menu utama" className="flex flex-1 flex-col gap-0.5 p-2">
        {visibleModules(role).map(({ module, access }) => {
          const { path, label, icon: Icon } = MODULE_NAV[module];
          const readOnly = access === 'read';
          return (
            <WithTooltip key={module} show={collapsed} label={readOnly ? `${label} (baca)` : label}>
              <NavItem path={path} collapsed={collapsed}>
                <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className={collapsed ? 'sr-only' : 'flex-1 truncate'}>{label}</span>
                {readOnly ? (
                  <span
                    className={cn(
                      'flex items-center gap-1 text-ink-muted text-xs',
                      collapsed && 'sr-only',
                    )}
                  >
                    <EyeIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                    baca
                  </span>
                ) : null}
              </NavItem>
            </WithTooltip>
          );
        })}
      </nav>
      <div className="border-line border-t p-2">
        <WithTooltip show={collapsed} label={toggleLabel}>
          <button
            type="button"
            onClick={toggle}
            aria-label={toggleLabel}
            aria-expanded={!collapsed}
            className={cn(
              'flex h-9 w-full cursor-pointer items-center gap-3 rounded-sm text-ink-muted hover:bg-canvas hover:text-ink',
              collapsed ? 'justify-center' : 'px-3',
            )}
          >
            <ToggleIcon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {collapsed ? null : <span className="text-sm">Ciutkan</span>}
          </button>
        </WithTooltip>
      </div>
    </aside>
  );
}
