import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function createExercise({ name, muscleGroup }) {
  return api('/exercises/', { method: 'POST', body: { name, muscle_group: muscleGroup || null } });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExercise,
    onSuccess: (exercise) => {
      queryClient.setQueryData(['exercises'], (prev) => (prev ? [...prev, exercise] : [exercise]));
    },
  });
}
