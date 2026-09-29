import { createBrowserRouter } from 'react-router';
import { HomePage } from './routes/home-page';
import { LoginPage } from './routes/login-page';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/', element: <HomePage /> },
]);
