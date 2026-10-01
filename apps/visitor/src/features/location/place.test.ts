import { buildSnapshot, createSnapshotLookup } from '@indoor/domain';
import { BROWSE_IDS, browseSnapshotSource } from '@indoor/domain/fixtures/browse-source.ts';
import { IDS } from '@indoor/domain/fixtures/snapshot-source.ts';
import { describe, expect, it } from 'vitest';
import { floorText, locationKindText, locationPlaceText, locationSummary } from './place';

const lookup = createSnapshotLookup(buildSnapshot(browseSnapshotSource()));
const location = (id: string) => {
  const found = lookup.locations.get(id);
  if (!found) throw new Error(`lokasi ${id} tidak ada di fixture`);
  return found;
};

describe('teks tempat di Visitor', () => {
  it('gedung · lantai, atau Area Luar saja', () => {
    const outdoor = lookup.snapshot.floors.find((f) => f.isOutdoor)?.id ?? '';
    const eastGf = lookup.snapshot.floors.find((f) => f.name === 'GF' && f.buildingId)?.id ?? '';
    expect(floorText(lookup, outdoor)).toBe('Area Luar');
    expect(floorText(lookup, eastGf)).toMatch(/^Gedung .+ · GF$/);
    expect(floorText(lookup, 'tidak-ada')).toBe('');
  });

  it('lantai lokasi, lantai unit utama lebih dulu', () => {
    expect(locationPlaceText(lookup, BROWSE_IDS.infoDesk)).toBe('Gedung Utama · L1, GF');
    expect(locationPlaceText(lookup, BROWSE_IDS.pond)).toBe('Area Luar');
    expect(locationPlaceText(lookup, IDS.lab)).toBeNull();
  });

  it('tipe · kategori dan ringkasan baris daftar', () => {
    expect(locationKindText(lookup, location(IDS.radiology))).toBe('Layanan · Pemeriksaan');
    expect(locationKindText(lookup, location(BROWSE_IDS.infoDesk))).toBe('Layanan');
    expect(locationSummary(lookup, location(IDS.radiology))).toBe(
      'Pemeriksaan · Gedung Utama · GF',
    );
    expect(locationSummary(lookup, location(IDS.lab))).toBe('Pemeriksaan');
  });
});
