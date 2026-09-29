import { z } from 'zod';

/**
 * ID bermerek: semua ID berupa UUID di database, tetapi mereknya mencegah
 * `FloorId` tertukar dengan `VenueId` saat dikirim ke fungsi.
 */
const uuid = z.uuid();

export const VenueIdSchema = uuid.brand<'VenueId'>();
export const BuildingIdSchema = uuid.brand<'BuildingId'>();
export const FloorIdSchema = uuid.brand<'FloorId'>();
export const FloorPlanIdSchema = uuid.brand<'FloorPlanId'>();
export const FeatureIdSchema = uuid.brand<'FeatureId'>();
export const FacilityTypeIdSchema = uuid.brand<'FacilityTypeId'>();
export const NavNodeIdSchema = uuid.brand<'NavNodeId'>();
export const NavEdgeIdSchema = uuid.brand<'NavEdgeId'>();
export const ConnectorIdSchema = uuid.brand<'ConnectorId'>();
export const ClosureIdSchema = uuid.brand<'ClosureId'>();
export const LocationTypeIdSchema = uuid.brand<'LocationTypeId'>();
export const FieldDefinitionIdSchema = uuid.brand<'FieldDefinitionId'>();
export const CategoryIdSchema = uuid.brand<'CategoryId'>();
export const LocationIdSchema = uuid.brand<'LocationId'>();
export const OriginPointIdSchema = uuid.brand<'OriginPointId'>();
export const InfoPointIdSchema = uuid.brand<'InfoPointId'>();
export const PublicationIdSchema = uuid.brand<'PublicationId'>();
export const UserIdSchema = uuid.brand<'UserId'>();

export type VenueId = z.infer<typeof VenueIdSchema>;
export type BuildingId = z.infer<typeof BuildingIdSchema>;
export type FloorId = z.infer<typeof FloorIdSchema>;
export type FloorPlanId = z.infer<typeof FloorPlanIdSchema>;
export type FeatureId = z.infer<typeof FeatureIdSchema>;
export type FacilityTypeId = z.infer<typeof FacilityTypeIdSchema>;
export type NavNodeId = z.infer<typeof NavNodeIdSchema>;
export type NavEdgeId = z.infer<typeof NavEdgeIdSchema>;
export type ConnectorId = z.infer<typeof ConnectorIdSchema>;
export type ClosureId = z.infer<typeof ClosureIdSchema>;
export type LocationTypeId = z.infer<typeof LocationTypeIdSchema>;
export type FieldDefinitionId = z.infer<typeof FieldDefinitionIdSchema>;
export type CategoryId = z.infer<typeof CategoryIdSchema>;
export type LocationId = z.infer<typeof LocationIdSchema>;
export type OriginPointId = z.infer<typeof OriginPointIdSchema>;
export type InfoPointId = z.infer<typeof InfoPointIdSchema>;
export type PublicationId = z.infer<typeof PublicationIdSchema>;
export type UserId = z.infer<typeof UserIdSchema>;
