import type { FacilityType, ValidationIssue } from '@indoor/domain';
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@indoor/ui';
import { FeatureList } from './feature-list';
import { EntrancesPanel, useUnlinked } from './graph/entrances';
import type { EditorSession } from './use-editor-session';

/** Panel kiri editor: daftar fitur lantai dan titik masuk unit/fasilitas ke jalur. */
export function EditorSidebar({
  floorName,
  facilityTypes,
  issues,
  session,
  canEdit,
}: {
  floorName: string;
  facilityTypes: readonly FacilityType[];
  issues: ReadonlyMap<string, ValidationIssue[]>;
  session: EditorSession;
  canEdit: boolean;
}) {
  const unlinked = useUnlinked().length;
  return (
    <Tabs defaultValue="features" className="h-full min-h-0 gap-0">
      <TabsList className="px-3">
        <TabsTrigger value="features">Fitur</TabsTrigger>
        <TabsTrigger value="entrances">
          Titik masuk
          {unlinked ? (
            <Badge variant="signal" aria-label={`${unlinked} belum terhubung`}>
              {unlinked}
            </Badge>
          ) : null}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="features" className="min-h-0">
        <FeatureList floorName={floorName} facilityTypes={facilityTypes} issues={issues} />
      </TabsContent>
      <TabsContent value="entrances" className="min-h-0">
        <EntrancesPanel session={session} canEdit={canEdit} />
      </TabsContent>
    </Tabs>
  );
}
