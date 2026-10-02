import type { InstructionAction, InstructionText, VenueId } from '@indoor/domain';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { data } from '../../../app/data-client';
import { instructionTemplatesKey } from '../../editor/test-route/queries';

export { useInstructionTemplates } from '../../editor/test-route/queries';

export function useSaveInstructionTemplates(venueId: VenueId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: readonly [InstructionAction, InstructionText][]) =>
      Promise.all(
        changes.map(([action, text]) => data.instructionTemplates.update(venueId, action, text)),
      ),
    // Test route membaca kunci yang sama, jadi teks baru langsung dipakai di sana.
    onSettled: () => queryClient.invalidateQueries({ queryKey: instructionTemplatesKey(venueId) }),
  });
}
