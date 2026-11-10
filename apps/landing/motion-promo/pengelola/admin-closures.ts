// Halaman Penutupan Admin (closures-page.tsx, target-picker.tsx, closure-dialog.tsx): pilih
// konektor, dialog "Tutup sementara" dengan alasan, lalu baris "Sedang berlaku" di tabel.
import { C, FONT, floating, icon, noShadow, rrect, text } from '../shared/draw';
import { ADMIN_H, ADMIN_W, button, drawSidebar, drawTopBar, statusDot } from './admin-shell';
import type { Copy } from './copy';

export interface ClosureState {
  /** 0..1 daftar pilihan terbuka. */
  pickerOpen: number;
  picked: boolean;
  /** 0..1 dialog terbuka. */
  dialog: number;
  /** Jumlah huruf alasan yang sudah diketik. */
  typed: number;
  savePress: number;
  /** 0..1 baris penutupan baru di tabel. */
  row: number;
  t: number;
}

export const SELECT_BOX = { x: 176, y: 106, w: 300, h: 32 };
export const CLOSE_BUTTON = { x: 484, y: 106, w: 128, h: 32 };
export const OPTION_LIFT_A = { x: 190, y: 168 };
export const DIALOG = { x: 430, y: 196, w: 420, h: 360 };
export const SAVE_BUTTON = {
  x: DIALOG.x + DIALOG.w - 160,
  y: DIALOG.y + DIALOG.h - 52,
  w: 140,
  h: 32,
};

function table(ctx: CanvasRenderingContext2D, copy: Copy, s: ClosureState) {
  const x = 176;
  const y = 186;
  const w = ADMIN_W - x - 16;
  rrect(ctx, x, y, w, 40 * 4, 8, C.surface, C.line);
  const cols = [x + 14, x + 190, x + 350, x + 540];
  copy.admin.table.forEach((h, i) => {
    text(ctx, h, cols[i] ?? x, y + 20, { size: 11, weight: 700, color: C.muted });
  });
  ctx.fillStyle = C.line;
  ctx.fillRect(x, y + 40, w, 1);
  if (s.row > 0) {
    ctx.save();
    ctx.globalAlpha = s.row;
    ctx.fillStyle = 'rgba(255,233,168,.55)';
    ctx.fillRect(x + 1, y + 41, w - 2, 39 * s.row);
    text(ctx, copy.admin.liftA, cols[0] ?? 0, y + 60, { size: 12, weight: 700 });
    text(ctx, copy.admin.reason, cols[1] ?? 0, y + 60, { size: 12 });
    statusDot(ctx, (cols[2] ?? 0) + 4, y + 60, copy.admin.activeStatus, C.danger, 12);
    text(ctx, copy.admin.startsValue, cols[3] ?? 0, y + 60, { size: 12, family: FONT.mono });
    ctx.restore();
  }
  // Penutupan lama yang sudah selesai, terdorong ke bawah oleh baris baru.
  const ry = y + 60 + s.row * 40;
  if (s.row > 0) {
    ctx.fillStyle = C.line;
    ctx.fillRect(x, ry - 20, w, 1);
  }
  const [what, reason, status, starts] = copy.admin.pastClosure;
  text(ctx, what, cols[0] ?? 0, ry, { size: 12 });
  text(ctx, reason, cols[1] ?? 0, ry, { size: 12 });
  statusDot(ctx, (cols[2] ?? 0) + 4, ry, status, C.muted, 12);
  text(ctx, starts, cols[3] ?? 0, ry, { size: 12, family: FONT.mono });
}

function dialog(ctx: CanvasRenderingContext2D, copy: Copy, s: ClosureState) {
  if (s.dialog <= 0) return;
  ctx.save();
  ctx.globalAlpha = s.dialog;
  ctx.fillStyle = 'rgba(17,20,24,.42)';
  ctx.fillRect(0, 0, ADMIN_W, ADMIN_H);
  const d = DIALOG;
  const y0 = d.y + (1 - s.dialog) * 16;
  floating(ctx, 1.5);
  rrect(ctx, d.x, y0, d.w, d.h, 8, C.surface);
  noShadow(ctx);
  const x = d.x + 22;
  text(ctx, copy.admin.closeTemp, x, y0 + 32, { size: 17, weight: 700 });
  icon(ctx, 'x', d.x + d.w - 26, y0 + 30, 14, C.muted);
  text(ctx, copy.admin.dialogNote, x, y0 + 56, { size: 11.5, color: C.muted });
  text(ctx, copy.admin.reasonLabel, x, y0 + 88, { size: 11.5, weight: 700 });
  rrect(
    ctx,
    x,
    y0 + 100,
    d.w - 44,
    34,
    4,
    C.surface,
    s.typed > 0 && s.typed < 99 ? C.ink : C.line,
    s.typed > 0 ? 1.6 : 1,
  );
  const typed = copy.admin.reason.slice(0, Math.floor(s.typed));
  text(ctx, typed, x + 10, y0 + 117, { size: 13 });
  ctx.font = `400 13px ${FONT.admin}`;
  if (s.typed < copy.admin.reason.length + 0.5 && Math.floor(s.t * 3) % 2 === 0) {
    ctx.fillStyle = C.ink;
    ctx.fillRect(x + 11 + ctx.measureText(typed).width, y0 + 108, 1.5, 18);
  }
  const half = (d.w - 56) / 2;
  text(ctx, copy.admin.starts, x, y0 + 160, { size: 11.5, weight: 700 });
  text(ctx, copy.admin.ends, x + half + 12, y0 + 160, { size: 11.5, weight: 700 });
  rrect(ctx, x, y0 + 172, half, 32, 4, C.surface, C.line);
  rrect(ctx, x + half + 12, y0 + 172, half, 32, 4, C.surface, C.line);
  text(ctx, copy.admin.startsValue, x + 10, y0 + 188, { size: 12, family: FONT.mono });
  text(ctx, copy.admin.endsValue, x + half + 22, y0 + 188, { size: 12, color: C.muted });
  text(ctx, copy.admin.impact, x, y0 + 228, { size: 11.5, weight: 700 });
  text(ctx, copy.admin.impactNone, x, y0 + 248, { size: 11.5, color: C.muted });
  button(ctx, d.x + d.w - 236, y0 + d.h - 52, 68, 32, copy.admin.cancel, 'ghost');
  button(
    ctx,
    SAVE_BUTTON.x,
    y0 + d.h - 52,
    SAVE_BUTTON.w,
    SAVE_BUTTON.h,
    copy.admin.saveClosure,
    'primary',
    s.savePress,
  );
  ctx.restore();
}

export function drawClosures(
  ctx: CanvasRenderingContext2D,
  copy: Copy,
  s: ClosureState,
  logo: HTMLImageElement,
) {
  ctx.fillStyle = C.canvas;
  ctx.fillRect(0, 0, ADMIN_W, ADMIN_H);
  drawSidebar(ctx, copy, 3, logo);
  drawTopBar(ctx, copy);
  text(ctx, copy.admin.closures, 176, 60, { size: 20, weight: 700 });
  ctx.font = `700 20px ${FONT.admin}`;
  text(ctx, copy.admin.venue, 186 + ctx.measureText(copy.admin.closures).width, 61, {
    size: 13,
    color: C.muted,
  });
  text(ctx, copy.admin.target, 176, 94, { size: 11.5, weight: 700 });
  const b = SELECT_BOX;
  rrect(
    ctx,
    b.x,
    b.y,
    b.w,
    b.h,
    4,
    C.surface,
    s.pickerOpen > 0 ? C.ink : C.line,
    s.pickerOpen > 0 ? 1.6 : 1,
  );
  text(ctx, s.picked ? copy.admin.liftA : copy.admin.targetPlaceholder, b.x + 10, b.y + 16.5, {
    size: 12.5,
    color: s.picked ? C.ink : C.muted,
  });
  icon(ctx, 'chevron-down', b.x + b.w - 16, b.y + 16, 12, C.ink);
  const cb = CLOSE_BUTTON;
  ctx.save();
  ctx.globalAlpha = s.picked ? 1 : 0.45;
  button(
    ctx,
    cb.x,
    cb.y,
    cb.w,
    cb.h,
    copy.admin.closeTemp,
    'primary',
    s.dialog > 0 && s.dialog < 0.5 ? 1 : 0,
  );
  ctx.restore();
  table(ctx, copy, s);
  if (s.pickerOpen > 0) {
    ctx.save();
    ctx.globalAlpha = s.pickerOpen;
    floating(ctx);
    rrect(ctx, b.x, b.y + b.h + 4, b.w, 4 * 28 + 8, 6, C.surface, C.line);
    noShadow(ctx);
    copy.admin.closureOptions.forEach((label, i) => {
      const y = b.y + b.h + 8 + i * 28;
      if (i === 1 && s.picked) rrect(ctx, b.x + 4, y, b.w - 8, 26, 4, C.signalSoft);
      icon(ctx, 'arrow-up-down', b.x + 18, y + 13, 12, C.muted);
      text(ctx, label, b.x + 32, y + 13.5, { size: 12.5, weight: i === 1 ? 700 : 400 });
    });
    ctx.restore();
  }
  dialog(ctx, copy, s);
}
