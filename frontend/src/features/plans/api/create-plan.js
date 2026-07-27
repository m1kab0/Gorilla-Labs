import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function createPlan({ name, exercises }) {
  return api('/plans/', { method: 'POST', body: { name, exercises } });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlan,
    onSuccess: (plan) => {
      queryClient.setQueryData(['plans'], (prev) => (prev ? [plan, ...prev] : [plan]));
    },
  });
}
