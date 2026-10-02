import type { Branding, VenueId } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../../app/data-client';
import { displaySettingsKey } from '../display/queries';

/** Perubahan logo venue dari formulir Branding; diunggah saat disimpan. */
export type LogoChange = { kind: 'keep' } | { kind: 'new'; file: File } | { kind: 'remove' };

const venueKey = (venueId: VenueId) => ['venues', 'detail', venueId] as const;

/** Data venue lengkap (logo); daftar venue di pemilih hanya berisi ringkasan. */
export function useVenueDetail(venueId: VenueId) {
  return useQuery({ queryKey: venueKey(venueId), queryFn: () => data.venues.get(venueId) });
}

export function useSaveBranding(venueId: VenueId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ branding, logo }: { branding: Branding; logo: LogoChange }) => {
      const settings = await data.displaySettings.update(venueId, { branding });
      if (logo.kind === 'new') await data.venues.uploadLogo(venueId, logo.file);
      if (logo.kind === 'remove') await data.venues.removeLogo(venueId);
      return settings;
    },
    onSuccess: async (settings, { logo }) => {
      queryClient.setQueryData(displaySettingsKey(venueId), settings);
      // Logo juga tampil di daftar venue; semua cache venue dimuat ulang.
      if (logo.kind !== 'keep') await queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
}
