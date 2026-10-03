import { cn } from '@indoor/ui';
import { CornerDownLeftIcon, DeleteIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ROWS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'] as const;

const key =
  'flex h-(--control-height) min-w-(--control-height) cursor-pointer items-center justify-center rounded-sm border border-line bg-surface font-bold text-ink active:bg-signal-soft';

/**
 * Keyboard di layar Info Point (QWERTY + angka). Kolom cari memakai `inputMode="none"` sehingga
 * keyboard sistem operasi tidak muncul; semua isian lewat tombol ini.
 */
export function OnScreenKeyboard({
  onInput,
  onBackspace,
  onEnter,
}: {
  onInput: (text: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
}) {
  const { t } = useTranslation();
  return (
    <fieldset
      aria-label={t('infoPoint.keyboard')}
      className="m-0 grid min-w-0 gap-2 rounded-md border border-line bg-canvas p-2"
      // Tombol tidak mengambil fokus dari kolom cari.
      onPointerDown={(e) => e.preventDefault()}
    >
      {ROWS.map((row) => (
        <div key={row} className="flex justify-center gap-2">
          {[...row].map((letter) => (
            <button key={letter} type="button" className={key} onClick={() => onInput(letter)}>
              {letter}
            </button>
          ))}
        </div>
      ))}
      <div className="flex justify-center gap-2">
        <button type="button" className={cn(key, 'px-4')} onClick={() => onInput('-')}>
          -
        </button>
        <button type="button" className={cn(key, 'flex-1')} onClick={() => onInput(' ')}>
          {t('infoPoint.space')}
        </button>
        <button
          type="button"
          aria-label={t('infoPoint.backspace')}
          className={cn(key, 'px-4')}
          onClick={onBackspace}
        >
          <DeleteIcon aria-hidden="true" strokeWidth={1.75} className="size-6" />
        </button>
        <button type="button" className={cn(key, 'gap-2 bg-signal px-6')} onClick={onEnter}>
          <CornerDownLeftIcon aria-hidden="true" strokeWidth={1.75} className="size-6" />
          {t('infoPoint.search')}
        </button>
      </div>
    </fieldset>
  );
}
