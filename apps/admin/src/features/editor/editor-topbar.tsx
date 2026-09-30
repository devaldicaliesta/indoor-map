import type { Building, Floor, FloorId } from '@indoor/domain';
import {
  Button,
  cn,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusDot,
} from '@indoor/ui';
import { useEditorStore } from './store/editor-store';

export const OUTDOOR = 'outdoor';

function SaveIndicator({ onRetry }: { onRetry: () => void }) {
  const status = useEditorStore((s) => s.saveStatus);
  const error = useEditorStore((s) => s.saveError);
  if (status === 'error') {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="text-danger"
        title={error ?? undefined}
        onClick={onRetry}
      >
        <StatusDot tone="danger">Gagal, coba lagi</StatusDot>
      </Button>
    );
  }
  return (
    <span aria-live="polite" className="text-sm">
      {status === 'saving' ? (
        <StatusDot tone="warn" hollow>
          Menyimpan…
        </StatusDot>
      ) : (
        <StatusDot tone="ok">{status === 'saved' ? 'Tersimpan' : 'Draft tersimpan'}</StatusDot>
      )}
    </span>
  );
}

export function EditorTopbar({
  buildings,
  outdoorName,
  buildingValue,
  onBuilding,
  floors,
  floorId,
  onFloor,
  reference,
  validation,
  onRetry,
}: {
  buildings: Building[];
  outdoorName: string;
  buildingValue: string;
  onBuilding: (value: string) => void;
  floors: Floor[];
  floorId: FloorId | null;
  onFloor: (floorId: FloorId) => void;
  reference: React.ReactNode;
  validation: React.ReactNode;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-line border-b px-3 py-2">
      <Select value={buildingValue} onValueChange={onBuilding}>
        <SelectTrigger aria-label="Gedung" className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {buildings.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
          <SelectItem value={OUTDOOR}>{outdoorName}</SelectItem>
        </SelectContent>
      </Select>
      {buildingValue !== OUTDOOR ? (
        <div
          role="radiogroup"
          aria-label="Lantai"
          className="flex overflow-hidden rounded-sm border border-line"
        >
          {/* Urutan bawah → atas, seperti membaca denah potongan gedung dari kiri. */}
          {[...floors].reverse().map((floor) => (
            // biome-ignore lint/a11y/useSemanticElements: tombol segmen lebih mudah diklik daripada radio asli
            <button
              key={floor.id}
              type="button"
              role="radio"
              aria-checked={floor.id === floorId}
              onClick={() => onFloor(floor.id)}
              className={cn(
                'min-w-11 cursor-pointer border-line border-r px-3 py-1.5 font-mono last:border-r-0 hover:bg-canvas',
                floor.id === floorId && 'bg-ink font-bold text-on-strong hover:bg-ink',
              )}
            >
              {floor.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="w-56">{reference}</div>
      <div className="ml-auto flex items-center gap-3">
        {validation}
        <SaveIndicator onRetry={onRetry} />
      </div>
    </div>
  );
}
