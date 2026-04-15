import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export function useLogoutAllSessions() {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>('/auth/logout-all', {
        method: 'POST',
      }),
  });
}
