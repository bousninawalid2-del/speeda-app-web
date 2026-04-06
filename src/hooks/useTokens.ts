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

export function useTokens() {
  return useQuery({
    queryKey: ['tokens'],
    queryFn:  () => apiFetch<TokensData>('/tokens'),
    staleTime: 60 * 1000,
  });
}

