import { apiFetch } from '@/lib/api-client';

export interface Campaign {
  id:          string;
  name:        string;
  status:      string;
  platforms:   string;
  budget:      number;
  spent:       number;
  reach:       number;
  impressions: number;
  clicks:      number;
  roi?:        number;
  startDate:   string;
  endDate:     string;
  isAI:        boolean;
  location?:   string;
  ageRange?:   string;
  interests?:  string;
  createdAt:   string;
  updatedAt:   string;
}

export interface CampaignsResponse {
  campaigns: Record<string, Campaign[]>;
  stats: {
    totalBudget:  number;
    totalReach:   number;
    avgRoi:       number;
    activeCount:  number;
  };
}

export const campaignsService = {
  list: () => apiFetch<CampaignsResponse>('/campaigns'),

  create: (data: Partial<Campaign>) =>
    apiFetch<{ campaign: Campaign }>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Campaign>) =>
    apiFetch<{ campaign: Campaign }>(`/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/campaigns/${id}`, { method: 'DELETE' }),
};
