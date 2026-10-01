import {
  type ImageFileProblem,
  type LocationCodeProblem,
  type LocationInputProblems,
  type LocationStatus,
  type LocationUnit,
  type NameProblem,
  orderedUnits,
  type UnitStatus,
} from '@indoor/domain';

export const LOCATION_STATUS_LABELS: Record<LocationStatus, string> = {
  active: 'Aktif',
  coming_soon: 'Segera buka',
  inactive_temporary: 'Nonaktif sementara',
  inactive_permanent: 'Nonaktif permanen',
};

export const LOCATION_STATUS_TONE: Record<
  LocationStatus,
  { tone: 'ok' | 'warn' | 'neutral'; hollow: boolean }
> = {
  active: { tone: 'ok', hollow: false },
  coming_soon: { tone: 'warn', hollow: true },
  inactive_temporary: { tone: 'neutral', hollow: false },
  inactive_permanent: { tone: 'neutral', hollow: true },
};

export const UNIT_STATUS_TEXT: Record<UnitStatus, string> = {
  occupied: 'Terisi',
  vacant: 'Kosong',
  renovation: 'Renovasi',
};

export const NAME_MESSAGES: Record<NonNullable<LocationInputProblems['name']>, string> = {
  required: 'Nama lokasi wajib diisi.',
  too_long: 'Nama lokasi maksimal 120 karakter.',
};

export function codeMessage(problem: LocationCodeProblem): string {
  switch (problem.problem) {
    case 'too_long':
      return 'Kode lokasi maksimal 32 karakter.';
    case 'format':
      return 'Kode lokasi hanya boleh huruf, angka, dan . _ / -, diawali huruf atau angka.';
    case 'duplicate':
      return `Kode ini sudah dipakai lokasi "${problem.owner}".`;
  }
}

export const CATEGORY_NAME_MESSAGES: Record<NameProblem, string> = {
  required: 'Nama kategori wajib diisi.',
  too_long: 'Nama kategori maksimal 60 karakter.',
  duplicate: 'Nama ini sudah dipakai kategori lain.',
};

export const IMAGE_MESSAGES: Record<ImageFileProblem, string> = {
  empty: 'Berkas gambar kosong.',
  too_large: 'Gambar terlalu besar. Maksimal 5 MB.',
  unsupported_type: 'Gambar harus berupa PNG, JPG, atau WebP.',
};

/** Nama gedung (atau Area Luar) unit, tanpa pengulangan, unit utama dulu. */
export function buildingNames(units: readonly LocationUnit[], outdoorName: string): string[] {
  return [...new Set(orderedUnits(units).map((u) => u.buildingName ?? outdoorName))];
}

export function floorNames(units: readonly LocationUnit[]): string[] {
  return [...new Set(orderedUnits(units).map((u) => u.floorName))];
}

/** "Gedung Utama · L1", untuk baris unit di formulir dan pemilih unit. */
export function placeText(
  unit: { buildingName: string | null; floorName: string },
  outdoorName: string,
): string {
  return unit.buildingName ? `${unit.buildingName} · ${unit.floorName}` : outdoorName;
}
