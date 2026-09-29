/** Tiga tinggi bottom sheet (05-desain-ui.md): intip ±96 px, setengah, penuh. */
export const SHEET_SNAPS = ['peek', 'half', 'full'] as const;
export type SheetSnap = (typeof SHEET_SNAPS)[number];

export const PEEK_HEIGHT_PX = 96;
/** Ruang di atas sheet penuh agar kolom cari yang mengambang tetap terlihat. */
export const FULL_TOP_GAP_PX = 72;

export function snapHeight(snap: SheetSnap, viewportPx: number): number {
  switch (snap) {
    case 'peek':
      return PEEK_HEIGHT_PX;
    case 'half':
      return Math.round(viewportPx / 2);
    case 'full':
      return viewportPx - FULL_TOP_GAP_PX;
  }
}

/** Tinggi hasil drag dibulatkan ke snap terdekat. */
export function nearestSnap(heightPx: number, viewportPx: number): SheetSnap {
  let best: SheetSnap = 'peek';
  for (const snap of SHEET_SNAPS) {
    if (
      Math.abs(snapHeight(snap, viewportPx) - heightPx) <
      Math.abs(snapHeight(best, viewportPx) - heightPx)
    ) {
      best = snap;
    }
  }
  return best;
}

export function stepSnap(current: SheetSnap, direction: 'up' | 'down'): SheetSnap {
  const index = SHEET_SNAPS.indexOf(current) + (direction === 'up' ? 1 : -1);
  return SHEET_SNAPS[Math.min(Math.max(index, 0), SHEET_SNAPS.length - 1)] ?? current;
}

/** Klik/Enter pada pegangan: intip → setengah → penuh → intip. */
export function cycleSnap(current: SheetSnap): SheetSnap {
  return current === 'full' ? 'peek' : stepSnap(current, 'up');
}
