import { apiFetch } from '@/lib/api-client';

export interface TokensData {
  balance:   number;
  used:      number;
  total:     number;
  history:   Array<{ id: string; description: string; tokens: number; agent: string; createdAt: string }>;
  byAgent:   Record<string, number>;
  packages?: Array<{ id: string; name: string; tokenCount: number; price: number }>;
}

export const tokensService = {
  get: () => apiFetch<TokensData>('/tokens'),

  purchase: (packId: string, paymentMethodId: string) =>
    apiFetch<{ message: string; newBalance: number; added: number }>('/tokens', {
      method: 'POST',
      body: JSON.stringify({ packId, paymentMethodId }),
    }),
};
