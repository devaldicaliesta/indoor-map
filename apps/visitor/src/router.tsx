import { createBrowserRouter } from 'react-router';
import { HomePage } from './routes/home-page';
import { InfoPointPage } from './routes/info-point-page';
import { VenuePage } from './routes/venue-page';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/v/:venueId', element: <VenuePage /> },
  { path: '/ip/:code', element: <InfoPointPage /> },
]);
