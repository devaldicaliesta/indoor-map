import type { ImdfAddress } from './imdf.ts';

export type ImdfAddressProblem =
  | 'address_required'
  | 'locality_required'
  | 'invalid_country'
  | 'invalid_province';

/** Isian formulir alamat: teks mentah dari Admin. */
export interface ImdfAddressDraft {
  address: string;
  locality: string;
  province: string;
  country: string;
  postalCode: string;
}

/** Alamat yang dirapikan (spasi dibuang, kode huruf besar, kosong → `null`) dan masalahnya. */
export function checkImdfAddress(draft: ImdfAddressDraft): {
  value: ImdfAddress;
  problems: ImdfAddressProblem[];
} {
  const value: ImdfAddress = {
    address: draft.address.trim(),
    locality: draft.locality.trim(),
    province: draft.province.trim().toUpperCase() || null,
    country: draft.country.trim().toUpperCase(),
    postalCode: draft.postalCode.trim() || null,
  };
  const problems: ImdfAddressProblem[] = [];
  if (!value.address) problems.push('address_required');
  if (!value.locality) problems.push('locality_required');
  if (!/^[A-Z]{2}$/.test(value.country)) problems.push('invalid_country');
  if (value.province !== null && !/^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(value.province)) {
    problems.push('invalid_province');
  }
  return { value, problems };
}
