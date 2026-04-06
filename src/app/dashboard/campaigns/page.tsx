'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CampaignsScreen } from '@/screens/CampaignsScreen';
import { resolveScreen } from '@/lib/navigation';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  InstagramLogo, TikTokLogo, SnapchatLogo,
  FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo,
} from '@/components/PlatformLogos';

// ─── Platform → logo component map ───────────────────────────────────────────

const LOGO_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  instagram: InstagramLogo,
  tiktok:    TikTokLogo,
  snapchat:  SnapchatLogo,
  facebook:  FacebookLogo,
  x:         XLogo,
  twitter:   XLogo,
  youtube:   YouTubeLogo,
  linkedin:  LinkedInLogo,
};

function platformsToLogos(platformStr: string): React.ComponentType<{ size?: number }>[] {
  return platformStr
    .split(',')
    .map(p => p.trim().toLowerCase())
    .map(p => LOGO_MAP[p])
    .filter(Boolean) as React.ComponentType<{ size?: number }>[];
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawCampaign {
  id: string;
  name: string;
  status: string;
  color: string;
  platforms: string;
  budget: string;
  spent: string;
  reach: string;
  roi: string;
  date: string;
  budgetNum: number;
  spentNum: number;
  impressions: string;
  clicks: string;
  clicksNum: number;
  cpc: string;
  roas: string;
  targeting: string;
  isAI: boolean;
  location?: string;
  ageRange?: string;
  interests?: string[];
  dailyImpr: number[];
  dailyClicks: number[];
}

interface CampaignsResponse {
  campaigns: Record<string, RawCampaign[]>;
  stats: {
    totalBudget: number;
    totalReach: number;
    avgRoi: number;
    activeCount: number;
  };
}

// Map API response → shape expected by CampaignsScreen (adds logo components)
function hydrate(raw: RawCampaign) {
  return { ...raw, logos: platformsToLogos(raw.platforms) };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [campaignData, setCampaignData] = useState<{
    campaigns: Record<string, ReturnType<typeof hydrate>[]>;
    stats: CampaignsResponse['stats'];
  } | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<CampaignsResponse>('/campaigns');
      setCampaignData({
        campaigns: Object.fromEntries(
          Object.entries(data.campaigns).map(([k, v]) => [k, v.map(hydrate)])
        ),
        stats: data.stats,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load campaigns');
      setCampaignData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // ── Campaign mutations (all validated server-side) ────────────────────────
  const handleUpdateCampaign = useCallback(async (
    id: string,
    data: { status?: string; budget?: number }
  ) => {
    await apiFetch(`/campaigns/${id}`, {
      method: 'PATCH',
      body:   JSON.stringify(data),
    });
    await fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <CampaignsScreen
      onNavigate={(s) => router.push(resolveScreen(s))}
      externalCampaigns={campaignData?.campaigns}
      externalStats={campaignData?.stats}
      isLoading={isLoading}
      onUpdateCampaign={handleUpdateCampaign}
      onRefresh={fetchCampaigns}
    />
  );
}
