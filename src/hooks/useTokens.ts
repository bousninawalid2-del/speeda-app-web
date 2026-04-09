import { useQuery } from '@tanstack/react-query';
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

