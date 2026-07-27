import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function deleteSet(setId) {
  return api(`/workouts/sets/${setId}`, { method: 'DELETE' });
}

export function useDeleteSet(workoutId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', workoutId] });
    },
  });
}
