import type { FacilityTypeWithUsage } from '@indoor/data';
import type { FacilityTypeId, FacilityTypeInput, VenueId } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';

export const facilityTypesKey = (venueId: VenueId | null) => ['facility-types', venueId] as const;

export function useFacilityTypes(venueId: VenueId | null) {
  return useQuery({
    queryKey: facilityTypesKey(venueId),
    queryFn: () => data.facilityTypes.list(venueId as VenueId),
    enabled: venueId !== null,
  });
}

export function useSaveFacilityType(venueId: VenueId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      iconPng,
    }: {
      id: FacilityTypeId | null;
      input: FacilityTypeInput;
      iconPng: Blob | undefined;
    }) =>
      id
        ? data.facilityTypes.update(id, input, iconPng)
        : data.facilityTypes.create(venueId, input, iconPng),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: facilityTypesKey(venueId) }),
  });
}

export function useRemoveFacilityType(venueId: VenueId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type: FacilityTypeWithUsage) => data.facilityTypes.remove(type.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: facilityTypesKey(venueId) }),
  });
}
