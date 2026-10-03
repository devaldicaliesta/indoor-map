import {
  allows3d,
  PREVIEW_READY,
  PREVIEW_SNAPSHOT,
  type Snapshot,
  type SnapshotDisplayMode,
  type VenueId,
  withPreviewMode,
} from '@indoor/domain';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@indoor/ui';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

type Device = 'phone' | 'info_point';

// Ukuran layar asli; Info Point diskalakan agar muat di halaman Admin.
const FRAMES: Record<Device, { width: number; height: number; scale: number }> = {
  phone: { width: 390, height: 844, scale: 0.75 },
  info_point: { width: 1080, height: 1920, scale: 0.33 },
};

/** Path Visitor `/preview`, dimulai dari posisi Info Point bila dipilih. */
function previewPath(venueId: VenueId, infoPoint: Snapshot['infoPoints'][number] | undefined) {
  const params = new URLSearchParams({ v: venueId });
  if (infoPoint) {
    params.set('f', infoPoint.floorId);
    params.set('ip', infoPoint.code);
  }
  return `/preview?${params}`;
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="grid gap-1">
      <legend className="mb-1 font-bold text-sm">{label}</legend>
      <div className="flex gap-2">
        {options.map((o) => (
          <Button
            key={o.value}
            aria-pressed={value === o.value}
            variant={value === o.value ? 'primary' : undefined}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Visitor di dalam iframe dengan snapshot draft yang dibangun server di memori. Snapshot
 * dikirim lewat `postMessage` setelah Visitor siap, sehingga tidak pernah ditulis ke Storage.
 */
export function Preview({
  venueId,
  visitorUrl,
  snapshot,
  pending,
  error,
  onLoad,
}: {
  venueId: VenueId;
  /** URL publik Visitor dari Pengaturan Sistem; `null` bila belum diisi. */
  visitorUrl: string | null;
  snapshot: Snapshot | undefined;
  pending: boolean;
  error: string | null;
  onLoad: () => void;
}) {
  const [device, setDevice] = useState<Device>('phone');
  const [mode, setMode] = useState<SnapshotDisplayMode>('2d');
  const [infoPointId, setInfoPointId] = useState<string | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  const infoPoints = snapshot?.infoPoints ?? [];
  const infoPoint =
    device === 'info_point'
      ? (infoPoints.find((p) => p.id === infoPointId) ?? infoPoints[0])
      : undefined;
  const origin = visitorUrl ? new URL(visitorUrl).origin : null;

  useEffect(() => {
    if (!snapshot || !origin) return;
    const draft = withPreviewMode(snapshot, mode);
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== origin) return;
      if ((event.data as { type?: unknown } | null)?.type !== PREVIEW_READY) return;
      frame.current?.contentWindow?.postMessage(
        { type: PREVIEW_SNAPSHOT, snapshot: draft },
        origin,
      );
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [snapshot, mode, origin]);

  const size = FRAMES[device];
  return (
    <section
      aria-labelledby="preview-title"
      className="grid gap-4 rounded-md border border-line bg-surface p-(--panel-padding)"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="preview-title" className="font-bold">
          Preview draft
        </h2>
        <Button onClick={onLoad} disabled={pending || !visitorUrl}>
          {pending ? 'Menyiapkan…' : snapshot ? 'Muat ulang draft' : 'Buka preview'}
        </Button>
      </div>
      {!visitorUrl ? (
        <p className="text-ink-muted">
          Isi URL publik Visitor di{' '}
          <Link to="/settings?tab=system" className="font-bold underline">
            Pengaturan Sistem
          </Link>{' '}
          agar preview bisa dibuka.
        </p>
      ) : null}
      {error ? <p className="text-danger">{error}</p> : null}
      {snapshot && visitorUrl ? (
        <>
          <div className="flex flex-wrap items-end gap-6">
            <Choice
              label="Tampilan"
              value={device}
              options={[
                { value: 'phone', label: 'HP' },
                { value: 'info_point', label: 'Info Point' },
              ]}
              onChange={setDevice}
            />
            {/* Snapshot pratinjau sudah mengikuti paket: tanpa fitur 3D pilihan mode tidak ada. */}
            {allows3d(snapshot) ? (
              <Choice
                label="Mode"
                value={mode}
                options={[
                  { value: '2d', label: '2D' },
                  { value: '3d', label: '3D' },
                ]}
                onChange={setMode}
              />
            ) : null}
            {device === 'info_point' && infoPoints.length > 0 ? (
              <div className="grid gap-1">
                <Label htmlFor="preview-info-point">Posisi Info Point</Label>
                <Select value={infoPoint?.id ?? ''} onValueChange={setInfoPointId}>
                  <SelectTrigger id="preview-info-point" className="min-w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {infoPoints.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          {device === 'info_point' && infoPoints.length === 0 ? (
            <p className="text-ink-muted">
              Venue ini belum punya Info Point; layar Info Point dimulai dari tampilan awal venue.
            </p>
          ) : null}
          <div
            className="overflow-hidden rounded-md border border-line bg-canvas"
            style={{ width: size.width * size.scale, height: size.height * size.scale }}
          >
            <iframe
              // Iframe dimuat ulang per pilihan agar kamera awal mengikuti mode dan posisi baru.
              key={`${device}-${mode}-${infoPoint?.id ?? ''}-${snapshot.publishedAt}`}
              ref={frame}
              title={`Preview ${device === 'phone' ? 'HP' : 'Info Point'} ${mode.toUpperCase()}`}
              src={`${visitorUrl.replace(/\/+$/, '')}${previewPath(venueId, infoPoint)}`}
              width={size.width}
              height={size.height}
              style={{ transform: `scale(${size.scale})`, transformOrigin: 'top left' }}
              className="border-0"
            />
          </div>
        </>
      ) : null}
    </section>
  );
}
