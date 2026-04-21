import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnrichedCampaign {
  id:          string;
  name:        string;
  status:      string;
  color:       string;
  platforms:   string;
  budget:      string;
  spent:       string;
  reach:       string;
  roi:         string;
  date:        string;
  budgetNum:   number;
  spentNum:    number;
  impressions: string;
  clicks:      string;
  clicksNum:   number;
  cpc:         string;
  roas:        string;
  targeting:   string;
  isAI:        boolean;
  location?:   string;
  ageRange?:   string;
  interests?:  string[];
  dailyImpr:   number[];
  dailyClicks: number[];
}

export interface CampaignStats {
  totalBudget:  number;
  totalReach:   number;
  avgRoi:       number;
  activeCount:  number;
}

export interface CampaignsResponse {
  campaigns: Record<string, EnrichedCampaign[]>;
  stats:     CampaignStats;
}

export interface CreateCampaignInput {
  name:             string;
  status?:          'Active' | 'Scheduled' | 'Completed' | 'Paused' | 'Draft';
  platforms:        string;
  budget:           number;
  startDate:        string;
  endDate:          string;
  isAI?:            boolean;
  location?:        string;
  ageRange?:        string;
  interests?:       string;
  ayrsharePostIds?: string;
}

export interface UpdateCampaignInput {
  status?:          'Active' | 'Scheduled' | 'Completed' | 'Paused' | 'Draft';
  spent?:           number;
  reach?:           number;
  impressions?:     number;
  clicks?:          number;
  roi?:             number;
  budget?:          number;
  ayrsharePostIds?: string;
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

const CAMPAIGNS_FALLBACK: CampaignsResponse = {
  campaigns: { Active: [], Scheduled: [], Completed: [], Drafts: [] },
  stats:     { totalBudget: 0, totalReach: 0, avgRoi: 0, activeCount: 0 },
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn:  async () => {
      try {
        return await apiFetch<CampaignsResponse>('/campaigns');
      } catch {
        return CAMPAIGNS_FALLBACK;
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampaignInput) =>
      apiFetch<{ campaign: unknown }>('/campaigns', {
        method: 'POST',
        body:   JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateCampaignInput & { id: string }) =>
      apiFetch<{ campaign: unknown }>(`/campaigns/${id}`, {
        method: 'PATCH',
        body:   JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ message: string }>(`/campaigns/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}
