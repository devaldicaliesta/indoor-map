import { describe, expect, it } from 'vitest';
import { aliasKey, groupAliasRows } from '../src/repositories/aliases';

describe('alias pencarian', () => {
  it('baris dikelompokkan per sasaran dan diurutkan', () => {
    const groups = groupAliasRows([
      { location_id: 'l1', category_id: null, facility_type_id: null, keyword: 'X-Ray' },
      { location_id: 'l1', category_id: null, facility_type_id: null, keyword: 'rontgen' },
      { location_id: null, category_id: null, facility_type_id: 'f1', keyword: 'WC' },
    ]);
    expect(groups.get(aliasKey({ kind: 'location', id: 'l1' }))).toEqual(['rontgen', 'X-Ray']);
    expect(groups.get('facility_type:f1')).toEqual(['WC']);
  });
});
