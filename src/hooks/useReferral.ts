import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { ReferralData } from '@/services/referral.service';

export function useReferral() {
  return useQuery({
    queryKey:  ['referral'],
    queryFn:   () => apiFetch<ReferralData>('/referral'),
    staleTime: 5 * 60 * 1000,
  });
}
