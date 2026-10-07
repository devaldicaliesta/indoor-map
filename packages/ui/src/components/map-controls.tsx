import { LocateFixedIcon, MinusIcon, NavigationIcon, PlusIcon, UsersRoundIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

export interface MapControlLabels {
  zoomIn: string;
  zoomOut: string;
  resetNorth: string;
  viewMode: string;
  mode2d: string;
  mode3d: string;
  /** Wajib bila `onResetView` diisi. */
  resetView?: string;
  /** Wajib bila `onPeopleChange` diisi. */
  people?: string;
}

interface MapControlsProps extends Omit<ComponentProps<'div'>, 'children'> {
  labels: MapControlLabels;
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** Rotasi peta dalam derajat; ikon kompas diputar berlawanan agar tetap menunjuk utara. */
  bearing: number;
  onResetNorth: () => void;
  mode: '2d' | '3d';
  onModeChange: (mode: '2d' | '3d') => void;
  /** Disembunyikan bila fitur 3D tidak aktif di lisensi atau Info Point dipaksa 2D. */
  allow3d?: boolean;
  /** Kembali ke gedung, lantai, dan kamera awal (Visitor); tombol tidak tampil tanpa ini. */
  onResetView?: () => void;
  /** Ilustrasi orang di peta tampil (Visitor). */
  people?: boolean;
  /** Tombol tampil/sembunyikan orang mini; tombol tidak tampil tanpa ini. */
  onPeopleChange?: (visible: boolean) => void;
}

const button =
  'flex size-(--control-height) cursor-pointer items-center justify-center text-ink hover:bg-canvas [&_svg]:size-5';

/** Kontrol peta tipis: hanya memanggil callback; logika peta ada di @indoor/map-core. */
function MapControls({
  labels,
  onZoomIn,
  onZoomOut,
  bearing,
  onResetNorth,
  mode,
  onModeChange,
  allow3d = true,
  onResetView,
  people = false,
  onPeopleChange,
  className,
  ...props
}: MapControlsProps) {
  return (
    <div
      data-slot="map-controls"
      className={cn('flex flex-col items-end gap-2', className)}
      {...props}
    >
      {allow3d ? (
        <fieldset
          aria-label={labels.viewMode}
          className="m-0 flex min-w-0 overflow-hidden rounded-sm border border-line bg-surface p-0 shadow-float"
        >
          {(['2d', '3d'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => onModeChange(value)}
              className={cn(
                'h-(--control-height) min-w-(--control-height) cursor-pointer px-2 font-bold',
                mode === value ? 'bg-ink text-surface' : 'text-ink-muted hover:text-ink',
              )}
            >
              {value === '2d' ? labels.mode2d : labels.mode3d}
            </button>
          ))}
        </fieldset>
      ) : null}
      {onPeopleChange ? (
        <button
          type="button"
          aria-label={labels.people}
          title={labels.people}
          aria-pressed={people}
          onClick={() => onPeopleChange(!people)}
          className={cn(
            button,
            'rounded-sm border border-line shadow-float',
            people ? 'bg-ink text-surface hover:bg-ink' : 'bg-surface text-ink-muted',
          )}
        >
          <UsersRoundIcon strokeWidth={1.75} />
        </button>
      ) : null}
      <div className="flex flex-col divide-y divide-line overflow-hidden rounded-sm border border-line bg-surface shadow-float">
        <button type="button" aria-label={labels.zoomIn} onClick={onZoomIn} className={button}>
          <PlusIcon strokeWidth={1.75} />
        </button>
        <button type="button" aria-label={labels.zoomOut} onClick={onZoomOut} className={button}>
          <MinusIcon strokeWidth={1.75} />
        </button>
        {onResetView ? (
          <button
            type="button"
            aria-label={labels.resetView}
            onClick={onResetView}
            className={button}
          >
            <LocateFixedIcon strokeWidth={1.75} />
          </button>
        ) : null}
        <button
          type="button"
          aria-label={labels.resetNorth}
          onClick={onResetNorth}
          className={button}
        >
          <NavigationIcon strokeWidth={1.75} style={{ transform: `rotate(${-bearing}deg)` }} />
        </button>
      </div>
    </div>
  );
}

export { MapControls };
