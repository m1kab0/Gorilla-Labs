import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getToken, setToken } from './api-client';

const USER_QUERY_KEY = ['auth', 'me'];

async function getMe() {
  return api('/auth/me');
}

export function useUser() {
  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: getMe,
    enabled: !!getToken(),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const tokenRes = await api('/auth/login', { method: 'POST', form: { username: email, password } });
      setToken(tokenRes.access_token);
      return getMe();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(USER_QUERY_KEY, user);
    },
  });
}

export function useRegister() {
  const login = useLogin();
  return useMutation({
    mutationFn: async ({ email, password, displayName }) => {
      await api('/auth/register', {
        method: 'POST',
        body: { email, password, display_name: displayName || null },
      });
      return login.mutateAsync({ email, password });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return function logout() {
    setToken(null);
    queryClient.clear();
  };
}
