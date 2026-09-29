import { createBrowserRouter, type RouteObject } from 'react-router';
import { RequireAuth } from './app/auth/require-auth';
import { HomeRedirect } from './app/module-route';
import { NotFoundPage, RouteError } from './app/route-error';
import { ForgotPasswordPage } from './features/auth/forgot-password-page';
import { LoginPage } from './features/auth/login-page';
import { ResetPasswordPage } from './features/auth/reset-password-page';
import { ClosuresPage } from './features/closures/closures-page';
import { LicensePage } from './features/license/license-page';
import { LocationsPage } from './features/locations/locations-page';
import { MapEditorPage } from './features/map-editor/map-editor-page';
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
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    path: '/',
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'venues', element: <VenuesPage /> },
      { path: 'map-editor', element: <MapEditorPage /> },
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
