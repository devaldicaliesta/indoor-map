import { useEffect } from 'react';
import { SiteFooter, SiteHeader } from './chrome';
import { useDocumentMeta, useLanguage } from './language';
import { Buildings, Features, Hero, HowItWorks, Licensing, Screens } from './sections/content';
import { Demo } from './sections/demo';
import { TrialForm } from './sections/trial-form';

export function LandingPage() {
  const { copy } = useLanguage();
  useDocumentMeta(copy.meta.title, copy.meta.description);
  // Tautan berjangkar (mis. /#trial) dibuka sebelum isi dirender React; gulir setelah tampil.
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
        <TrialForm />
      </main>
      <SiteFooter />
    </>
  );
}
