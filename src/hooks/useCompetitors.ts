import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface Competitor {
  id:            string;
  userId:        string;
  name:          string;
  platform:      string;
  handle:        string;
  followers:     number;
  postsPerWeek:  number;
  avgEngagement: number;
  lastSynced?:   string | null;
  createdAt:     string;
  updatedAt:     string;
}

const FALLBACK_COMPETITORS: Competitor[] = [
  {
    id: 'fallback-1',
    userId: 'fallback',
    name: 'AlBaik',
    platform: 'instagram',
    handle: '@albaik',
    followers: 890000,
    postsPerWeek: 4,
    avgEngagement: 6.2,
    lastSynced: new Date().toISOString(),
    createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-2',
    userId: 'fallback',
    name: 'Shawarmer',
    platform: 'instagram',
    handle: '@shawarmer',
    followers: 245000,
    postsPerWeek: 2,
    avgEngagement: 3.1,
    lastSynced: new Date().toISOString(),
    createdAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-3',
    userId: 'fallback',
    name: 'Herfy',
    platform: 'instagram',
    handle: '@herfy',
    followers: 412000,
    postsPerWeek: 3,
    avgEngagement: 4.5,
    lastSynced: new Date().toISOString(),
    createdAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useCompetitors() {
  return useQuery({
    queryKey: ['competitors'],
    queryFn:  async () => {
      try {
        const res = await apiFetch<{ competitors: Competitor[] }>('/competitors');
        return res.competitors;
      } catch {
        return FALLBACK_COMPETITORS;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCompetitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Competitor, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastSynced'>) =>
      apiFetch<{ competitor: Competitor }>('/competitors', {
        method: 'POST',
        body:   JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
    },
  });
}

export function useDeleteCompetitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/competitors/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors'] });
    },
  });
}
