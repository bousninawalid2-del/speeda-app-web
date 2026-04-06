import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Plan } from './usePlans';

export interface SubscriptionData {
  id:                 string;
  status:             'active' | 'cancelled' | 'past_due' | 'trialing';
  billingType:        'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd:   string;
  cancelledAt:        string | null;
  plan:               Plan;
}

export interface SubscriptionResponse {
  subscription: SubscriptionData | null;
  trial: { active: boolean; daysLeft: number };
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn:  () => apiFetch<SubscriptionResponse>('/subscriptions'),
    staleTime: 60 * 1000,
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { planId: string; billingType: 'monthly' | 'yearly' }) =>
      apiFetch<{ checkoutUrl: string; linkId: string }>('/subscriptions', {
        method: 'POST',
        body:   JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
      qc.invalidateQueries({ queryKey: ['tokens'] });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ ok: boolean }>('/subscriptions', { method: 'DELETE' }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  });
}

export function usePurchaseTokenPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (packageId: string) =>
      apiFetch<{ checkoutUrl: string }>('/billing/token-purchase', {
        method: 'POST',
        body:   JSON.stringify({ packageId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tokens'] }),
  });
}
