import { Button, Skeleton } from '@indoor/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { data } from '../../app/data-client';
import { AuthLayout, FormNotice } from '../auth/auth-layout';
import { NOTIFICATION_LABELS } from './labels';

/**
 * Tautan berhenti berlangganan di email, tanpa login. Langganan baru dimatikan setelah tombol
 * diklik, agar pemindai tautan di server email tidak mematikannya sendiri.
 */
export function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const kind = useQuery({
    queryKey: ['unsubscribe', token],
    queryFn: () => data.notifications.unsubscribe(token, false),
    enabled: token !== '',
    retry: false,
  });
  const apply = useMutation({ mutationFn: () => data.notifications.unsubscribe(token, true) });
  const label = kind.data ? NOTIFICATION_LABELS[kind.data].label : null;
  const settingsLink = (
    <Link to="/login" className="text-ink underline underline-offset-4">
      Masuk ke Admin untuk mengatur email lain
    </Link>
  );

  if (token === '' || kind.data === null) {
    return (
      <AuthLayout
        title="Tautan tidak berlaku"
        description="Tautan berhenti berlangganan ini tidak dikenali. Atur email lewat menu akun → Notifikasi email."
      >
        {settingsLink}
      </AuthLayout>
    );
  }
  if (apply.isSuccess) {
    return (
      <AuthLayout
        title="Langganan dihentikan"
        description={`Anda tidak lagi menerima email "${label}". Nyalakan lagi kapan saja lewat menu akun → Notifikasi email.`}
      >
        {settingsLink}
      </AuthLayout>
    );
  }
  return (
    <AuthLayout
      title="Berhenti menerima email?"
      description={
        label
          ? `Anda akan berhenti menerima email "${label}" dari Admin PanduArah. Email jenis lain tetap dikirim.`
          : 'Memeriksa tautan…'
      }
    >
      {kind.isPending ? <Skeleton className="h-9" /> : null}
      {kind.error ? <FormNotice tone="error">{kind.error.message}</FormNotice> : null}
      {apply.error ? <FormNotice tone="error">{apply.error.message}</FormNotice> : null}
      {label ? (
        <Button variant="primary" disabled={apply.isPending} onClick={() => apply.mutate()}>
          {apply.isPending ? 'Menyimpan…' : 'Berhenti berlangganan'}
        </Button>
      ) : null}
      {settingsLink}
    </AuthLayout>
  );
}
