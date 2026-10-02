import type { InstructionAction } from '@indoor/domain';
import type { RouteStep } from '@indoor/routing';
import { Button, cn } from '@indoor/ui';
import {
  ArrowBigDownDashIcon,
  ArrowBigUpDashIcon,
  ArrowUpIcon,
  ArrowUpLeftIcon,
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsDownIcon,
  ChevronsUpIcon,
  CircleDotIcon,
  CornerUpLeftIcon,
  CornerUpRightIcon,
  LogInIcon,
  LogOutIcon,
  type LucideIcon,
  MapPinIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react';

const ACTION_ICONS: Record<InstructionAction, LucideIcon> = {
  start: CircleDotIcon,
  straight: ArrowUpIcon,
  turn_left: CornerUpLeftIcon,
  turn_right: CornerUpRightIcon,
  slight_left: ArrowUpLeftIcon,
  slight_right: ArrowUpRightIcon,
  elevator_up: ChevronsUpIcon,
  elevator_down: ChevronsDownIcon,
  escalator_up: TrendingUpIcon,
  escalator_down: TrendingDownIcon,
  stairs_up: ArrowBigUpDashIcon,
  stairs_down: ArrowBigDownDashIcon,
  exit_building: LogOutIcon,
  enter_building: LogInIcon,
  arrive: MapPinIcon,
};

/**
 * Daftar langkah dengan ikon aksi; chip lantai muncul setiap lantai berganti. Memilih langkah
 * (klik, atau tombol sebelumnya/berikutnya) memindah peta ke lantai dan titiknya.
 */
export function RouteSteps({
  steps,
  texts,
  floorChip,
  activeStep,
  onSelect,
}: {
  steps: readonly RouteStep[];
  texts: readonly string[];
  floorChip: (floorId: string) => string;
  activeStep: number | null;
  onSelect: (index: number) => void;
}) {
  const last = steps.length - 1;
  return (
    <div className="grid min-w-0 gap-2">
      <ol aria-label="Langkah" className="grid min-w-0 gap-0.5">
        {steps.map((step, i) => {
          const Icon = ACTION_ICONS[step.action];
          const floorChanged = i === 0 || steps[i - 1]?.floorId !== step.floorId;
          return (
            <li key={i}>
              <button
                type="button"
                aria-current={activeStep === i ? 'step' : undefined}
                onClick={() => onSelect(i)}
                className={cn(
                  'flex w-full cursor-pointer items-start gap-2 rounded-sm px-1 py-1 text-left hover:bg-canvas',
                  activeStep === i && 'bg-signal-soft hover:bg-signal-soft',
                )}
              >
                <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 flex-1">{texts[i]}</span>
                {floorChanged ? (
                  <span className="shrink-0 rounded-sm border border-line px-1 font-mono text-xs">
                    {floorChip(step.floorId)}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex items-center justify-between gap-2">
        <Button
          size="icon"
          aria-label="Langkah sebelumnya"
          disabled={activeStep === null || activeStep === 0}
          onClick={() => onSelect((activeStep ?? 1) - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        <span aria-live="polite" className="whitespace-nowrap text-sm tabular-nums">
          {activeStep === null
            ? `${steps.length} langkah`
            : `Langkah ${activeStep + 1} dari ${steps.length}`}
        </span>
        <Button
          size="icon"
          aria-label="Langkah berikutnya"
          disabled={activeStep === last}
          onClick={() => onSelect(activeStep === null ? 0 : activeStep + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
