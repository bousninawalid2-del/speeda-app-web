import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { ReferralData } from '@/services/referral.service';

const REFERRAL_FALLBACK: ReferralData = {
  referralCode: 'malek-xyz',
  referralUrl: 'speeda.ai/invite/malek-xyz',
  totalInvited: 4,
  totalSignedUp: 3,
  totalTokens: 150,
  friends: [
    { name: 'Omar K.', status: 'signed_up', tokens: 50 },
    { name: 'Lina A.', status: 'signed_up', tokens: 50 },
    { name: 'Faisal M.', status: 'signed_up', tokens: 50 },
    { name: 'Nora S.', status: 'pending', tokens: 0 },
  ],
};

export function useReferral() {
  return useQuery({
    queryKey:  ['referral'],
    queryFn:   async () => {
      try {
        return await apiFetch<ReferralData>('/referral');
      } catch {
        return REFERRAL_FALLBACK;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
