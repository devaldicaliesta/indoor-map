import { createBrowserRouter, type RouteObject } from 'react-router';
import { PreviewPage } from './preview/preview-page';
import { HomePage } from './routes/home-page';
import { InfoPointPage } from './routes/info-point-page';
import { NotFoundPage, RouteError } from './routes/route-error';
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
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/v/:venue', element: <VenuePage /> },
      { path: '/ip/:code', element: <InfoPointPage /> },
      { path: '/preview', element: <PreviewPage /> },
      ...devRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
