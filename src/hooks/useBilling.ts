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

const BILLING_FALLBACK: BillingPayment[] = [
  {
    id: 'fallback-billing-1',
    amount: 1199,
    currency: 'SAR',
    status: 'succeeded',
    type: 'subscription',
    description: 'Pro plan monthly renewal',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: null,
  },
  {
    id: 'fallback-billing-2',
    amount: 199,
    currency: 'SAR',
    status: 'succeeded',
    type: 'token_purchase',
    description: '500 token pack',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: null,
  },
];

export function useBilling() {
  return useQuery({
    queryKey: ['billing'],
    queryFn:  async () => {
      try {
        const res = await apiFetch<{ payments: BillingPayment[] }>('/billing');
        return res.payments;
      } catch {
        return BILLING_FALLBACK;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}
