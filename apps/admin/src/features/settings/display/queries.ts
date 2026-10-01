import type { DisplaySettingsPatch, VenueId } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../../app/data-client';

export const displaySettingsKey = (venueId: VenueId | null) =>
  ['display-settings', venueId] as const;

export function useDisplaySettings(venueId: VenueId | null) {
  return useQuery({
    queryKey: displaySettingsKey(venueId),
    queryFn: () => data.displaySettings.get(venueId as VenueId),
    enabled: venueId !== null,
  });
}

export function useSaveDisplaySettings(venueId: VenueId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: DisplaySettingsPatch) => data.displaySettings.update(venueId, patch),
    onSuccess: (saved) => queryClient.setQueryData(displaySettingsKey(venueId), saved),
  });
}
