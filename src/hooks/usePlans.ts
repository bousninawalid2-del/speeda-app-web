import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface Plan {
  id:           string;
  name:         string;
  monthlyPrice: number;
  yearlyPrice:  number;
  tokenCount:   number;
  platformLimit: number;
  features:     string[];
  locked:       string[];
  watermark:    boolean;
  popular:      boolean;
  sortOrder:    number;
}

export function usePlans() {
  return useQuery({
    queryKey:  ['plans'],
    queryFn:   () => apiFetch<{ plans: Plan[] }>('/plans').then(r => r.plans),
    staleTime: 10 * 60 * 1000, // plans rarely change
  });
}
