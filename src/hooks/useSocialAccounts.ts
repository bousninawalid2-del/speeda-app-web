import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { SocialAccount } from '@/services/social.service';

const SOCIAL_ACCOUNTS_FALLBACK: SocialAccount[] = [
  { platform: 'instagram', connected: true, followers: 12400, username: '@speeda.restaurant', status: 'healthy' },
  { platform: 'tiktok', connected: true, followers: 8200, username: '@speeda.restaurant', status: 'healthy' },
  { platform: 'facebook', connected: true, followers: 5600, username: 'Speeda Restaurant', status: 'healthy' },
  { platform: 'x', connected: true, followers: 2800, username: '@speeda', status: 'warning' },
  { platform: 'linkedin', connected: false, followers: 0, status: 'error' },
];

export function useSocialAccounts() {
  return useQuery({
    queryKey:  ['social-accounts'],
    queryFn:   async () => {
      try {
        const response = await apiFetch<{ accounts: SocialAccount[] }>('/social');
        return response.accounts;
      } catch {
        return SOCIAL_ACCOUNTS_FALLBACK;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useInvalidateSocialAccounts() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['social-accounts'] });
}
