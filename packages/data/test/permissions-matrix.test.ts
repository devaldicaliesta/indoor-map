import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ACCESS_SUBJECTS,
  type AccessSubject,
  type AccessTable,
  TABLE_ACCESS,
  TABLE_OPERATIONS,
  tableAllows,
} from '@indoor/domain';
import { describe, expect, it } from 'vitest';

// `supabase/tests/permissions_matrix.test.sql` dibangkitkan dari `TABLE_ACCESS`. Setelah
// mengubah matriks: `UPDATE_MATRIX=1 pnpm --filter @indoor/data test permissions-matrix`.
const target = fileURLToPath(
  new URL('../../../supabase/tests/permissions_matrix.test.sql', import.meta.url),
);

const USERS: Record<Exclude<AccessSubject, 'anon'>, string> = {
  super_admin: 'f0000000-0000-4000-8000-000000000001',
  admin: 'f0000000-0000-4000-8000-000000000002',
  editor: 'f0000000-0000-4000-8000-000000000003',
  operator: 'f0000000-0000-4000-8000-000000000004',
  viewer: 'f0000000-0000-4000-8000-000000000005',
};
const LOCK_OWNER = 'f0000000-0000-4000-8000-000000000006';
const id = (n: number) => `f1000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
const VENUE = id(1);

/** Baris fixture setiap tabel; kolom untuk update tanpa efek (`set kolom = kolom`). */
const FIXTURE: Record<AccessTable, { where: string; column: string }> = {
  venues: { where: `id = '${VENUE}'`, column: 'id' },
  buildings: { where: `id = '${id(2)}'`, column: 'id' },
  floors: { where: `id = '${id(3)}'`, column: 'id' },
  floor_plans: { where: `id = '${id(5)}'`, column: 'id' },
  display_settings: { where: `venue_id = '${VENUE}'`, column: 'venue_id' },
  facility_types: { where: `id = '${id(6)}'`, column: 'id' },
  instruction_templates: {
    where: `venue_id = '${VENUE}' and action = 'arrive'`,
    column: 'venue_id',
  },
  features: { where: `id = '${id(7)}'`, column: 'id' },
  nav_nodes: { where: `id = '${id(8)}'`, column: 'id' },
  nav_edges: { where: `id = '${id(10)}'`, column: 'id' },
  connectors: { where: `id = '${id(11)}'`, column: 'id' },
  connector_stops: { where: `connector_id = '${id(11)}'`, column: 'connector_id' },
  info_points: { where: `id = '${id(12)}'`, column: 'id' },
  location_types: { where: `id = '${id(13)}'`, column: 'id' },
  field_definitions: { where: `id = '${id(14)}'`, column: 'id' },
  categories: { where: `id = '${id(15)}'`, column: 'id' },
  locations: { where: `id = '${id(16)}'`, column: 'id' },
  location_units: { where: `location_id = '${id(16)}'`, column: 'location_id' },
  location_categories: { where: `location_id = '${id(16)}'`, column: 'location_id' },
  opening_hours: { where: `location_id = '${id(16)}'`, column: 'id' },
  search_aliases: { where: `id = '${id(17)}'`, column: 'id' },
  origin_points: { where: `id = '${id(18)}'`, column: 'id' },
  closures: { where: `id = '${id(19)}'`, column: 'id' },
  edit_locks: { where: `floor_id = '${id(4)}'`, column: 'floor_id' },
  publications: { where: `id = '${id(20)}'`, column: 'id' },
  profiles: { where: `user_id = '${LOCK_OWNER}'`, column: 'user_id' },
  audit_events: { where: `details @> '{"matrix": true}'`, column: 'action' },
  system_settings: { where: 'true', column: 'id' },
  installation: { where: 'true', column: 'id' },
  licenses: { where: `id = '${id(22)}'`, column: 'id' },
};

const point = (x: number) => `extensions.st_setsrid(extensions.st_makepoint(${x}, -6.2), 4326)`;

const SETUP = `insert into auth.users (id, email) values
${[...Object.entries(USERS), ['lock_owner', LOCK_OWNER]]
  .map(([role, user]) => `  ('${user}', '${role}@matrix.test')`)
  .join(',\n')};
insert into public.profiles (user_id, full_name, email, role) values
${Object.entries(USERS)
  .map(([role, user]) => `  ('${user}', '${role}', '${role}@matrix.test', '${role}')`)
  .join(',\n')},
  ('${LOCK_OWNER}', 'Pemegang kunci', 'lock_owner@matrix.test', 'editor');

insert into public.venues (id, name) values ('${VENUE}', 'Venue Matriks');
insert into public.buildings (id, venue_id, name, code) values ('${id(2)}', '${VENUE}', 'Gedung', 'G');
insert into public.floors (id, venue_id, building_id, name, level) values
  ('${id(3)}', '${VENUE}', '${id(2)}', 'L1', 1),
  ('${id(4)}', '${VENUE}', '${id(2)}', 'L2', 2);
insert into public.floor_plans (id, floor_id, source_path, source_format)
  values ('${id(5)}', '${id(3)}', 'denah.png', 'png');
insert into public.facility_types (id, venue_id, name) values ('${id(6)}', '${VENUE}', 'Jenis Matriks');
insert into public.instruction_templates (venue_id, action, text_id)
  values ('${VENUE}', 'arrive', 'Tiba') on conflict do nothing;
insert into public.features (id, venue_id, floor_id, kind, unit_code, geom) values
  ('${id(7)}', '${VENUE}', '${id(3)}', 'unit', 'MTX-1', extensions.st_setsrid(extensions.st_geomfromtext(
    'POLYGON((106.8 -6.2, 106.8001 -6.2, 106.8001 -6.2001, 106.8 -6.2001, 106.8 -6.2))'), 4326));
insert into public.nav_nodes (id, venue_id, floor_id, geom) values
  ('${id(8)}', '${VENUE}', '${id(3)}', ${point(106.8)}),
  ('${id(9)}', '${VENUE}', '${id(3)}', ${point(106.80001)});
insert into public.nav_edges (id, venue_id, floor_id, from_node_id, to_node_id, length_m)
  values ('${id(10)}', '${VENUE}', '${id(3)}', '${id(8)}', '${id(9)}', 1);
insert into public.connectors (id, venue_id, kind, name, is_accessible)
  values ('${id(11)}', '${VENUE}', 'stairs', 'Tangga', false);
insert into public.connector_stops (connector_id, floor_id, node_id) values ('${id(11)}', '${id(3)}', '${id(8)}');
insert into public.info_points (id, venue_id, floor_id, code, name, geom)
  values ('${id(12)}', '${VENUE}', '${id(3)}', 'MATRIX-IP', 'Info Point', ${point(106.8)});
insert into public.location_types (id, venue_id, name) values ('${id(13)}', '${VENUE}', 'Tipe Matriks');
insert into public.field_definitions (id, location_type_id, key, label, field_type)
  values ('${id(14)}', '${id(13)}', 'catatan', 'Catatan', 'text');
insert into public.categories (id, location_type_id, name) values ('${id(15)}', '${id(13)}', 'Kategori');
insert into public.locations (id, venue_id, location_type_id, name)
  values ('${id(16)}', '${VENUE}', '${id(13)}', 'Lokasi Matriks');
insert into public.location_units (location_id, feature_id) values ('${id(16)}', '${id(7)}');
insert into public.location_categories (location_id, category_id) values ('${id(16)}', '${id(15)}');
insert into public.opening_hours (location_id, weekday, is_closed) values ('${id(16)}', 1, true);
insert into public.search_aliases (id, venue_id, keyword, location_id)
  values ('${id(17)}', '${VENUE}', 'alias', '${id(16)}');
insert into public.origin_points (id, venue_id, floor_id, name, geom)
  values ('${id(18)}', '${VENUE}', '${id(3)}', 'Lobi', ${point(106.8)});
insert into public.closures (id, venue_id, connector_id, reason, starts_at)
  values ('${id(19)}', '${VENUE}', '${id(11)}', 'Perbaikan', now() - interval '1 hour');
insert into public.edit_locks (floor_id, user_id) values ('${id(4)}', '${LOCK_OWNER}');
insert into public.publications (id, venue_id, version, snapshot_path, is_active)
  values ('${id(20)}', '${VENUE}', 1, '${VENUE}/v1.json', true);
insert into public.audit_events (action, entity, details) values ('publish', 'venue', '{"matrix": true}');
-- Bukan lisensi berlaku (instalasi sudah punya satu dari seed); hanya baris untuk diuji.
insert into public.licenses (id, license_id, payload, signature, status, source, is_current)
  values ('${id(22)}', 'MATRIX', '{}', 'x', 'active', 'manual', false);

-- Uji insert menyalin baris fixture dengan id baru.
create function pg_temp.attempt(p_op text, p_table text, p_where text, p_column text)
returns text
language plpgsql as $$
declare
  v_rows integer := 0;
  v_columns text;
begin
  begin
    if p_op = 'select' then
      execute format('select count(*) from public.%I where %s', p_table, p_where) into v_rows;
    elsif p_op = 'update' then
      execute format(
        'with c as (update public.%I set %I = %I where %s returning 1) select count(*) from c',
        p_table, p_column, p_column, p_where) into v_rows;
    elsif p_op = 'delete' then
      execute format(
        'with c as (delete from public.%I where %s returning 1) select count(*) from c',
        p_table, p_where) into v_rows;
    elsif p_table = 'edit_locks' then
      -- Pengedit hanya boleh mengunci lantai untuk dirinya sendiri.
      insert into public.edit_locks (floor_id, user_id) values ('${id(3)}', app.current_user_id());
      v_rows := 1;
    else
      -- Kolom identitas/terbangkitkan dibiarkan diisi database.
      select string_agg(quote_ident(c.column_name), ', ' order by c.ordinal_position) into v_columns
      from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = p_table
        and c.is_generated = 'NEVER' and coalesce(c.identity_generation, '') <> 'ALWAYS';
      execute format('insert into public.%I (%s) select %s from pg_temp.fixture_%s',
        p_table, v_columns, v_columns, p_table);
      v_rows := 1;
    end if;
    -- Membatalkan perubahan: hanya jumlah baris yang dibawa keluar.
    raise exception using errcode = 'P0099';
  exception
    when sqlstate 'P0099' then
      return case when v_rows > 0 then 'boleh' else 'ditolak' end;
    -- Pelanggaran unik atau FK diperiksa setelah RLS: barisnya sudah lolos.
    when unique_violation or foreign_key_violation then
      return 'boleh';
    when insufficient_privilege then
      return 'ditolak';
    -- Trigger BEFORE yang menolak (mis. tidak bisa membaca venue) juga menolak penulisan.
    when others then
      return case when p_op = 'insert' then 'ditolak' else 'galat ' || sqlstate end;
  end;
end
$$;
`;

const subjectSetup = (subject: AccessSubject) =>
  subject === 'anon'
    ? `set local role anon;\nselect set_config('request.jwt.claims', '', true);`
    : `set local role authenticated;\nselect set_config('request.jwt.claims', '{"sub":"${USERS[subject]}","role":"authenticated"}', true);`;

function generate(): string {
  const tables = Object.keys(TABLE_ACCESS) as AccessTable[];
  const fixtures = tables
    .map(
      (t) =>
        `create temp table fixture_${t} as select * from public.${t} where ${FIXTURE[t].where};`,
    )
    .join('\n');
  const assertions: string[] = [];
  for (const subject of ACCESS_SUBJECTS) {
    assertions.push(`\n-- ${subject}\n${subjectSetup(subject)}`);
    for (const table of tables) {
      for (const op of TABLE_OPERATIONS) {
        const expected = tableAllows(subject, table, op) ? 'boleh' : 'ditolak';
        const { where, column } = FIXTURE[table];
        assertions.push(
          `select is(pg_temp.attempt('${op}', '${table}', $w$${where}$w$, '${column}'), '${expected}', '${subject} ${op} ${table}');`,
        );
      }
    }
    assertions.push('reset role;');
  }
  const count = ACCESS_SUBJECTS.length * tables.length * TABLE_OPERATIONS.length;
  return `-- DIBANGKITKAN dari packages/domain/src/table-access.ts oleh
-- packages/data/test/permissions-matrix.test.ts. Jangan diedit langsung.
-- Matriks role × tabel × operasi (T-312): setiap percobaan dibatalkan di subtransaksi.
begin;
create extension if not exists pgtap with schema extensions;

select plan(${count});

${SETUP}
${fixtures}
do $$
declare
  t record;
begin
  for t in
    select c.table_name from information_schema.columns c
    where c.table_schema like 'pg_temp%' and c.column_name = 'id' and c.data_type = 'uuid'
  loop
    execute format('update pg_temp.%I set id = gen_random_uuid()', t.table_name);
  end loop;
end
$$;
grant select on all tables in schema pg_temp to authenticated, anon;
${assertions.join('\n')}

select * from finish();
rollback;
`;
}

describe('matriks akses tabel', () => {
  it('Viewer dan anon tidak bisa mengubah tabel apa pun', () => {
    for (const subject of ['viewer', 'anon'] as const) {
      for (const table of Object.keys(TABLE_ACCESS) as AccessTable[]) {
        for (const op of ['insert', 'update', 'delete'] as const) {
          expect(tableAllows(subject, table, op), `${subject} ${op} ${table}`).toBe(false);
        }
      }
    }
  });

  it('Operator hanya mengubah penutupan', () => {
    const writable = (Object.keys(TABLE_ACCESS) as AccessTable[]).filter((t) =>
      tableAllows('operator', t, 'update'),
    );
    expect(writable).toEqual(['closures']);
  });

  it('permissions_matrix.test.sql sesuai matriks', () => {
    const sql = generate();
    if (process.env.UPDATE_MATRIX) writeFileSync(target, sql);
    expect(readFileSync(target, 'utf8')).toBe(sql);
  });
});
