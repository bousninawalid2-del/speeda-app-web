import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface TokenLog {
  id:          string;
  description: string;
  tokens:      number;
  agent:       string;
  createdAt:   string;
}

export interface TokensData {
  balance:  number;
  used:     number;
  total:    number;
  history:  TokenLog[];
  byAgent:  Record<string, number>;
}

export interface TokenPackage {
  id: string;
  name: string;
  tokenCount: number;
  price: number;
}

const TOKENS_FALLBACK: TokensData = {
  balance: 32,
  used: 18,
  total: 50,
  history: [
    {
      id: 'fallback-1',
      description: 'Content generation - Instagram post',
      tokens: 3,
      agent: 'Content',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'fallback-2',
      description: 'AI response - Google review',
      tokens: 2,
      agent: 'Engagement',
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
    },
  ],
  byAgent: {
    Content: 10,
    Engagement: 4,
    Strategy: 2,
    Analytics: 2,
  },
};

const TOKEN_PACKAGES_FALLBACK: TokenPackage[] = [
  { id: 'pack_200', name: 'Starter Pack', tokenCount: 200, price: 199 },
  { id: 'pack_500', name: 'Growth Pack', tokenCount: 500, price: 449 },
  { id: 'pack_1500', name: 'Pro Pack', tokenCount: 1500, price: 1199 },
  { id: 'pack_5000', name: 'Scale Pack', tokenCount: 5000, price: 3499 },
];

export function useTokens() {
  return useQuery({
    queryKey: ['tokens'],
    queryFn:  async () => {
      try {
        return await apiFetch<TokensData>('/tokens');
      } catch {
        return TOKENS_FALLBACK;
      }
    },
    staleTime: 60 * 1000,
  });
}

export function usePurchaseTokenPackage() {
  return useMutation({
    mutationFn: (packageId: string) =>
      apiFetch<{ checkoutUrl: string; linkId: string }>('/billing/token-purchase', {
        method: 'POST',
        body: JSON.stringify({ packageId }),
      }),
  });
}

export function useTokenPackages() {
  return useQuery({
    queryKey: ['token-packages'],
    queryFn: async () => {
      try {
        const response = await apiFetch<{ packs: TokenPackage[] }>('/token-packages');
        return response.packs;
      } catch {
        return TOKEN_PACKAGES_FALLBACK;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
