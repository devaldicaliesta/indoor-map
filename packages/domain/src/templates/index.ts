import type { VenueType } from '../venue';
import { airportStation } from './airport_station';
import { campus } from './campus';
import { custom } from './custom';
import { factoryWarehouse } from './factory_warehouse';
import { hospital } from './hospital';
import { office } from './office';
import { shoppingCenter } from './shopping_center';
import type { VenueTemplate } from './template';

export {
  COMMON_FACILITY_TYPES,
  type TemplateAlias,
  type TemplateCategory,
  type TemplateFacilityType,
  type TemplateLocationType,
  templateSummary,
  type VenueTemplate,
  VenueTemplateSchema,
} from './template';

/** Template per tipe venue, urutan tampil di wizard ("Lainnya" terakhir). */
export const VENUE_TEMPLATES: Record<VenueType, VenueTemplate> = {
  hospital,
  campus,
  office,
  airport_station: airportStation,
  factory_warehouse: factoryWarehouse,
  shopping_center: shoppingCenter,
  custom,
};
