import { createBrowserRouter, type RouteObject } from 'react-router';
import { HomePage } from './routes/home-page';
import { InfoPointPage } from './routes/info-point-page';
import { VenuePage } from './routes/venue-page';

// Pratinjau peta dengan fixture hanya ada saat pengembangan.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/_map',
        lazy: async () => ({ Component: (await import('./dev/map-preview-page')).MapPreviewPage }),
      },
    ]
  : [];

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/v/:venueId', element: <VenuePage /> },
  { path: '/ip/:code', element: <InfoPointPage /> },
  ...devRoutes,
]);
