import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface BillingPayment {
  id:          string;
  amount:      number;
  currency:    string;
  status:      'succeeded' | 'failed' | 'pending' | 'refunded';
  type:        'subscription' | 'token_purchase' | 'topup';
  description: string | null;
  createdAt:   string;
  metadata:    Record<string, unknown> | null;
}

export function useBilling() {
  return useQuery({
    queryKey: ['billing'],
    queryFn:  () => apiFetch<{ payments: BillingPayment[] }>('/billing').then(r => r.payments),
    staleTime: 2 * 60 * 1000,
  });
}
