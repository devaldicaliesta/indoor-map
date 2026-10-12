import { Button } from '@indoor/ui';
import { useEffect, useState } from 'react';
import { home, SiteFooter, SiteHeader } from '../chrome';
import { useDocumentMeta, useLanguage } from '../language';
import { retryVerify, type VerifyResult, verifyTrial } from './api';
import { TRIAL_COPY } from './copy';

let taken: string | null = null;

/**
 * Token dari `?token=`, lalu dihapus dari alamat agar tidak terbawa ke riwayat atau tangkapan
 * layar. Disimpan sekali per muat halaman: React StrictMode memanggil inisialisasi dua kali.
 */
function takeToken(): string {
  if (taken !== null) return taken;
  const params = new URLSearchParams(window.location.search);
  taken = params.get('token') ?? '';
  if (taken) {
    params.delete('token');
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }
  return taken;
}

/** Halaman tujuan tautan di email verifikasi (FR-HT-01/02): membuat ruang kerja trial. */
export function TrialVerifyPage() {
  const { language, copy } = useLanguage();
  const text = TRIAL_COPY[language].verify;
  useDocumentMeta(`${text.title} — PanduArah`, copy.meta.description);
  const [token] = useState(takeToken);
  const [result, setResult] = useState<VerifyResult | null>(token ? null : { outcome: 'invalid' });

  useEffect(() => {
    if (token) void verifyTrial(token).then(setResult);
  }, [token]);

  function retry() {
    setResult(null);
    void retryVerify(token).then(setResult);
  }

  const form = home(language, '#trial');
  const view = (() => {
    if (!result) return { title: text.checking, body: null };
    switch (result.outcome) {
      case 'active':
        return { title: text.active, body: text.activeBody };
      case 'queued':
        return { title: text.queued, body: text.queuedBody };
      case 'rejected':
        return { title: text.rejected, body: text.rejectedBody };
      case 'expired':
        return { title: text.expired, body: text.expiredBody };
      case 'invalid':
        return { title: text.invalid, body: text.invalidBody };
      default:
        return { title: text.failed, body: text.failedBody };
    }
  })();

  return (
    <>
      <SiteHeader sections={false} />
      <main id="isi" className="bg-surface">
        <article
          className="mx-auto grid max-w-2xl gap-6 px-4 py-16"
          aria-busy={result ? undefined : true}
        >
          {/* Hasil dibacakan pembaca layar saat berganti dari "memeriksa"; judul tetap heading. */}
          <div role="status" className="grid gap-6">
            <h1 className="font-bold text-4xl leading-tight">{view.title}</h1>
            {view.body ? <p className="text-lg">{view.body}</p> : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {result?.outcome === 'active' ? (
              <>
                <Button asChild variant="primary">
                  <a href={result.adminUrl}>{text.admin}</a>
                </Button>
                <Button asChild>
                  <a href={result.visitorUrl}>{text.visitor}</a>
                </Button>
              </>
            ) : null}
            {result?.outcome === 'expired' || result?.outcome === 'invalid' ? (
              <Button asChild variant="primary">
                <a href={form}>{text.again}</a>
              </Button>
            ) : null}
            {result?.outcome === 'failed' ? (
              <Button type="button" variant="primary" onClick={retry}>
                {text.retry}
              </Button>
            ) : null}
            {result ? (
              <a href={home(language)} className="self-center font-bold underline">
                {text.home}
              </a>
            ) : null}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
