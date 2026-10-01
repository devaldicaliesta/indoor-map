import { cn } from '@indoor/ui';
import { type KeyboardEvent, type PointerEvent, type ReactNode, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cycleSnap, nearestSnap, type SheetSnap, snapHeight, stepSnap } from './sheet-snap';

const DRAG_THRESHOLD_PX = 4;

/** Tinggi sheet diatur sendiri, atau oleh halaman lewat `snap` dan `onSnapChange`. */
export function BottomSheet({
  children,
  snap: controlledSnap,
  onSnapChange,
}: {
  children: ReactNode;
  snap?: SheetSnap | undefined;
  onSnapChange?: ((snap: SheetSnap) => void) | undefined;
}) {
  const { t } = useTranslation();
  const [ownSnap, setOwnSnap] = useState<SheetSnap>('peek');
  const snap = controlledSnap ?? ownSnap;
  const setSnap = (next: SheetSnap) => {
    setOwnSnap(next);
    onSnapChange?.(next);
  };
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const drag = useRef<{ startY: number; startHeight: number; moved: boolean } | null>(null);

  const viewport = () => window.innerHeight;

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startY: event.clientY,
      startHeight: snapHeight(snap, viewport()),
      moved: false,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state) return;
    const delta = state.startY - event.clientY;
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) state.moved = true;
    if (state.moved) {
      setDragHeight(
        Math.min(Math.max(state.startHeight + delta, 0), snapHeight('full', viewport())),
      );
    }
  }

  function onPointerUp() {
    const state = drag.current;
    drag.current = null;
    if (state?.moved && dragHeight !== null) setSnap(nearestSnap(dragHeight, viewport()));
    else setSnap(cycleSnap(snap));
    setDragHeight(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      setSnap(stepSnap(snap, event.key === 'ArrowUp' ? 'up' : 'down'));
    }
  }

  const height = dragHeight ?? snapHeight(snap, viewport());

  return (
    <section
      data-snap={snap}
      className={cn(
        'absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-lg border-line border-t bg-surface shadow-float',
        dragHeight === null && 'transition-[height] duration-300 ease-out',
      )}
      style={{ height }}
    >
      <button
        type="button"
        aria-label={t('sheet.handle')}
        aria-description={t('sheet.hint')}
        aria-expanded={snap !== 'peek'}
        className="flex h-6 w-full shrink-0 cursor-grab touch-none items-center justify-center"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <span aria-hidden="true" className="h-1 w-10 rounded-full bg-line" />
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-(--panel-padding) pb-(--panel-padding)">
        {children}
      </div>
    </section>
  );
}
