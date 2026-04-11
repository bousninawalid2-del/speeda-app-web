import { apiFetch, getAccessToken } from '@/lib/api-client';

export type MediaTypeFilter = 'photo' | 'video';

export interface MediaRecord {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  createdAt: string;
}

export const mediaService = {
  list: (type?: MediaTypeFilter) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    const query = params.toString();
    return apiFetch<{ items: MediaRecord[] }>(`/media${query ? `?${query}` : ''}`);
  },

  upload: async (file: File) => {
    const token = getAccessToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/media', {
      method: 'POST',
      credentials: 'same-origin',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Failed to upload media (HTTP ${response.status})` }));
      throw new Error(error.error ?? 'Upload failed');
    }

    return response.json() as Promise<{ id: string; url: string }>;
  },
};
