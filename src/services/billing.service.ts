import { apiFetch } from '@/lib/api-client';
import type { BillingPayment } from '@/hooks/useBilling';
import type { Plan } from '@/hooks/usePlans';
import type { SubscriptionResponse } from '@/hooks/useSubscription';

export const billingService = {
  getHistory: () =>
    apiFetch<{ payments: BillingPayment[] }>('/billing').then(r => r.payments),

  purchaseTokens: (packageId: string) =>
    apiFetch<{ checkoutUrl: string }>('/billing/token-purchase', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    }),

  getPlans: () =>
    apiFetch<{ plans: Plan[] }>('/plans').then(r => r.plans),

  getSubscription: () =>
    apiFetch<SubscriptionResponse>('/subscriptions'),

  createSubscription: (planId: string, billingType: 'monthly' | 'yearly') =>
    apiFetch<{ checkoutUrl: string }>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ planId, billingType }),
    }),

  cancelSubscription: () =>
    apiFetch<{ ok: boolean }>('/subscriptions', { method: 'DELETE' }),
};
