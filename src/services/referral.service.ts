import { apiFetch } from '@/lib/api-client';

export interface ReferralFriend {
  name:   string;
  status: 'signed_up' | 'pending';
  tokens: number;
  email?: string;
}

export interface ReferralData {
  referralCode:   string;
  referralUrl:    string;
  totalInvited:   number;
  totalSignedUp:  number;
  totalTokens:    number;
  friends:        ReferralFriend[];
}

export const referralService = {
  get: () => apiFetch<ReferralData>('/referral'),
};
