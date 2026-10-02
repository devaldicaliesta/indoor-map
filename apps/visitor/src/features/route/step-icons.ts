import type { InstructionAction } from '@indoor/domain';
import {
  ArrowBigDownDashIcon,
  ArrowBigUpDashIcon,
  ArrowUpIcon,
  ArrowUpLeftIcon,
  ArrowUpRightIcon,
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

/** Ikon aksi langkah, sama dengan daftar langkah uji rute Admin. */
export const STEP_ICONS: Record<InstructionAction, LucideIcon> = {
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
