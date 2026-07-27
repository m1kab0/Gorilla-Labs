import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function addSet(workoutId, { exerciseId, reps, weightKg }) {
  return api(`/workouts/${workoutId}/sets`, {
    method: 'POST',
    body: { exercise_id: exerciseId, reps, weight_kg: weightKg, set_number: 1 },
  });
}

export function useAddSet(workoutId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (setInput) => addSet(workoutId, setInput),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', workoutId] });
    },
  });
}
