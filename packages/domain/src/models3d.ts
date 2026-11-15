export const MODEL_LIBRARY = [
  'stairs',
  'elevator',
  'escalator',
  'taxi',
  'car',
  'bus-stop',
  'tree',
  'plant',
  'pot',
  'bench',
  'table',
  'kiosk',
  'sign',
] as const;
export type LibraryModel = (typeof MODEL_LIBRARY)[number];

export const MODEL_LABELS: Record<LibraryModel, string> = {
  stairs: 'Tangga',
  elevator: 'Lift',
  escalator: 'Eskalator',
  taxi: 'Taksi',
  car: 'Mobil',
  'bus-stop': 'Halte',
  tree: 'Pohon',
  plant: 'Tanaman',
  pot: 'Pot bunga',
  bench: 'Bangku',
  table: 'Meja',
  kiosk: 'Kios',
  sign: 'Papan tanda',
};

export type ModelRef = { kind: 'builtin'; key: LibraryModel } | { kind: 'upload'; path: string };

const BUILTIN = 'builtin:';
const UPLOAD_PATH = /^models\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}\.glb$/;

export function parseModelRef(value: unknown): ModelRef | null {
  if (typeof value !== 'string') return null;
  if (value.startsWith(BUILTIN)) {
    const key = value.slice(BUILTIN.length);
    return (MODEL_LIBRARY as readonly string[]).includes(key)
      ? { kind: 'builtin', key: key as LibraryModel }
      : null;
  }
  return UPLOAD_PATH.test(value) ? { kind: 'upload', path: value } : null;
}

export const modelRefValue = (ref: ModelRef): string =>
  ref.kind === 'builtin' ? `${BUILTIN}${ref.key}` : ref.path;

export const MODEL_SCALE = { min: 0.1, max: 20, default: 1 } as const;
export const MODEL_BASE_HEIGHT = { min: 0, max: 200, default: 0 } as const;

export interface ModelPlacement {
  model: string;
  modelScale?: number;
  modelRotation?: number;
  baseHeight?: number;
}

export type ModelPlacementProblem = 'model' | 'scale' | 'rotation' | 'base_height';

const inRange = (value: number | undefined, min: number, max: number) =>
  value === undefined || (Number.isFinite(value) && value >= min && value <= max);

export function checkModelPlacement(placement: ModelPlacement): ModelPlacementProblem[] {
  const problems: ModelPlacementProblem[] = [];
  if (!parseModelRef(placement.model)) problems.push('model');
  if (!inRange(placement.modelScale, MODEL_SCALE.min, MODEL_SCALE.max)) problems.push('scale');
  if (!inRange(placement.modelRotation, 0, 360)) problems.push('rotation');
  if (!inRange(placement.baseHeight, MODEL_BASE_HEIGHT.min, MODEL_BASE_HEIGHT.max)) {
    problems.push('base_height');
  }
  return problems;
}

export const normalizeRotation = (degrees: number): number => {
  const value = Math.round((((degrees % 360) + 360) % 360) * 10) / 10;
  return value === 360 ? 0 : value;
};

export const MAX_GLB_BYTES = 5 * 1024 * 1024;
export const GLB_MIME = 'model/gltf-binary';

export type GlbProblem = 'empty' | 'too_large' | 'not_glb' | 'version' | 'corrupt';

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const HEADER_BYTES = 12;

function latin1(bytes: Uint8Array): string {
  let text = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return text;
}

export function checkGlb(bytes: ArrayBuffer): GlbProblem | null {
  if (bytes.byteLength === 0) return 'empty';
  if (bytes.byteLength > MAX_GLB_BYTES) return 'too_large';
  if (bytes.byteLength < HEADER_BYTES + 8) return 'not_glb';
  const view = new DataView(bytes);
  if (view.getUint32(0, true) !== GLB_MAGIC) return 'not_glb';
  if (view.getUint32(4, true) !== 2) return 'version';
  if (view.getUint32(8, true) !== bytes.byteLength) return 'corrupt';
  const jsonLength = view.getUint32(HEADER_BYTES, true);
  if (view.getUint32(HEADER_BYTES + 4, true) !== CHUNK_JSON) return 'corrupt';
  const jsonEnd = HEADER_BYTES + 8 + jsonLength;
  if (jsonLength === 0 || jsonEnd > bytes.byteLength) return 'corrupt';
  try {
    const text = latin1(new Uint8Array(bytes, HEADER_BYTES + 8, jsonLength));
    const json = JSON.parse(text) as { asset?: { version?: unknown } };
    if (json.asset?.version !== '2.0') return 'version';
  } catch {
    return 'corrupt';
  }
  return null;
}

export const GLB_PROBLEM_MESSAGES: Record<GlbProblem, string> = {
  empty: 'Berkas model kosong.',
  too_large: 'Model terlalu besar. Maksimal 5 MB.',
  not_glb: 'Berkas bukan model GLB (glTF biner).',
  version: 'Hanya glTF 2.0 yang didukung.',
  corrupt: 'Berkas GLB rusak atau tidak lengkap.',
};
