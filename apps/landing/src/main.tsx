import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { LandingPage } from './app';
import { LanguageProvider } from './language';
import { PrivacyPage } from './privacy';
import { TrialVerifyPage } from './trial/verify-page';

const root = document.getElementById('root');
if (!root) throw new Error('Elemen #root tidak ada.');
// Halaman HTML (beranda, /privasi/, /trial/verifikasi/) memakai bundel yang sama.
const PAGES = { privacy: PrivacyPage, 'trial-verify': TrialVerifyPage } as const;
const Page = PAGES[document.body.dataset.page as keyof typeof PAGES] ?? LandingPage;
createRoot(root).render(
  <StrictMode>
    <LanguageProvider>
      <Page />
    </LanguageProvider>
  </StrictMode>,
);
