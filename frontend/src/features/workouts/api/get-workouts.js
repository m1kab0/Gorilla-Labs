import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function getWorkouts() {
  return api('/workouts/');
}

export function useWorkouts() {
  return useQuery({ queryKey: ['workouts'], queryFn: getWorkouts });
}
