import { Button, Label, Skeleton } from '@indoor/ui';
import { ArrowUpRightIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Can } from '../../../app/auth/can';
import { LOCATION_STATUS_LABELS } from '../../locations/labels';
import { useUnitLocations } from '../../locations/queries';
import { saveQueue } from '../session-helpers';

/** Lokasi yang menempati unit ini, dengan tautan ke halaman Lokasi. */
export function UnitLocation({ featureId }: { featureId: string }) {
  const locations = useUnitLocations(featureId);
  const navigate = useNavigate();
  const list = locations.data ?? [];

  async function createForUnit() {
    // Unit baru harus sudah tersimpan agar bisa dipilih di formulir lokasi.
    await saveQueue().flush();
    navigate(`/locations?unit=${featureId}`);
  }

  return (
    <div className="grid gap-1">
      <Label>Lokasi</Label>
      {locations.isPending ? (
        <Skeleton className="h-6 w-40" />
      ) : list.length ? (
        <ul className="grid gap-1">
          {list.map((location) => (
            <li key={location.id} className="flex items-baseline gap-2">
              <Link
                to={`/locations?location=${location.id}`}
                className="inline-flex items-center gap-1 font-bold underline underline-offset-4"
              >
                {location.name}
                <ArrowUpRightIcon aria-hidden="true" className="size-4" strokeWidth={1.75} />
              </Link>
              {location.status === 'active' ? null : (
                <span className="text-ink-muted text-sm">
                  {LOCATION_STATUS_LABELS[location.status]}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-ink-muted text-sm">Belum ada lokasi di unit ini.</span>
          <Can action="location.edit">
            <Button size="sm" variant="ghost" onClick={() => void createForUnit()}>
              Buat lokasi
            </Button>
          </Can>
        </div>
      )}
    </div>
  );
}
