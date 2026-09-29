import { createBrowserRouter, type RouteObject } from 'react-router';
import { HomePage } from './routes/home-page';
import { LoginPage } from './routes/login-page';

// Galeri komponen hanya ada saat pengembangan; tidak ikut build produksi.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/_ui',
        lazy: async () => ({ Component: (await import('./routes/ui-gallery')).UiGalleryPage }),
      },
    ]
  : [];

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <HomePage /> },
  ...devRoutes,
]);
