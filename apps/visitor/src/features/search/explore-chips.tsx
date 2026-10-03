import { cn } from '@indoor/ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { EntityIcon } from '../../components/entity-icon';
import { useExplore, useExploreStore } from './explore-context';
import type { ExploreList } from './explore-store';

function Chip({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-(--control-height) cursor-pointer items-center gap-2 whitespace-nowrap rounded-sm border px-3 font-bold',
        active
          ? 'border-ink bg-ink text-surface'
          : 'border-line bg-surface text-ink hover:bg-canvas',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

const isList = (current: ExploreList | null, kind: ExploreList['kind'], id?: string) =>
  current?.kind === kind && (!id || ('id' in current && current.id === id));

/**
 * Chip kategori dan jenis fasilitas, lalu direktori A–Z. Di HP satu baris yang bisa digeser agar
 * muat di sheet posisi intip; di desktop membungkus ke baris berikutnya.
 */
export function ExploreChips({ scroll = false }: { scroll?: boolean }) {
  const { t } = useTranslation();
  const { chips } = useExplore();
  const list = useExploreStore((s) => s.list);
  const toggleList = useExploreStore((s) => s.toggleList);

  return (
    <nav aria-label={t('explore.chips')} className="min-w-0">
      <ul
        className={cn(
          'flex gap-2',
          scroll
            ? '-mx-(--panel-padding) overflow-x-auto px-(--panel-padding) [scrollbar-width:none]'
            : 'flex-wrap',
        )}
      >
        {chips.map((chip) => {
          const id = chip.kind === 'category' ? chip.category.id : chip.facilityType.id;
          return (
            <li key={`${chip.kind}:${id}`} className="shrink-0">
              <Chip
                active={isList(list, chip.kind, id)}
                onClick={() => toggleList({ kind: chip.kind, id })}
                icon={
                  chip.kind === 'category' ? (
                    <EntityIcon
                      icon={chip.category.icon}
                      color={chip.category.color}
                      className="size-6"
                    />
                  ) : (
                    <EntityIcon
                      icon={chip.facilityType.icon}
                      safety={chip.facilityType.isSafety}
                      className="size-6"
                    />
                  )
                }
              >
                {chip.kind === 'category' ? chip.category.name : chip.facilityType.name}
              </Chip>
            </li>
          );
        })}
        <li className="shrink-0">
          <Chip
            active={isList(list, 'directory')}
            onClick={() => toggleList({ kind: 'directory' })}
          >
            {t('explore.directoryChip')}
          </Chip>
        </li>
      </ul>
    </nav>
  );
}
