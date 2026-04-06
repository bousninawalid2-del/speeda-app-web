import { apiFetch } from '@/lib/api-client';

export interface SocialAccount {
  platform:    string;
  connected:   boolean;
  followers:   number;
  username?:   string;
  lastSync?:   string;
  status?:     'healthy' | 'warning' | 'error';
  errors?:     number;
  postsThisMonth?: number;
}

export const socialService = {
  getAccounts: () =>
    apiFetch<{ accounts: SocialAccount[] }>('/social').then(r => r.accounts),

  connect: () =>
    apiFetch<{ url: string }>('/social/connect', { method: 'POST' }),

  disconnect: (platform: string) =>
    apiFetch<{ message: string }>('/social/disconnect', {
      method: 'POST',
      body: JSON.stringify({ platform }),
    }),
};
