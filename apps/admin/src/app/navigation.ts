import type { AdminModule, AppRole } from '@indoor/domain';
import {
  BuildingIcon,
  type LucideIcon,
  MapIcon,
  MapPinIcon,
  OctagonXIcon,
  QrCodeIcon,
  SendIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
} from 'lucide-react';

export interface ModuleNav {
  path: string;
  label: string;
  icon: LucideIcon;
}

// Urutan dan nama menu sesuai docs/spec/05-user-flow.md "Struktur menu Admin".
export const MODULE_NAV: Record<AdminModule, ModuleNav> = {
  venues: { path: '/venues', label: 'Venue', icon: BuildingIcon },
  map_editor: { path: '/map-editor', label: 'Editor Peta', icon: MapIcon },
  locations: { path: '/locations', label: 'Lokasi', icon: MapPinIcon },
  closures: { path: '/closures', label: 'Penutupan', icon: OctagonXIcon },
  origin_points: { path: '/origin-points', label: 'Titik Asal', icon: QrCodeIcon },
  publish: { path: '/publish', label: 'Publish', icon: SendIcon },
  settings: { path: '/settings', label: 'Pengaturan', icon: SettingsIcon },
  users: { path: '/users', label: 'Pengguna', icon: UsersIcon },
  license: { path: '/license', label: 'Lisensi', icon: ShieldCheckIcon },
};

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  operator: 'Operator',
  viewer: 'Viewer',
};
