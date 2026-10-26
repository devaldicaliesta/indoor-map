// Pembungkus driver.js. Modul ini (beserta driver.js) hanya dimuat lewat `import()` saat tur
// dimulai, agar tidak menambah muat awal Visitor.
import { type DriveStep, driver } from 'driver.js';
import { type TourStep, tourSelector } from './steps';

export interface TourLabels {
  next: string;
  previous: string;
  done: string;
  skip: string;
  /** Teks indikator langkah dengan `{{current}}` dan `{{total}}`, misalnya "{{current}} dari {{total}}". */
  progress: string;
}

export type TourEnd = 'done' | 'skipped';

export interface TourHandle {
  stop(): void;
}

const STYLE_ID = 'indoor-tour-style';

// Tema dari design token (docs/05-desain-ui.md), menggantikan CSS bawaan driver.js. Ukuran
// huruf dan tinggi tombol mengikuti permukaan (Admin, Visitor, Info Point) lewat token.
const TOUR_CSS = `
.driver-active .driver-overlay { pointer-events: none; }
.driver-active.driver-no-scroll { overflow: hidden; }
.driver-active * { pointer-events: none; }
.driver-active .driver-active-element, .driver-active .driver-active-element *,
.driver-popover, .driver-popover * { pointer-events: auto; }
.driver-active-element-parent-no-scroll { overflow: hidden !important; }
.driver-no-interaction, .driver-no-interaction * { pointer-events: none !important; }
.driver-fade .driver-overlay, .driver-fade .driver-popover { animation: indoor-tour-fade 0.2s ease-out; }
@keyframes indoor-tour-fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .driver-fade .driver-overlay, .driver-fade .driver-popover { animation: none; }
}
.driver-popover {
  all: unset; box-sizing: border-box; position: fixed; top: 0; right: 0; z-index: 1000000000;
  margin: 0;
  width: min(360px, calc(100vw - 24px)); padding: var(--panel-padding);
  background: var(--surface); color: var(--ink); border: 1px solid var(--line);
  border-radius: 8px; box-shadow: var(--float-shadow);
  font-family: var(--font-body); font-size: var(--body-size); line-height: 1.5;
}
[data-surface="info-point"] .driver-popover { width: min(560px, calc(100vw - 48px)); }
.driver-popover-title { display: block; margin: 0; font-weight: 700; font-size: 1.15em; line-height: 1.3; }
.driver-popover-description { display: block; margin: 4px 0 0; color: var(--ink-muted); }
.driver-popover-close-btn { display: none !important; }
.driver-popover-footer { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px; }
.driver-popover-progress-text { color: var(--ink-muted); font-size: 0.875em; margin-right: auto; }
.driver-popover-navigation-btns { display: flex; gap: 8px; margin-left: auto; }
.driver-popover-footer button {
  all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center;
  height: var(--control-height); padding: 0 16px; border-radius: 4px;
  font-weight: 700; font-size: 1em; color: var(--ink);
  background: var(--surface); border: 1px solid var(--line);
}
.driver-popover-footer button:hover { background: var(--canvas); }
.driver-popover-footer .driver-popover-next-btn { background: var(--signal); color: var(--on-signal); border-color: var(--signal); }
.driver-popover-footer .driver-popover-next-btn:hover { background: var(--signal-soft); color: var(--ink); }
.driver-popover-footer .indoor-tour-skip { border-color: transparent; padding: 0 8px; text-decoration: underline; text-underline-offset: 4px; }
.driver-popover-footer button:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.driver-popover-footer .driver-popover-btn-disabled { display: none; }
.driver-popover-arrow { position: absolute; border: 6px solid var(--surface); }
.driver-popover-arrow-side-left { border-top-color: transparent; border-bottom-color: transparent; border-right-color: transparent; left: 100%; }
.driver-popover-arrow-side-right { border-top-color: transparent; border-bottom-color: transparent; border-left-color: transparent; right: 100%; }
.driver-popover-arrow-side-top { border-bottom-color: transparent; border-left-color: transparent; border-right-color: transparent; top: 100%; }
.driver-popover-arrow-side-bottom { border-top-color: transparent; border-left-color: transparent; border-right-color: transparent; bottom: 100%; }
.driver-popover-arrow-side-over, .driver-popover-arrow-side-center, .driver-popover-arrow-none { display: none; }
`;

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = TOUR_CSS;
  document.head.append(style);
}

/**
 * Elemen sasaran pertama yang terlihat dan berukuran (tab tersembunyi dan tabel lain bisa
 * memakai nama yang sama; pembungkus kosong, misalnya pemilih lantai di venue satu lantai, dilewati).
 */
export function findTourTarget(target: string): Element | null {
  for (const element of document.querySelectorAll(tourSelector(target))) {
    const box = element.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) return element;
  }
  return null;
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Tab dan Shift+Tab berputar di antara tombol tur, tidak lari ke halaman di balik lapisan. */
function trapFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab') return;
  const popover = document.querySelector('.driver-popover');
  if (!popover) return;
  const buttons = [...popover.querySelectorAll<HTMLButtonElement>('button')].filter(
    (button) => !button.disabled && button.getClientRects().length > 0,
  );
  if (buttons.length === 0) return;
  // Trap bawaan driver.js ikut memasukkan elemen yang disorot; cukup satu yang berjalan.
  event.preventDefault();
  event.stopImmediatePropagation();
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
  const step = event.shiftKey ? -1 : 1;
  const next = current === -1 ? 0 : (current + step + buttons.length) % buttons.length;
  buttons[next]?.focus();
}

/** Menjalankan tur; `onEnd` dipanggil sekali, baik selesai maupun dilewati. */
export function runTour(
  steps: readonly TourStep[],
  { labels, onEnd }: { labels: TourLabels; onEnd: (end: TourEnd) => void },
): TourHandle {
  ensureStyle();
  let end: TourEnd = 'skipped';
  // Langkah berikutnya disiapkan dulu (misalnya membuka bottom sheet) sebelum driver pindah.
  const go = async (index: number) => {
    const step = steps[index];
    if (!step) return;
    await step.before?.();
    tour.moveTo(index);
  };
  const driveSteps: DriveStep[] = steps.map((step, index) => {
    const target = step.target;
    return {
      ...(target ? { element: () => findTourTarget(target) ?? document.body } : {}),
      popover: {
        title: step.title,
        description: step.description,
        ...(step.side ? { side: step.side } : {}),
        onNextClick: () => {
          if (index === steps.length - 1) {
            end = 'done';
            tour.destroy();
          } else void go(index + 1);
        },
        onPrevClick: () => void go(index - 1),
      },
    };
  });
  const tour = driver({
    steps: driveSteps,
    animate: !reducedMotion(),
    smoothScroll: !reducedMotion(),
    allowClose: true,
    allowKeyboardControl: true,
    overlayClickBehavior: 'none',
    overlayColor: 'rgb(17 20 24)',
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 6,
    showProgress: true,
    progressText: labels.progress,
    nextBtnText: labels.next,
    prevBtnText: labels.previous,
    doneBtnText: labels.done,
    closeBtnLabel: labels.skip,
    showButtons: ['next', 'previous'],
    onPopoverRender: (popover) => {
      if (!popover.footer.querySelector('.indoor-tour-skip')) {
        const skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'indoor-tour-skip';
        skip.textContent = labels.skip;
        skip.addEventListener('click', () => tour.destroy());
        popover.footer.prepend(skip);
      }
      // Fokus ke "Lanjut" setelah driver.js selesai memasang popover, agar keyboard langsung jalan.
      requestAnimationFrame(() => popover.nextButton.focus());
    },
    onDestroyed: () => {
      document.removeEventListener('keydown', trapFocus, true);
      onEnd(end);
    },
  });
  document.addEventListener('keydown', trapFocus, true);
  void (async () => {
    await steps[0]?.before?.();
    tour.drive();
  })();
  return { stop: () => tour.destroy() };
}
