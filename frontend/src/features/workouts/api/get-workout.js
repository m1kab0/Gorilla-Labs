import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function getWorkout(workoutId) {
  return api(`/workouts/${workoutId}`);
}

export function useWorkout(workoutId) {
  return useQuery({
    queryKey: ['workouts', workoutId],
    queryFn: () => getWorkout(workoutId),
    enabled: !!workoutId,
  });
}
