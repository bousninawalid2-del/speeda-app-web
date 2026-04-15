import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface PlanComparisonPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  locked: string[];
  watermark: boolean;
  popular: boolean;
  sortOrder: number;
}

export function usePlanComparisonPlans() {
  return useQuery({
    queryKey: ['plans-comparison'],
    queryFn: async () => {
      const response = await apiFetch<{ plans: PlanComparisonPlan[] }>('/plans');
      if (!Array.isArray(response.plans)) throw new Error('Invalid plans payload');
      return response.plans;
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
