import type { LocationImages } from '@indoor/data';
import type {
  CategoryId,
  CategoryInput,
  CustomField,
  LocationId,
  LocationInput,
  LocationTypeId,
  LocationTypeInput,
  VenueId,
} from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';

const keys = {
  types: (venueId: VenueId) => ['location-types', venueId] as const,
  locations: (venueId: VenueId) => ['locations', venueId] as const,
  categories: (venueId: VenueId) => ['categories', venueId] as const,
  units: (venueId: VenueId) => ['venue-units', venueId] as const,
  forUnit: (featureId: string) => ['unit-locations', featureId] as const,
};

/** Tipe lokasi venue beserta field kustomnya, terurut. */
export function useLocationTypes(venueId: VenueId) {
  return useQuery({
    queryKey: keys.types(venueId),
    queryFn: () => data.locationTypes.list(venueId),
  });
}

function useRefreshTypes(venueId: VenueId) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.types(venueId) }),
      queryClient.invalidateQueries({ queryKey: keys.locations(venueId) }),
    ]);
}

export function useSaveLocationType(venueId: VenueId) {
  const refresh = useRefreshTypes(venueId);
  return useMutation({
    mutationFn: ({ id, input }: { id: LocationTypeId | null; input: LocationTypeInput }) =>
      data.locationTypes.save(venueId, id, input),
    onSuccess: refresh,
  });
}

export function useSaveField(venueId: VenueId) {
  const refresh = useRefreshTypes(venueId);
  return useMutation({
    mutationFn: ({
      typeId,
      id,
      field,
      sortOrder,
    }: {
      typeId: LocationTypeId;
      id: string | null;
      field: CustomField;
      sortOrder: number;
    }) => data.locationTypes.saveField(typeId, id, field, sortOrder),
    onSuccess: refresh,
  });
}

export function useRemoveField(venueId: VenueId) {
  const refresh = useRefreshTypes(venueId);
  return useMutation({
    mutationFn: (id: string) => data.locationTypes.removeField(id),
    onSuccess: refresh,
  });
}

export function useReorderFields(venueId: VenueId) {
  const refresh = useRefreshTypes(venueId);
  return useMutation({
    mutationFn: (order: { id: string; sortOrder: number }[]) =>
      data.locationTypes.reorderFields(order),
    onSettled: refresh,
  });
}

export function fieldUsage(typeId: LocationTypeId, key: string) {
  return data.locationTypes.fieldUsage(typeId, key);
}

export function useLocations(venueId: VenueId) {
  return useQuery({
    queryKey: keys.locations(venueId),
    queryFn: () => data.locations.list(venueId),
  });
}

export function useCategories(venueId: VenueId) {
  return useQuery({
    queryKey: keys.categories(venueId),
    queryFn: () => data.categories.list(venueId),
  });
}

/** Unit venue dan pemakainya; dimuat saat formulir lokasi dibuka. */
export function useVenueUnits(venueId: VenueId) {
  return useQuery({
    queryKey: keys.units(venueId),
    queryFn: () => data.locations.venueUnits(venueId),
  });
}

/** Lokasi yang menempati unit terpilih di editor. */
export function useUnitLocations(featureId: string | null) {
  return useQuery({
    queryKey: keys.forUnit(featureId ?? ''),
    queryFn: () => data.locations.forUnit(featureId as string),
    enabled: featureId !== null,
  });
}

function useRefreshLocations(venueId: VenueId) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.locations(venueId) }),
      queryClient.invalidateQueries({ queryKey: keys.units(venueId) }),
      queryClient.invalidateQueries({ queryKey: keys.categories(venueId) }),
      queryClient.invalidateQueries({ queryKey: ['unit-locations'] }),
    ]);
}

export function useSaveLocation(venueId: VenueId) {
  const refresh = useRefreshLocations(venueId);
  return useMutation({
    mutationFn: ({
      typeId,
      id,
      input,
      images,
    }: {
      typeId: LocationTypeId;
      id: LocationId | null;
      input: LocationInput;
      images: LocationImages;
    }) => data.locations.save(venueId, typeId, id, input, images),
    onSuccess: refresh,
  });
}

export function useRemoveLocation(venueId: VenueId) {
  const refresh = useRefreshLocations(venueId);
  return useMutation({
    mutationFn: (id: LocationId) => data.locations.remove(id),
    onSuccess: refresh,
  });
}

export function useSaveCategory(venueId: VenueId) {
  const refresh = useRefreshLocations(venueId);
  return useMutation({
    mutationFn: ({
      id,
      typeId,
      input,
      sortOrder,
      iconPng,
    }: {
      id: CategoryId | null;
      typeId: LocationTypeId;
      input: CategoryInput;
      sortOrder: number;
      iconPng: Blob | undefined;
    }) =>
      id
        ? data.categories.update(id, input, iconPng)
        : data.categories.create(venueId, typeId, { ...input, sortOrder }, iconPng),
    onSuccess: refresh,
  });
}

export function useReorderCategories(venueId: VenueId) {
  const refresh = useRefreshLocations(venueId);
  return useMutation({
    mutationFn: (order: { id: CategoryId; sortOrder: number }[]) => data.categories.reorder(order),
    onSettled: refresh,
  });
}

export function useRemoveCategory(venueId: VenueId) {
  const refresh = useRefreshLocations(venueId);
  return useMutation({
    mutationFn: (id: CategoryId) => data.categories.remove(id),
    onSuccess: refresh,
  });
}

export function locationImageUrl(path: string): string {
  return data.locations.imageUrl(path);
}

export function uploadFieldImage(venueId: VenueId, file: Blob): Promise<string> {
  return data.locations.uploadFieldImage(venueId, file);
}
