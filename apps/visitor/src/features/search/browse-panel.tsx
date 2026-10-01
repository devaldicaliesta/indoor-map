import { type KeyboardEvent, useLayoutEffect, useRef } from 'react';
import { Directory } from '../location/directory';
import { LocationProfile } from '../location/location-profile';
import { FacilityDetail, UnitDetail } from '../location/place-detail';
import { BrowseHome } from './browse-home';
import { type BrowseScreen, selectScreen, useBrowseStore } from './browse-store';
import { Members } from './members';
import { SearchResults } from './search-results';

function Screen({ screen }: { screen: BrowseScreen }) {
  switch (screen.kind) {
    case 'location':
      return <LocationProfile id={screen.id} />;
    case 'unit':
      return <UnitDetail id={screen.id} />;
    case 'facility':
      return <FacilityDetail id={screen.id} />;
    case 'category':
    case 'facility_type':
      return <Members target={screen} />;
    case 'directory':
      return <Directory />;
  }
}

/**
 * Isi panel Visitor: beranda (chip), hasil pencarian, atau layar yang dibuka di atasnya.
 * Escape kembali satu layar.
 */
export function BrowsePanel() {
  const screen = useBrowseStore(selectScreen);
  const searching = useBrowseStore((state) => state.query.trim() !== '');
  const back = useBrowseStore((state) => state.back);
  const root = useRef<HTMLDivElement>(null);
  const key = screen ? `${screen.kind}:${'id' in screen ? screen.id : ''}` : searching;

  // Layar baru mulai dari atas, bukan dari posisi gulir layar sebelumnya. Wadah gulirnya
  // (panel kiri desktop atau bottom sheet) ditandai `data-panel-scroll` oleh VisitorShell.
  useLayoutEffect(() => {
    root.current?.closest('[data-panel-scroll]')?.scrollTo({ top: 0 });
  }, [key]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Escape dari dialog/menu (portal) juga sampai ke sini lewat React; hanya yang di panel.
    if (event.key !== 'Escape' || !screen) return;
    if (!event.currentTarget.contains(event.target as Node)) return;
    event.preventDefault();
    back();
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: menangkap Escape dari kontrol di dalam panel.
    <div ref={root} onKeyDown={onKeyDown}>
      {screen ? (
        <Screen key={key.toString()} screen={screen} />
      ) : searching ? (
        <SearchResults />
      ) : (
        <BrowseHome />
      )}
    </div>
  );
}
