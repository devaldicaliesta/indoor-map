import { DataError } from '@indoor/data';
import { Button, EmptyState } from '@indoor/ui';
import { isRouteErrorResponse, useRouteError } from 'react-router';

function describe(error: unknown): { title: string; description: string } {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return {
      title: 'Halaman tidak ditemukan',
      description: 'Periksa alamatnya atau pilih menu di kiri.',
    };
  }
  if (error instanceof DataError && error.kind === 'network') {
    return {
      title: 'Server tidak terjangkau',
      description: `${error.message} Jika masalah berlanjut, hubungi tim IT yang memasang server.`,
    };
  }
  if (error instanceof Error) {
    return { title: 'Terjadi kesalahan', description: error.message };
  }
  return { title: 'Terjadi kesalahan', description: 'Muat ulang halaman, lalu coba lagi.' };
}

export function RouteError({ error }: { error?: unknown }) {
  const routeError = useRouteError();
  const { title, description } = describe(error ?? routeError);
  return (
    <div className="p-6">
      <EmptyState
        title={title}
        description={description}
        action={<Button onClick={() => window.location.reload()}>Muat ulang</Button>}
      />
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="p-6">
      <EmptyState
        title="Halaman tidak ditemukan"
        description="Periksa alamatnya atau pilih menu di kiri."
      />
    </div>
  );
}
