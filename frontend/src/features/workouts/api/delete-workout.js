import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function deleteWorkout(workoutId) {
  return api(`/workouts/${workoutId}`, { method: 'DELETE' });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkout,
    onSuccess: (_data, workoutId) => {
      queryClient.setQueryData(['workouts'], (prev) => prev?.filter((w) => w.id !== workoutId) ?? []);
      queryClient.removeQueries({ queryKey: ['workouts', workoutId] });
    },
  });
}
