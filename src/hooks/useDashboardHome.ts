import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface DashboardHomeAction {
  id: number;
  priority: 'critical' | 'high' | 'recommended';
  color: string;
  title: string;
  desc: string;
  impact: string;
  impactIcon: string;
  nav: string;
}

export interface DashboardHomeRecommendation {
  icon: string;
  bg: string;
  text: string;
  nav: string;
}

export interface DashboardHomeData {
  todaysActions: DashboardHomeAction[];
  aiActivitySummary: string;
  recommendations: DashboardHomeRecommendation[];
}

export function useDashboardHome() {
  return useQuery({
    queryKey: ['dashboard-home'],
    queryFn: async () => {
      try {
        return await apiFetch<DashboardHomeData>('/dashboard/home');
      } catch {
        return null;
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
