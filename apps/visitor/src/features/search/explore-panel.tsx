import type { ExploreTarget, SnapshotIndex } from '@indoor/domain';
import { Button } from '@indoor/ui';
import { ArrowLeftIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FacilityDetail, UnitDetail } from '../location/feature-details';
import { LocationProfile } from '../location/location-profile';
import { Directory } from './directory';
import { ExploreChips } from './explore-chips';
import { useExplore, useExploreStore } from './explore-context';
import { CategoryList, FacilityTypeList } from './member-lists';
import { SearchResults } from './search-results';

/** Judul singkat detail untuk tombol kembali di header HP. */
export function detailTitle(index: SnapshotIndex, detail: ExploreTarget): string {
  if (detail.kind === 'location') return index.locations.get(detail.id)?.name ?? '';
  const feature = index.features.get(detail.id);
  if (detail.kind === 'unit') return feature?.properties.unitCode ?? '';
  const typeId = feature?.properties.facilityTypeId;
  return feature?.properties.name ?? (typeId ? index.facilityTypes.get(typeId)?.name : '') ?? '';
}

function Detail({ detail }: { detail: ExploreTarget }) {
  if (detail.kind === 'location') return <LocationProfile id={detail.id} />;
  if (detail.kind === 'unit') return <UnitDetail id={detail.id} />;
  return <FacilityDetail id={detail.id} />;
}

function BackButton() {
  const { t } = useTranslation();
  const closeDetail = useExploreStore((s) => s.closeDetail);
  return (
    <Button variant="ghost" size="sm" className="-ml-3 justify-self-start" onClick={closeDetail}>
      <ArrowLeftIcon aria-hidden="true" strokeWidth={1.75} />
      {t('explore.back')}
    </Button>
  );
}

/** Tombol kembali + judul detail yang menggantikan kolom cari di header HP (wireframe profil). */
export function DetailBackBar() {
  const { t } = useTranslation();
  const { index } = useExplore();
  const detail = useExploreStore((s) => s.detail);
  const closeDetail = useExploreStore((s) => s.closeDetail);
  if (!detail) return null;
  return (
    <div className="flex h-(--control-height) min-w-0 flex-1 items-center rounded-sm border border-line bg-surface shadow-float">
      <button
        type="button"
        aria-label={t('explore.back')}
        onClick={closeDetail}
        className="flex size-(--control-height) shrink-0 cursor-pointer items-center justify-center text-ink"
      >
        <ArrowLeftIcon aria-hidden="true" strokeWidth={1.75} className="size-5" />
      </button>
      <span className="truncate pr-3 font-bold">{detailTitle(index, detail)}</span>
    </div>
  );
}

/** Daftar yang dipilih; tanpa daftar, desktop memberi petunjuk langkah berikutnya. */
function ListContent({ hint }: { hint: boolean }) {
  const { t } = useTranslation();
  const list = useExploreStore((s) => s.list);
  if (list?.kind === 'category') return <CategoryList id={list.id} />;
  if (list?.kind === 'facility_type') return <FacilityTypeList id={list.id} />;
  if (list?.kind === 'directory') return <Directory />;
  return hint ? <p className="text-ink-muted">{t('explore.hint')}</p> : null;
}

/**
 * Isi panel kiri (desktop) dan bottom sheet (HP): detail yang terbuka, hasil cari, atau chip
 * dengan daftar yang dipilih. Detail memakai seluruh panel (chip venue bisa lebih dari satu
 * baris); tombol kembali ada di atas detail di desktop dan di header di HP.
 */
export function ExplorePanel({ desktop }: { desktop: boolean }) {
  const detail = useExploreStore((s) => s.detail);
  const query = useExploreStore((s) => s.query);
  if (detail) {
    if (!desktop) return <Detail detail={detail} />;
    return (
      <div className="grid gap-2">
        <BackButton />
        <Detail detail={detail} />
      </div>
    );
  }
  if (query) return <SearchResults />;
  return (
    <div className="grid gap-4">
      <ExploreChips scroll={!desktop} />
      <ListContent hint={desktop} />
    </div>
  );
}
