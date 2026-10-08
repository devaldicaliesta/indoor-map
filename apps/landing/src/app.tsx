import { useEffect } from 'react';
import { SiteFooter, SiteHeader } from './chrome';
import { useDocumentMeta, useLanguage } from './language';
import { Contact } from './sections/contact';
import { Buildings, Features, Hero, HowItWorks, Licensing, Screens } from './sections/content';
import { Demo } from './sections/demo';

export function LandingPage() {
  const { copy } = useLanguage();
  useDocumentMeta(copy.meta.title, copy.meta.description);
  // Tautan berjangkar (mis. /#kontak) dibuka sebelum isi dirender React; gulir setelah tampil.
  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (target) document.getElementById(target)?.scrollIntoView();
  }, []);
  return (
    <>
      <SiteHeader />
      <main id="isi">
        <Hero />
        <Buildings />
        <Features />
        <Demo />
        <HowItWorks />
        <Licensing />
        <Screens />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
