import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface ConnectedPlatform {
  platform: string;
  connected: boolean;
  username: string | null;
  displayName: string | null;
  userImage: string | null;
  messagingActive: boolean;
  refreshDaysRemaining: number | null;
  refreshWarning: boolean;
  connectedAt: string | null;
}

interface ConnectedPlatformsResponse {
  platforms: ConnectedPlatform[];
}

export function useConnectedPlatforms() {
  return useQuery({
    queryKey: ['settings-connected-platforms'],
    queryFn: async () => {
      const res = await apiFetch<ConnectedPlatformsResponse>('/settings/connected-platforms');
      return res.platforms ?? [];
    },
    staleTime: 60 * 1000,
  });
}

export function useInvalidateConnectedPlatforms() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['settings-connected-platforms'] });
}
