import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function getExercises() {
  return api('/exercises/');
}

export function useExercises() {
  return useQuery({ queryKey: ['exercises'], queryFn: getExercises });
}
