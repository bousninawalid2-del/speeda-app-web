import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface RssFeed {
  id: string;
  url: string;
  title?: string;
  type?: string;
  status?: string;
  platforms?: string[];
  active?: boolean;
  useFirstImage?: boolean;
  autoHashtag?: boolean;
  lastItem?: { title?: string; link?: string; pubDate?: string } | null;
}

interface ListResponse { feeds: RssFeed[] }

export function useRssFeeds() {
  return useQuery({
    queryKey: ['settings-rss-feeds'],
    queryFn: async () => {
      const res = await apiFetch<ListResponse>('/settings/rss-feeds');
      return res.feeds ?? [];
    },
    staleTime: 60 * 1000,
  });
}

export function useAddRssFeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { url: string; platforms?: string[]; useFirstImage?: boolean; autoHashtag?: boolean }) =>
      apiFetch<{ feed: RssFeed }>('/settings/rss-feeds', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-rss-feeds'] }),
  });
}

export function useUpdateRssFeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; useFirstImage?: boolean; autoHashtag?: boolean; platforms?: string[] }) =>
      apiFetch<{ feed: RssFeed }>('/settings/rss-feeds', { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-rss-feeds'] }),
  });
}

export function useDeleteRssFeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: true }>('/settings/rss-feeds', { method: 'DELETE', body: JSON.stringify({ id }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-rss-feeds'] }),
  });
}
