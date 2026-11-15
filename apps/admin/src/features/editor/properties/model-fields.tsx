import type { FloorFeature } from '@indoor/data';
import {
  MODEL_BASE_HEIGHT,
  MODEL_LABELS,
  MODEL_LIBRARY,
  MODEL_SCALE,
  modelRefValue,
  normalizeRotation,
  parseModelRef,
  type VenueId,
} from '@indoor/domain';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  toast,
} from '@indoor/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { data } from '../../../app/data-client';
import type { EditorSession } from '../use-editor-session';
import { CommitInput } from './commit-input';

const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2, useGrouping: false });
const modelsKey = (venueId: VenueId) => ['models3d', venueId] as const;

function parseNumber(input: string, min: number, max: number): number | null | 'invalid' {
  const text = input.trim().replace(',', '.');
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value < min || value > max) return 'invalid';
  return Math.round(value * 100) / 100;
}

function NumberField({
  id,
  label,
  hint,
  value,
  placeholder,
  disabled,
  onCommit,
}: {
  id: string;
  label: string;
  hint: string;
  value: number | undefined;
  placeholder: string;
  disabled: boolean;
  onCommit: (value: string) => string | null;
}) {
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-ink-muted text-sm">{hint}</span>
      </div>
      <CommitInput
        key={`${id}-${value ?? ''}`}
        id={id}
        errorId={`${id}-error`}
        inputMode="decimal"
        className="font-mono tabular-nums"
        placeholder={placeholder}
        value={value === undefined ? '' : number.format(value)}
        disabled={disabled}
        onCommit={onCommit}
      />
    </div>
  );
}

export function ModelFields({
  feature,
  session,
  canEdit,
}: {
  feature: FloorFeature;
  session: EditorSession;
  canEdit: boolean;
}) {
  const p = feature.properties;
  const venueId = session.venueId;
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const uploads = useQuery({
    queryKey: modelsKey(venueId),
    queryFn: () => data.models3d.list(venueId),
  });
  const upload = useMutation({
    mutationFn: (file: File) => data.models3d.upload(venueId, file),
    onSuccess: (path) => {
      void queryClient.invalidateQueries({ queryKey: modelsKey(venueId) });
      session.update(p.id, { model: path });
      toast.success('Model diunggah', { description: path.split('/').pop() });
    },
    onError: (error) => toast.error('Model tidak diunggah', { description: error.message }),
  });

  const ref = parseModelRef(p.model);
  const current = ref ? modelRefValue(ref) : undefined;
  const uploaded = uploads.data ?? [];
  const missingUpload =
    ref?.kind === 'upload' && !uploaded.some((model) => model.path === ref.path)
      ? [{ path: ref.path, name: ref.path.split('/').pop() ?? ref.path }]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <Label htmlFor="feature-model">Model 3D</Label>
        <Select
          {...(current ? { value: current } : {})}
          disabled={!canEdit}
          onValueChange={(model) => session.update(p.id, { model })}
        >
          <SelectTrigger id="feature-model">
            <SelectValue placeholder="Pilih model" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Pustaka bawaan</SelectLabel>
              {MODEL_LIBRARY.map((key) => (
                <SelectItem key={key} value={`builtin:${key}`}>
                  {MODEL_LABELS[key]}
                </SelectItem>
              ))}
            </SelectGroup>
            {uploaded.length + missingUpload.length > 0 ? (
              <SelectGroup>
                <SelectLabel>Unggahan venue</SelectLabel>
                {[...missingUpload, ...uploaded].map((model) => (
                  <SelectItem key={model.path} value={model.path}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null}
          </SelectContent>
        </Select>
        {canEdit ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={upload.isPending}
              onClick={() => fileInput.current?.click()}
            >
              {upload.isPending ? 'Mengunggah…' : 'Unggah GLB'}
            </Button>
            <span className="text-ink-muted text-sm">glTF 2.0 biner, maks. 5 MB</span>
            <input
              ref={fileInput}
              type="file"
              accept=".glb,model/gltf-binary"
              aria-label="Berkas model GLB"
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) upload.mutate(file);
              }}
            />
          </div>
        ) : null}
      </div>
      <NumberField
        id="model-scale"
        label="Skala"
        hint={`${number.format(MODEL_SCALE.min)}–${MODEL_SCALE.max}×`}
        value={p.modelScale}
        placeholder="1 (bawaan)"
        disabled={!canEdit}
        onCommit={(value) => {
          const scale = parseNumber(value, MODEL_SCALE.min, MODEL_SCALE.max);
          if (scale === 'invalid') return 'Skala antara 0,1 dan 20.';
          session.update(p.id, { modelScale: scale === null || scale === 1 ? undefined : scale });
          return null;
        }}
      />
      <NumberField
        id="model-rotation"
        label="Rotasi (°)"
        hint="searah jarum jam dari utara"
        value={p.modelRotation}
        placeholder="0"
        disabled={!canEdit}
        onCommit={(value) => {
          const degrees = parseNumber(value, -3600, 3600);
          if (degrees === 'invalid') return 'Isi sudut dalam derajat, misalnya 90.';
          const rotation = degrees === null ? 0 : normalizeRotation(degrees);
          session.update(p.id, { modelRotation: rotation === 0 ? undefined : rotation });
          return null;
        }}
      />
      <NumberField
        id="model-base-height"
        label="Tinggi dasar (m)"
        hint="dari lantai"
        value={p.baseHeight}
        placeholder="0"
        disabled={!canEdit}
        onCommit={(value) => {
          const height = parseNumber(value, MODEL_BASE_HEIGHT.min, MODEL_BASE_HEIGHT.max);
          if (height === 'invalid') return 'Tinggi dasar antara 0 dan 200 m.';
          session.update(p.id, {
            baseHeight: height === null || height === 0 ? undefined : height,
          });
          return null;
        }}
      />
    </div>
  );
}
