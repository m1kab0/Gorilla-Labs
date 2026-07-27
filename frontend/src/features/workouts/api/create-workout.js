import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function createWorkout() {
  return api('/workouts/', { method: 'POST', body: {} });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
