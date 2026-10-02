import {
  type CustomField,
  FIELD_TYPES,
  type FieldDefinition,
  FieldDefinitionIdSchema,
  type FieldType,
  type LocationType,
  type LocationTypeId,
  LocationTypeIdSchema,
  type LocationTypeInput,
  type VenueId,
} from '@indoor/domain';
import { toDataError } from '../errors';
import type { Db } from '../supabase';

export interface LocationTypesRepository {
  /** Tipe lokasi venue beserta field kustomnya, terurut. */
  list(venueId: VenueId): Promise<LocationType[]>;
  save(venueId: VenueId, id: LocationTypeId | null, input: LocationTypeInput): Promise<void>;
  saveField(
    typeId: LocationTypeId,
    id: string | null,
    field: CustomField,
    sortOrder: number,
  ): Promise<void>;
  /** Field dan nilainya di lokasi bertipe itu dihapus bersama (`remove_field_definition`). */
  removeField(id: string): Promise<void>;
  reorderFields(order: readonly { id: string; sortOrder: number }[]): Promise<void>;
  /** Jumlah lokasi bertipe ini yang mengisi field berkunci `key` (konfirmasi hapus). */
  fieldUsage(typeId: LocationTypeId, key: string): Promise<number>;
}

interface FieldRow {
  id: string;
  key: string;
  label: string;
  field_type: string;
  options: unknown;
  is_required: boolean;
  is_visible: boolean;
  is_searchable: boolean;
  sort_order: number;
}

interface TypeRow {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  field_definitions: FieldRow[];
}

export function mapFieldRow(row: FieldRow): FieldDefinition {
  const type = (FIELD_TYPES as readonly string[]).includes(row.field_type)
    ? (row.field_type as FieldType)
    : 'text';
  return {
    id: FieldDefinitionIdSchema.parse(row.id),
    key: row.key,
    label: row.label,
    type,
    options: Array.isArray(row.options)
      ? row.options.filter((o): o is string => typeof o === 'string')
      : [],
    isRequired: row.is_required,
    isVisible: row.is_visible,
    isSearchable: row.is_searchable,
    sortOrder: row.sort_order,
  };
}

export function mapLocationTypeRow(row: TypeRow): LocationType {
  return {
    id: LocationTypeIdSchema.parse(row.id),
    name: row.name,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    fields: row.field_definitions
      .map(mapFieldRow)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'id')),
  };
}

export function toFieldRow(field: CustomField) {
  return {
    key: field.key,
    label: field.label.trim(),
    field_type: field.type,
    options: field.type === 'select' ? field.options.map((o) => o.trim()).filter(Boolean) : [],
    is_required: field.isRequired,
    is_visible: field.isVisible,
    is_searchable: field.isSearchable,
  };
}

export function createLocationTypesRepository(db: Db): LocationTypesRepository {
  return {
    async list(venueId) {
      const { data, error } = await db
        .from('location_types')
        .select(
          'id, name, icon, color, sort_order, field_definitions(id, key, label, field_type, options, is_required, is_visible, is_searchable, sort_order)',
        )
        .eq('venue_id', venueId)
        .order('sort_order')
        .order('created_at');
      if (error) throw toDataError(error);
      return data.map(mapLocationTypeRow);
    },

    async save(venueId, id, input) {
      const row = { name: input.name.trim(), icon: input.icon, color: input.color };
      const { error } = id
        ? await db.from('location_types').update(row).eq('id', id)
        : await db.from('location_types').insert({ ...row, venue_id: venueId });
      if (error) throw toDataError(error);
    },

    async saveField(typeId, id, field, sortOrder) {
      const { key: _key, ...changes } = toFieldRow(field);
      const { error } = id
        ? // Kunci tidak diubah setelah dibuat: nilai tersimpan di lokasi merujuknya.
          await db.from('field_definitions').update(changes).eq('id', id)
        : await db
            .from('field_definitions')
            .insert({ ...toFieldRow(field), location_type_id: typeId, sort_order: sortOrder });
      if (error) throw toDataError(error);
    },

    async removeField(id) {
      const { error } = await db.rpc('remove_field_definition', { p_id: id });
      if (error) throw toDataError(error);
    },

    async reorderFields(order) {
      for (const { id, sortOrder } of order) {
        const { error } = await db
          .from('field_definitions')
          .update({ sort_order: sortOrder })
          .eq('id', id);
        if (error) throw toDataError(error);
      }
    },

    async fieldUsage(typeId, key) {
      const { count, error } = await db
        .from('locations')
        .select('id', { count: 'exact', head: true })
        .eq('location_type_id', typeId)
        .not(`custom_fields->>${key}`, 'is', null);
      if (error) throw toDataError(error);
      return count ?? 0;
    },
  };
}
