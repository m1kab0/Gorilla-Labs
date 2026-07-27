import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function deleteExercise(id) {
  return api(`/exercises/${id}`, { method: 'DELETE' });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExercise,
    onSuccess: (_data, id) => {
      queryClient.setQueryData(['exercises'], (prev) => prev?.filter((ex) => ex.id !== id) ?? []);
    },
  });
}
