import { createBrowserRouter, type RouteObject } from 'react-router';
import { RequireAuth } from './app/auth/require-auth';
import { HomeRedirect } from './app/module-route';
import { NotFoundPage, RouteError } from './app/route-error';
import { ForgotPasswordPage } from './features/auth/forgot-password-page';
import { LoginPage } from './features/auth/login-page';
import { ResetPasswordPage } from './features/auth/reset-password-page';
import { ClosuresPage } from './features/closures/closures-page';
import { EditorPage } from './features/editor/editor-page';
import { GeoreferencePage } from './features/floor-plans/georeference';
import { ActivationPage } from './features/license/activation-page';
import { LicenseGate } from './features/license/license-gate';
import { LicensePage } from './features/license/license-page';
import { LocationsPage } from './features/locations/locations-page';
import { OriginPointsPage } from './features/origin-points/origin-points-page';
import { PublishPage } from './features/publish/publish-page';
import { SettingsPage } from './features/settings/settings-page';
import { UsersPage } from './features/users/users-page';
import { VenuesPage } from './features/venues/venues-page';

// Galeri komponen hanya ada saat pengembangan; tidak ikut build produksi.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/_ui',
        lazy: async () => ({ Component: (await import('./app/dev/ui-gallery')).UiGalleryPage }),
      },
      {
        path: '/_map',
        lazy: async () => ({ Component: (await import('./dev/map-preview-page')).MapPreviewPage }),
      },
    ]
  : [];

export const router = createBrowserRouter([
  // Tanpa lisensi berlaku semua halaman diarahkan ke /aktivasi; halaman masuk tetap terbuka
  // agar Super Admin bisa masuk untuk memasang lisensi baru (kecuali di instalasi baru).
  { path: '/aktivasi', element: <ActivationPage />, errorElement: <RouteError /> },
  {
    path: '/login',
    element: (
      <LicenseGate allowWithoutLicense>
        <LoginPage />
      </LicenseGate>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <LicenseGate allowWithoutLicense>
        <ForgotPasswordPage />
      </LicenseGate>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <LicenseGate allowWithoutLicense>
        <ResetPasswordPage />
      </LicenseGate>
    ),
  },
  {
    path: '/',
    element: (
      <LicenseGate>
        <RequireAuth />
      </LicenseGate>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'venues', element: <VenuesPage /> },
      { path: 'venues/floors/:floorId/plan', element: <GeoreferencePage /> },
      { path: 'map-editor', element: <EditorPage /> },
      { path: 'locations', element: <LocationsPage /> },
      { path: 'closures', element: <ClosuresPage /> },
      { path: 'origin-points', element: <OriginPointsPage /> },
      { path: 'publish', element: <PublishPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'license', element: <LicensePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  ...devRoutes,
]);
