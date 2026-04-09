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

const PLANS_FALLBACK: Plan[] = [
  {
    id: 'fallback-starter',
    name: 'Starter',
    monthlyPrice: 99,
    yearlyPrice: 79,
    tokenCount: 200,
    platformLimit: 3,
    features: ['Content Studio', 'Basic Analytics', '3 Platforms'],
    locked: ['Advanced AI Strategy', 'Priority Support'],
    watermark: true,
    popular: false,
    sortOrder: 1,
  },
  {
    id: 'fallback-pro',
    name: 'Pro',
    monthlyPrice: 249,
    yearlyPrice: 199,
    tokenCount: 800,
    platformLimit: 7,
    features: ['Advanced Analytics', 'AI Campaign Optimizer', '7 Platforms'],
    locked: ['Dedicated Success Manager'],
    watermark: false,
    popular: true,
    sortOrder: 2,
  },
  {
    id: 'fallback-business',
    name: 'Business',
    monthlyPrice: 499,
    yearlyPrice: 399,
    tokenCount: 3000,
    platformLimit: 20,
    features: ['All Features', 'Unlimited Workflows', 'Priority Support'],
    locked: [],
    watermark: false,
    popular: false,
    sortOrder: 3,
  },
];

export function usePlans() {
  return useQuery({
    queryKey:  ['plans'],
    queryFn:   async () => {
      try {
        const response = await apiFetch<{ plans: Plan[] }>('/plans');
        return response.plans;
      } catch {
        return PLANS_FALLBACK;
      }
    },
    staleTime: 10 * 60 * 1000, // plans rarely change
  });
}
