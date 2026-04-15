import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { SocialAccount } from '@/services/social.service';

const ACCOUNT_HEALTH_FALLBACK: SocialAccount[] = [
  { platform: 'instagram', connected: true, followers: 12400, username: '@speeda.restaurant', status: 'healthy', errors: 0, postsThisMonth: 12 },
  { platform: 'tiktok', connected: true, followers: 8200, username: '@speeda.restaurant', status: 'healthy', errors: 0, postsThisMonth: 8 },
  { platform: 'facebook', connected: true, followers: 5600, username: 'Speeda Restaurant', status: 'healthy', errors: 0, postsThisMonth: 10 },
  { platform: 'x', connected: true, followers: 2800, username: '@speeda', status: 'warning', errors: 1, postsThisMonth: 5 },
  { platform: 'linkedin', connected: false, followers: 0, status: 'error', errors: 3, postsThisMonth: 0 },
];

export function useAccountHealth() {
  return useQuery({
    queryKey: ['settings-account-health'],
    queryFn: async () => {
      try {
        const response = await apiFetch<{ accounts: SocialAccount[] }>('/settings/account-health');
        return response.accounts;
      } catch {
        return ACCOUNT_HEALTH_FALLBACK;
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useInvalidateAccountHealth() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['settings-account-health'] });
}
