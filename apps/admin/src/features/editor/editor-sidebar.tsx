import type { FacilityType, ValidationIssue, VenueId } from '@indoor/domain';
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@indoor/ui';
import { useState } from 'react';
import { FeatureList } from './feature-list';
import { EntrancesPanel, useUnlinked } from './graph/entrances';
import { TestRoutePanel } from './test-route/test-route-panel';
import { useTestRouteStore } from './test-route/test-route-store';
import type { EditorSession } from './use-editor-session';

type ListTab = 'features' | 'entrances';
const ROUTE_TAB = 'route';

/**
 * Panel kiri editor: daftar fitur lantai, titik masuk unit/fasilitas ke jalur, dan uji rute. Tab
 * Uji rute diingat di store agar tetap terbuka saat rute berpindah ke gedung lain.
 */
export function EditorSidebar({
  venueId,
  floorName,
  facilityTypes,
  issues,
  session,
  canEdit,
}: {
  venueId: VenueId;
  floorName: string;
  facilityTypes: readonly FacilityType[];
  issues: ReadonlyMap<string, ValidationIssue[]>;
  session: EditorSession;
  canEdit: boolean;
}) {
  const unlinked = useUnlinked().length;
  const routeOpen = useTestRouteStore((s) => s.open);
  const setRouteOpen = useTestRouteStore((s) => s.setOpen);
  const [tab, setTab] = useState<ListTab>('features');
  return (
    <Tabs
      value={routeOpen ? ROUTE_TAB : tab}
      onValueChange={(value) => {
        setRouteOpen(value === ROUTE_TAB);
        if (value !== ROUTE_TAB) setTab(value as ListTab);
      }}
      className="h-full min-h-0 gap-0"
    >
      <TabsList className="gap-3 px-3">
        <TabsTrigger value="features">Fitur</TabsTrigger>
        <TabsTrigger value="entrances">
          Titik masuk
          {unlinked ? (
            <Badge variant="signal" aria-label={`${unlinked} belum terhubung`}>
              {unlinked}
            </Badge>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value={ROUTE_TAB}>Uji rute</TabsTrigger>
      </TabsList>
      <TabsContent value="features" className="min-h-0">
        <FeatureList floorName={floorName} facilityTypes={facilityTypes} issues={issues} />
      </TabsContent>
      <TabsContent value="entrances" className="min-h-0">
        <EntrancesPanel session={session} canEdit={canEdit} />
      </TabsContent>
      <TabsContent value={ROUTE_TAB} className="min-h-0">
        <TestRoutePanel venueId={venueId} facilityTypes={facilityTypes} />
      </TabsContent>
    </Tabs>
  );
}
