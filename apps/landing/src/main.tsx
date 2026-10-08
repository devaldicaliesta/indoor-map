import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { LandingPage } from './app';
import { LanguageProvider } from './language';
import { PrivacyPage } from './privacy';

const root = document.getElementById('root');
if (!root) throw new Error('Elemen #root tidak ada.');
// Dua halaman HTML (beranda dan /privasi/) memakai bundel yang sama.
const Page = document.body.dataset.page === 'privacy' ? PrivacyPage : LandingPage;
createRoot(root).render(
  <StrictMode>
    <LanguageProvider>
      <Page />
    </LanguageProvider>
  </StrictMode>,
);
