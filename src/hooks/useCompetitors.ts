import { useQuery } from '@tanstack/react-query';
import { competitorsApi, Competitor } from '@/lib/api-client';

const FALLBACK_COMPETITORS: Competitor[] = [
  {
    id: '1',
    userId: '',
    name: 'Shawarma Palace',
    platform: 'instagram',
    handle: '@shawarmapalace',
    followers: 45000,
    postsPerWeek: 7,
    avgEngagement: 4.2,
    lastSynced: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: '',
    name: 'Burger Hub',
    platform: 'instagram',
    handle: '@burgerhub_sa',
    followers: 32000,
    postsPerWeek: 5,
    avgEngagement: 3.8,
    lastSynced: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useCompetitors() {
  return useQuery({
    queryKey: ['competitors'],
    queryFn: async () => {
      try {
        return await competitorsApi.list();
      } catch {
        return FALLBACK_COMPETITORS;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
