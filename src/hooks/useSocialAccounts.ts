import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { SocialAccount } from '@/services/social.service';

export function useSocialAccounts() {
  return useQuery({
    queryKey:  ['social-accounts'],
    queryFn:   () => apiFetch<{ accounts: SocialAccount[] }>('/social').then(r => r.accounts),
    staleTime: 2 * 60 * 1000,
  });
}

export function useInvalidateSocialAccounts() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['social-accounts'] });
}
