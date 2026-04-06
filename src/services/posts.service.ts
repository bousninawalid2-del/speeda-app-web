import { apiFetch } from '@/lib/api-client';
import type { Post, CreatePostInput, UpdatePostInput, PostsResponse } from '@/hooks/usePosts';

export const postsService = {
  list: (params: { platform?: string; status?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.platform) qs.set('platform', params.platform);
    if (params.status)   qs.set('status',   params.status);
    if (params.page)     qs.set('page',      String(params.page));
    if (params.limit)    qs.set('limit',     String(params.limit ?? 50));
    return apiFetch<PostsResponse>(`/posts?${qs}`);
  },

  create: (data: CreatePostInput) =>
    apiFetch<{ post: Post }>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdatePostInput) =>
    apiFetch<{ post: Post }>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/posts/${id}`, { method: 'DELETE' }),

  retry: (id: string) =>
    apiFetch<{ post: Post }>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Scheduled' }),
    }),
};
