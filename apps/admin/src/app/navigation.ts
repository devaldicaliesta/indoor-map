import type { AdminModule, AppRole, PaidFeature } from '@indoor/domain';
import {
  ActivityIcon,
  BarChart3Icon,
  BuildingIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  MapIcon,
  MapPinIcon,
  MegaphoneIcon,
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
  feature?: PaidFeature;
  readOnlyByDesign?: boolean;
}

// Urutan dan nama menu sesuai docs/spec/05-user-flow.md "Struktur menu Admin".
export const MODULE_NAV: Record<AdminModule, ModuleNav> = {
  dashboard: {
    path: '/dashboard',
    label: 'Dasbor',
    icon: LayoutDashboardIcon,
    readOnlyByDesign: true,
  },
  venues: { path: '/venues', label: 'Venue', icon: BuildingIcon },
  map_editor: { path: '/map-editor', label: 'Editor Peta', icon: MapIcon },
  locations: { path: '/locations', label: 'Lokasi', icon: MapPinIcon },
  media: { path: '/media', label: 'Media', icon: ImagesIcon },
  closures: { path: '/closures', label: 'Penutupan', icon: OctagonXIcon },
  events: { path: '/events', label: 'Event & Promo', icon: MegaphoneIcon, feature: 'events' },
  origin_points: { path: '/origin-points', label: 'Titik Asal', icon: QrCodeIcon },
  publish: { path: '/publish', label: 'Publish', icon: SendIcon },
  analytics: { path: '/analytics', label: 'Analitik', icon: BarChart3Icon },
  settings: { path: '/settings', label: 'Pengaturan', icon: SettingsIcon },
  users: { path: '/users', label: 'Pengguna', icon: UsersIcon },
  license: { path: '/license', label: 'Lisensi', icon: ShieldCheckIcon },
  system_health: { path: '/system-health', label: 'Kesehatan sistem', icon: ActivityIcon },
};

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  operator: 'Operator',
  viewer: 'Viewer',
};
