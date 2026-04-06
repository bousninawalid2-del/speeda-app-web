import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo, GoogleLogo, PinterestLogo, ThreadsLogo } from '../components/PlatformLogos';

// ─── Platform logo lookup ────────────────────────────────────────────────────

const PLATFORM_META: Record<string, { name: string; Logo: React.ComponentType<{ size?: number }> }> = {
  instagram: { name: 'Instagram', Logo: InstagramLogo },
  tiktok: { name: 'TikTok', Logo: TikTokLogo },
  snapchat: { name: 'Snapchat', Logo: SnapchatLogo },
  facebook: { name: 'Facebook', Logo: FacebookLogo },
  x: { name: 'X', Logo: XLogo },
  youtube: { name: 'YouTube', Logo: YouTubeLogo },
  linkedin: { name: 'LinkedIn', Logo: LinkedInLogo },
  googlebusiness: { name: 'Google Biz', Logo: GoogleLogo },
  pinterest: { name: 'Pinterest', Logo: PinterestLogo },
  threads: { name: 'Threads', Logo: ThreadsLogo },
};

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AnalyticsExternalData {
  mosScore: number;
  reach: number;
  impressions: number;
  clicks: number;
  engagement: number;
  posts: number;
  spent: number;
  followers: { total: number; byPlatform: Record<string, number> };
  social: Record<string, unknown> | null;
}

interface AnalyticsScreenProps {
  onNavigate?: (screen: string) => void;
  externalData?: AnalyticsExternalData;
  isLoading?: boolean;
  onPeriodChange?: (period: string) => void;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const KpiSkeleton = () => (
  <div className="bg-card rounded-2xl p-4 border border-border-light animate-pulse">
    <div className="h-4 w-8 bg-muted rounded mb-3" />
    <div className="h-7 w-20 bg-muted rounded mb-1" />
    <div className="h-3 w-16 bg-muted rounded" />
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const AnalyticsScreen = ({ onNavigate, externalData, isLoading, onPeriodChange }: AnalyticsScreenProps) => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('30D');

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    const apiPeriod: Record<string, string> = { '7D': '7d', '30D': '30d', '90D': '90d', '1Y': '1y' };
    onPeriodChange?.(apiPeriod[p] ?? '30d');
  };

  const data = externalData;

  // Build KPI cards from real data
  const kpis = data ? [
    { icon: '👁️', value: formatK(data.reach), label: 'Total Reach' },
    { icon: '📊', value: `${data.engagement}%`, label: 'Engagement Rate' },
    { icon: '📝', value: String(data.posts), label: 'Posts Published' },
    { icon: '💰', value: `SAR ${data.spent.toLocaleString()}`, label: 'Ad Spend' },
    { icon: '👆', value: formatK(data.clicks), label: 'Clicks' },
    { icon: '👁️‍🗨️', value: formatK(data.impressions), label: 'Impressions' },
  ] : [];

  // Platform breakdown from followers.byPlatform
  const platformEntries = data
    ? Object.entries(data.followers.byPlatform)
        .map(([platform, followers]) => ({
          platform,
          meta: PLATFORM_META[platform],
          followers,
        }))
        .filter(e => e.meta)
        .sort((a, b) => b.followers - a.followers)
    : [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">{t('analytics.title')}</h1>
            <p className="text-[14px] text-muted-foreground">{t('analytics.subtitle')}</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mt-4 bg-card rounded-2xl p-1 border border-border flex">
          {['7D', '30D', '90D', '1Y'].map(p => (
            <button key={p} onClick={() => handlePeriodChange(p)}
              className={`flex-1 h-9 rounded-xl text-[13px] font-semibold transition-all ${
                period === p ? 'bg-brand-blue text-primary-foreground' : 'text-muted-foreground'
              } ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
              {p}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {isLoading ? (
            <>{[1, 2, 3, 4].map(i => <KpiSkeleton key={i} />)}</>
          ) : kpis.length > 0 ? (
            kpis.map((kpi, i) => (
              <motion.div key={`${period}-${i}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                className="bg-card rounded-2xl p-4 border border-border-light">
                <span className="text-lg">{kpi.icon}</span>
                <p className="text-[22px] font-extrabold text-foreground mt-2 tracking-[-0.02em]">{kpi.value}</p>
                <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8">
              <p className="text-[14px] text-muted-foreground">No analytics data yet. Start posting to see your performance.</p>
            </div>
          )}
        </div>

        {/* MOS Score */}
        {data && (
          <div className="mt-5">
            <div className="bg-card rounded-2xl p-5 border border-border-light flex items-center gap-4">
              <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center">
                <span className="text-[24px] font-extrabold text-primary-foreground">{data.mosScore}</span>
              </div>
              <div>
                <p className="text-[16px] font-bold text-foreground">MOS Score</p>
                <p className="text-[12px] text-muted-foreground">Marketing Operating System Score (0-100)</p>
              </div>
            </div>
          </div>
        )}

        {/* Followers Summary */}
        {data && data.followers.total > 0 && (
          <div className="mt-5">
            <div className="bg-card rounded-2xl p-5 border border-border-light">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold text-foreground">Total Followers</h2>
                <span className="text-[20px] font-extrabold text-foreground">{formatK(data.followers.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Platform Breakdown */}
        {platformEntries.length > 0 && (
          <div className="mt-5">
            <h2 className="text-[18px] font-bold text-foreground">{t('analytics.platformBreakdown')}</h2>
            <div className="bg-card rounded-2xl border border-border-light mt-3 overflow-hidden">
              {platformEntries.map((entry, i) => {
                const Logo = entry.meta.Logo;
                return (
                <div key={entry.platform} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border-light' : ''}`}>
                  <Logo size={18} />
                  <span className="text-[13px] font-semibold text-foreground flex-1">{entry.meta.name}</span>
                  <span className="text-[13px] font-bold text-foreground">{formatK(entry.followers)}</span>
                  <span className="text-[11px] text-muted-foreground">followers</span>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation to Post History */}
        <div className="mt-5">
          <button onClick={() => onNavigate?.('postHistory')} className="w-full bg-card rounded-2xl p-4 border border-border-light text-left">
            <span className="text-lg">📋</span>
            <h3 className="text-[15px] font-bold text-foreground mt-2">Post History</h3>
            <p className="text-[12px] text-muted-foreground mt-1">View all published, scheduled & failed posts</p>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
