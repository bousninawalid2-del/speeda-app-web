import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface Post {
  id:          string;
  platform:    string;
  caption:     string;
  hashtags:    string | null;
  mediaUrls:   string | null;
  scheduledAt: string | null;
  status:      string;
  ayrshareId:  string | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface PostsResponse {
  posts:      Post[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface CreatePostInput {
  platform:    string;
  caption:     string;
  hashtags?:   string;
  mediaUrls?:  string[];
  scheduledAt?: string;
  status?:     'Draft' | 'Scheduled' | 'Published';
}

export interface UpdatePostInput {
  platform?:    string;
  caption?:     string;
  hashtags?:    string;
  mediaUrls?:   string[];
  scheduledAt?: string;
  status?:      'Draft' | 'Scheduled' | 'Published' | 'Failed';
  ayrshareId?:  string;
}

export function usePosts(filters: { platform?: string; status?: string; page?: number } = {}) {
  const params = new URLSearchParams();
  if (filters.platform) params.set('platform', filters.platform);
  if (filters.status)   params.set('status', filters.status);
  if (filters.page)     params.set('page', String(filters.page));

  return useQuery({
    queryKey: ['posts', filters],
    queryFn:  () => apiFetch<PostsResponse>(`/posts?${params}`),
    staleTime: 60 * 1000,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostInput) =>
      apiFetch<{ post: Post }>('/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePostInput & { id: string }) =>
      apiFetch<{ post: Post }>(`/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ message: string }>(`/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}
