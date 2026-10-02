import type { Building, Closure, Connector, Floor } from '@indoor/domain';
import type { RouteGap, RoutePlan } from '@indoor/routing';
import { inVenueTime } from '../../../app/format';

type FailedPlan = Extract<RoutePlan, { ok: false }>;

export interface FailureContext {
  accessible: boolean;
  floors: readonly Floor[];
  buildings: readonly Building[];
  connectors: readonly Connector[];
  closures: readonly Closure[];
  /** Nama sasaran penutupan area (kode unit, nama, atau jenis fitur), bila ada. */
  featureLabel(featureId: string): string | null;
  /** Lantai edge yang ditutup. */
  edgeFloorId(edgeId: string): string | null;
  timezone: string;
}

export interface FailureText {
  title: string;
  details: string[];
}

const list = new Intl.ListFormat('id', { type: 'conjunction' });
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "lantai L2 Gedung Utama", atau nama lapisan Area Luar. */
function floorPhrase(floorId: string, context: FailureContext): string {
  const floor = context.floors.find((f) => f.id === floorId);
  if (!floor) return 'lantai yang sudah dihapus';
  const building = context.buildings.find((b) => b.id === floor.buildingId);
  return building ? `lantai ${floor.name} ${building.name}` : floor.name;
}

/** Nama gedung lantai itu, atau nama Area Luar. */
function placePhrase(floorId: string, context: FailureContext): string {
  const floor = context.floors.find((f) => f.id === floorId);
  const building = context.buildings.find((b) => b.id === floor?.buildingId);
  return building?.name ?? floor?.name ?? 'lantai yang sudah dihapus';
}

const connectorNames = (ids: readonly string[], context: FailureContext) =>
  list.format(ids.map((id) => context.connectors.find((c) => c.id === id)?.name ?? 'konektor'));

function sameBuilding(a: string, b: string, context: FailureContext): boolean {
  const building = (id: string) => context.floors.find((f) => f.id === id)?.buildingId ?? null;
  return building(a) !== null && building(a) === building(b);
}

function floorGap(gap: Extract<RouteGap, { kind: 'floor' }>, context: FailureContext): string[] {
  const { accessible } = context;
  const names = gap.connectorIds.length ? connectorNames(gap.connectorIds, context) : null;
  if (sameBuilding(gap.floorId, gap.fromFloorId, context)) {
    const target = capitalize(floorPhrase(gap.floorId, context));
    const from = floorPhrase(gap.fromFloorId, context);
    if (accessible) {
      return [
        `${target} tidak terhubung lift yang aksesibel.`,
        names
          ? `Konektor yang ada (${names}) tidak bisa dilalui kursi roda.`
          : 'Tambahkan lift dengan alat Konektor.',
      ];
    }
    return names
      ? [`${target} tidak bisa dicapai dari ${from}: ${names} hanya satu arah.`]
      : [
          `${target} belum terhubung ke ${from}.`,
          'Tambahkan lift, eskalator, atau tangga dengan alat Konektor.',
        ];
  }
  const target = placePhrase(gap.floorId, context);
  const from = placePhrase(gap.fromFloorId, context);
  if (accessible) {
    return [
      `${target} tidak terhubung ke ${from} lewat pintu gedung yang aksesibel.`,
      ...(names ? [`Pintu yang ada (${names}) tidak bisa dilalui kursi roda.`] : []),
    ];
  }
  return names
    ? [`${target} tidak bisa dicapai dari ${from} lewat ${names}.`]
    : [`${target} belum terhubung ke ${from}.`, 'Tambahkan pintu gedung dengan alat Konektor.'];
}

function gapDetails(gap: RouteGap | null, context: FailureContext): string[] {
  const accessibly = context.accessible ? ' yang aksesibel' : '';
  if (!gap) return ['Tidak ada jalur yang menghubungkan asal dan tujuan.'];
  switch (gap.kind) {
    case 'origin':
    case 'destination': {
      const end = gap.kind === 'origin' ? 'Asal' : 'Tujuan';
      return gap.floorId
        ? [
            `${end} tidak bisa disambungkan ke jalur: ${floorPhrase(gap.floorId, context)} belum punya jalur${accessibly}.`,
          ]
        : [`Titik masuk ${end.toLowerCase()} tidak ada di graf jalur.`];
    }
    case 'floor':
      return floorGap(gap, context);
    case 'connector': {
      const names = connectorNames(gap.connectorIds, context);
      return [
        `Di ${floorPhrase(gap.floorId, context)}, jalur${accessibly} belum sampai ke ${names} menuju ${floorPhrase(gap.toFloorId, context)}.`,
        'Sambungkan node konektor itu ke jalur dengan alat Jalur.',
      ];
    }
    case 'path':
      return context.accessible
        ? [
            `Di ${floorPhrase(gap.floorId, context)}, tujuan hanya bisa dicapai lewat jalur yang tidak aksesibel.`,
          ]
        : [
            `Di ${floorPhrase(gap.floorId, context)}, jalur dari asal tidak tersambung ke tujuan.`,
            'Periksa node terisolasi di lantai itu.',
          ];
  }
}

/** "Lift 1 ditutup (Perawatan), sampai 1 Okt 2026 17.00 WIB." */
export function closureText(id: string, context: FailureContext): string {
  const closure = context.closures.find((c) => c.id === id);
  if (!closure) return 'Penutupan sementara yang sedang berlaku.';
  let target = 'Jalur';
  if (closure.connectorId) {
    target = context.connectors.find((c) => c.id === closure.connectorId)?.name ?? 'Konektor';
  } else if (closure.featureId) {
    target = context.featureLabel(closure.featureId) ?? 'Area';
  } else if (closure.edgeId) {
    const floorId = context.edgeFloorId(closure.edgeId);
    if (floorId) target = `Jalur di ${floorPhrase(floorId, context)}`;
  }
  const until = closure.endsAt
    ? `sampai ${inVenueTime(closure.endsAt, context.timezone)}`
    : 'tanpa waktu selesai';
  return `${target} ditutup (${closure.reason}), ${until}.`;
}

/**
 * Judul dan penjelasan kegagalan uji rute dengan bahasa yang bisa ditindaklanjuti: penutupan
 * yang menghalangi, atau letak jaringan jalur yang terputus.
 */
export function failureText(plan: FailedPlan, context: FailureContext): FailureText {
  switch (plan.reason) {
    case 'origin_unknown':
      return {
        title: 'Asal tidak ditemukan',
        details: ['Tempat asal sudah tidak ada di draft. Pilih asal lain.'],
      };
    case 'destination_unknown':
      return {
        title: 'Tujuan tidak ditemukan',
        details: ['Tempat tujuan sudah tidak ada di draft. Pilih tujuan lain.'],
      };
    case 'closed':
      return {
        title: 'Rute tertutup sementara',
        details: plan.blockingClosureIds.map((id) => closureText(id, context)),
      };
    case 'accessible_blocked':
      if (plan.blockingClosureIds.length) {
        return {
          title: 'Rute kursi roda tertutup sementara',
          details: [
            ...plan.blockingClosureIds.map((id) => closureText(id, context)),
            'Tanpa mode kursi roda rute tetap tersedia.',
          ],
        };
      }
      return { title: 'Rute kursi roda tidak tersedia', details: gapDetails(plan.gap, context) };
    default:
      return {
        title: 'Tidak ada rute',
        details: gapDetails(plan.gap, { ...context, accessible: false }),
      };
  }
}
