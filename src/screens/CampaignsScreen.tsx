import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pause, Play, TrendingUp, TrendingDown, ChevronLeft, X, DollarSign, StopCircle, ArrowUpRight, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo } from '../components/PlatformLogos';
import { useFreeTier, UpgradePrompt } from '../components/FreeTier';
import { toast } from 'sonner';
import { useCampaigns, useUpdateCampaign, type EnrichedCampaign } from '@/hooks/useCampaigns';

// ─── Platform logo map ────────────────────────────────────────────────────────

const PLATFORM_LOGOS: Record<string, React.FC<{ size?: number }>> = {
  instagram: InstagramLogo,
  tiktok:    TikTokLogo,
  facebook:  FacebookLogo,
  snapchat:  SnapchatLogo,
  x:         XLogo,
  youtube:   YouTubeLogo,
};

function getLogosForPlatforms(platforms: string): React.FC<{ size?: number }>[] {
  return platforms.split(',').map(p => PLATFORM_LOGOS[p.trim().toLowerCase()] ?? InstagramLogo);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AdStatus = 'Submitted' | 'Learning' | 'Active' | 'Paused' | 'Rejected' | 'Completed';

interface Ad {
  id:          string;
  name:        string;
  Logo:        React.FC<{ size?: number }>;
  status:      AdStatus;
  budget:      string;
  budgetNum:   number;
  spent:       number;
  impr:        string;
  clicks:      string;
  clicksNum:   number;
  cpc:         string;
  roas:        string;
  trend:       'up' | 'down';
  paused:      boolean;
  dailyData:   number[];
}

function campaignToAd(c: EnrichedCampaign): Ad {
  const primaryPlatform = c.platforms.split(',')[0].trim().toLowerCase();
  const Logo = PLATFORM_LOGOS[primaryPlatform] ?? InstagramLogo;
  const adStatus: AdStatus = c.status === 'Paused' ? 'Paused' : c.status === 'Active' ? 'Active' : c.status === 'Completed' ? 'Completed' : 'Submitted';
  return {
    id:        c.id,
    name:      c.name,
    Logo,
    status:    adStatus,
    budget:    `SAR ${c.budget}`,
    budgetNum: c.budgetNum,
    spent:     c.spentNum,
    impr:      c.impressions,
    clicks:    c.clicks,
    clicksNum: c.clicksNum,
    cpc:       c.cpc,
    roas:      c.roas,
    trend:     parseFloat(c.roi) >= 2 ? 'up' : 'down',
    paused:    c.status === 'Paused',
    dailyData: c.dailyClicks,
  };
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const statusConfig: Record<AdStatus, { color: string; bg: string }> = {
  Submitted: { color: 'text-orange', bg: 'bg-orange/10' },
  Learning:  { color: 'text-orange', bg: 'bg-orange/10' },
  Active:    { color: 'text-green-accent', bg: 'bg-green-accent' },
  Paused:    { color: 'text-muted-foreground', bg: 'bg-muted-foreground' },
  Rejected:  { color: 'text-destructive', bg: 'bg-destructive' },
  Completed: { color: 'text-muted-foreground', bg: 'bg-muted-foreground' },
};

const campaignStatusColors: Record<string, { bg: string; text: string }> = {
  Active:    { bg: 'bg-green-accent', text: 'text-primary-foreground' },
  Scheduled: { bg: 'bg-brand-blue', text: 'text-primary-foreground' },
  Completed: { bg: 'bg-muted-foreground', text: 'text-primary-foreground' },
  Paused:    { bg: 'bg-orange', text: 'text-primary-foreground' },
  Draft:     { bg: 'bg-brand-blue/20', text: 'text-brand-blue' },
};

type Tab    = 'campaigns' | 'ads';
type Filter = 'Active' | 'Scheduled' | 'Completed' | 'Drafts';

// ─── Skeleton components ──────────────────────────────────────────────────────

const CampaignSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-card rounded-2xl border border-border-light overflow-hidden animate-pulse" style={{ borderLeft: '4px solid hsl(157,100%,42%)' }}>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 bg-muted rounded-lg" />
            <div className="h-4 w-12 bg-muted rounded-md ml-auto" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(j => (
              <div key={j}><div className="h-2 w-8 bg-muted rounded mb-1" /><div className="h-4 w-12 bg-muted rounded" /></div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const StatSkeleton = () => (
  <div className="min-w-[160px] bg-card rounded-2xl p-4 border border-border-light flex-shrink-0 animate-pulse">
    <div className="w-10 h-10 rounded-xl bg-muted mb-2" />
    <div className="h-6 w-20 bg-muted rounded mb-1" />
    <div className="h-3 w-16 bg-muted rounded" />
  </div>
);

// ─── Chart components ─────────────────────────────────────────────────────────

const MiniChart = ({ data, color }: { data: number[]; color: string }) => {
  if (!data.length) return null;
  const max = Math.max(...data);
  const h = 40, w = 200;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 6)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`${color}15`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const DualLineChart = ({ data1, data2, color1, color2 }: { data1: number[]; data2: number[]; color1: string; color2: string }) => {
  if (!data1.length || !data2.length) return <div className="h-40 flex items-center justify-center text-muted-foreground text-[13px]">No data yet</div>;
  const max = Math.max(...data1, ...data2);
  const h = 120, w = 300;
  const toPoints = (data: number[]) => data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 10)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <polyline points={toPoints(data1)} fill="none" stroke={color1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={toPoints(data2)} fill="none" stroke={color2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data1.map((v, i) => <circle key={`d1-${i}`} cx={(i / (data1.length - 1)) * w} cy={h - (v / max) * (h - 10)} r="3" fill={color1} />)}
      {data2.map((v, i) => <circle key={`d2-${i}`} cx={(i / (data2.length - 1)) * w} cy={h - (v / max) * (h - 10)} r="3" fill={color2} />)}
    </svg>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface CampaignsScreenProps {
  onNavigate?: (screen: string) => void;
}

export const CampaignsScreen = ({ onNavigate }: CampaignsScreenProps) => {
  const { t } = useTranslation();
  const [tab, setTab]                           = useState<Tab>('campaigns');
  const [filter, setFilter]                     = useState<Filter>('Active');
  const { isFree }                              = useFreeTier();
  const [showUpgrade, setShowUpgrade]           = useState(false);
  const [selectedAd, setSelectedAd]             = useState<Ad | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<EnrichedCampaign | null>(null);
  const [showBudgetModal, setShowBudgetModal]   = useState(false);
  const [showCampaignBudgetModal, setShowCampaignBudgetModal] = useState(false);
  const [showStopConfirm, setShowStopConfirm]   = useState(false);
  const [newBudget, setNewBudget]               = useState('');

  const { data, isLoading } = useCampaigns();
  const { mutateAsync: updateCampaign, isPending: isUpdating } = useUpdateCampaign();

  const displayCampaigns = data?.campaigns ?? { Active: [], Scheduled: [], Completed: [], Drafts: [] };
  const stats            = data?.stats;
  const ads: Ad[]        = [...(displayCampaigns.Active ?? []), ...(displayCampaigns.Scheduled ?? [])].map(campaignToAd);

  const handleNewCampaign = () => {
    if (isFree) { setShowUpgrade(true); return; }
    onNavigate?.('quickad');
  };

  // ── Campaign Detail View ──────────────────────────────────────────────────
  if (selectedCampaign) {
    const c = selectedCampaign;
    const statusStyle = campaignStatusColors[c.status] || campaignStatusColors.Active;
    const spentPercent = c.budgetNum > 0 ? Math.min((c.spentNum / c.budgetNum) * 100, 100) : 0;
    const speedaFee = Math.round(c.spentNum * 0.15);
    const logos = getLogosForPlatforms(c.platforms);

    return (
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
        <div className="px-5 pt-6">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setSelectedCampaign(null)}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
            <div className="flex-1">
              <h1 className="text-[20px] font-extrabold text-foreground">{c.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusStyle.bg} ${statusStyle.text}`}>{c.status}</span>
                <span className="text-[11px] text-muted-foreground">📅 {c.date}</span>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: t('campaigns.impressions'), value: c.impressions, trend: null },
              { label: t('campaigns.clicks'), value: c.clicks, trend: null },
              { label: t('campaigns.roas'), value: c.roas, trend: null },
              { label: `${t('campaigns.spent')} / ${t('common.budget')}`, value: `${c.spent} / ${c.budget}`, isProgress: true, percent: spentPercent },
            ].map((kpi, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border-light">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{kpi.label}</p>
                <p className="text-[20px] font-extrabold text-foreground mt-1">{kpi.value}</p>
                {kpi.isProgress && (
                  <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${kpi.percent}%` }} className="h-full rounded-full gradient-hero" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Performance Chart */}
          <div className="bg-card rounded-2xl p-4 border border-border-light mb-4">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Performance</p>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-full bg-brand-blue" /><span className="text-[10px] text-muted-foreground">Impressions</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-full bg-brand-teal" /><span className="text-[10px] text-muted-foreground">Clicks</span></div>
            </div>
            <DualLineChart data1={c.dailyImpr} data2={c.dailyClicks} color1="hsl(233, 100%, 42%)" color2="hsl(193, 100%, 48%)" />
          </div>

          {/* Campaign Details */}
          <div className="bg-card rounded-2xl p-4 border border-border-light mb-4 space-y-3">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Campaign Details</p>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Platforms</span>
              <div className="flex gap-1">{logos.map((Logo, j) => <Logo key={j} size={16} />)}</div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">{t('common.budget')}</span>
              <span className="text-[12px] font-bold text-foreground">SAR {c.budget}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Duration</span>
              <span className="text-[12px] text-foreground">{c.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Targeting</span>
              <span className="text-[12px] font-bold text-foreground">{c.targeting === 'AI' ? '✦ AI Targeting' : '🎯 Manual'}</span>
            </div>
            {c.location && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Location</span>
                <span className="text-[12px] text-foreground">{c.location}</span>
              </div>
            )}
            {c.ageRange && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Age Range</span>
                <span className="text-[12px] text-foreground">{c.ageRange}</span>
              </div>
            )}
            {c.interests && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Interests</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {c.interests.map(int => <span key={int} className="text-[10px] bg-purple-soft text-purple px-2 py-0.5 rounded-md font-medium">{int}</span>)}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border-light">
              <span className="text-[12px] text-muted-foreground">Speeda fee (15%)</span>
              <span className="text-[12px] font-bold text-foreground">SAR {speedaFee}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              disabled={isUpdating}
              onClick={async () => {
                const newStatus = c.status === 'Active' ? 'Paused' : 'Active';
                try {
                  await updateCampaign({ id: c.id, status: newStatus });
                  toast.success(newStatus === 'Paused' ? 'Campaign paused' : 'Campaign resumed');
                  setSelectedCampaign({ ...c, status: newStatus });
                } catch { toast.error('Failed to update'); }
              }}
              className={`h-11 rounded-xl text-[12px] font-bold btn-press flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                c.status === 'Paused' ? 'bg-green-accent/10 text-green-accent border border-green-accent/20' : 'bg-muted text-muted-foreground'
              }`}
            >
              {c.status === 'Paused' ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause</>}
            </button>
            <button
              onClick={() => { setNewBudget(''); setShowCampaignBudgetModal(true); }}
              className="h-11 rounded-xl bg-brand-blue/10 text-brand-blue text-[12px] font-bold btn-press flex items-center justify-center gap-1.5 border border-brand-blue/20"
            >
              <DollarSign size={14} /> Increase Budget
            </button>
            <button
              onClick={() => setShowStopConfirm(true)}
              className="h-11 rounded-xl bg-destructive/10 text-destructive text-[12px] font-bold btn-press flex items-center justify-center gap-1.5 border border-destructive/20"
            >
              <StopCircle size={14} /> Stop
            </button>
            <button
              onClick={() => toast.success('Report PDF downloading...')}
              className="h-11 rounded-xl bg-purple-soft text-purple text-[12px] font-bold btn-press flex items-center justify-center gap-1.5"
            >
              <FileText size={14} /> Export Report
            </button>
          </div>
        </div>

        {/* Campaign Budget Modal */}
        <AnimatePresence>
          {showCampaignBudgetModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-foreground/40 flex items-center justify-center px-6" onClick={() => setShowCampaignBudgetModal(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl p-6 w-full max-w-[360px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-foreground">Increase Budget</h3>
                  <button onClick={() => setShowCampaignBudgetModal(false)}><X size={18} className="text-muted-foreground" /></button>
                </div>
                <input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="Amount to add (SAR)" className="w-full h-11 px-4 rounded-xl border border-border bg-background text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                <div className="flex gap-2 mt-4">
                  {[100, 500, 1000].map(v => (
                    <button key={v} onClick={() => setNewBudget(String(v))} className={`flex-1 h-9 rounded-lg text-[12px] font-bold transition-all ${newBudget === String(v) ? 'gradient-hero text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>+{v} SAR</button>
                  ))}
                </div>
                <button onClick={async () => {
                  const amount = parseInt(newBudget);
                  if (!amount || amount < 10) { toast.error('Minimum SAR 10'); return; }
                  try {
                    await updateCampaign({ id: c.id, budget: c.budgetNum + amount });
                    toast.success(`Budget increased by SAR ${amount}`);
                    setShowCampaignBudgetModal(false);
                    setSelectedCampaign({ ...c, budgetNum: c.budgetNum + amount, budget: (c.budgetNum + amount).toLocaleString() });
                  } catch { toast.error('Failed'); }
                }} disabled={isUpdating} className="w-full h-11 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press mt-4 disabled:opacity-50">Confirm</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stop Confirmation */}
        <AnimatePresence>
          {showStopConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-foreground/40 flex items-center justify-center px-6" onClick={() => setShowStopConfirm(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl p-6 w-full max-w-[360px] text-center">
                <h3 className="text-[18px] font-bold text-foreground mb-2">{t('common.areYouSure')}</h3>
                <p className="text-[13px] text-muted-foreground mb-4">This will permanently stop the campaign. Remaining budget will be returned.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowStopConfirm(false)} className="flex-1 h-11 rounded-xl border border-border text-foreground text-[13px] font-bold btn-press">{t('common.cancel')}</button>
                  <button onClick={async () => {
                    try {
                      await updateCampaign({ id: c.id, status: 'Completed' });
                      toast.success('Campaign stopped');
                      setShowStopConfirm(false);
                      setSelectedCampaign(null);
                    } catch { toast.error('Failed'); }
                  }} disabled={isUpdating} className="flex-1 h-11 rounded-xl bg-destructive text-primary-foreground text-[13px] font-bold btn-press disabled:opacity-50">Stop Campaign</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── Ad Detail View ────────────────────────────────────────────────────────
  if (selectedAd) {
    const ad = selectedAd;
    const sc = statusConfig[ad.status];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
        <div className="px-5 pt-6">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setSelectedAd(null)}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
            <div className="flex-1">
              <h1 className="text-[20px] font-extrabold text-foreground">{ad.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <ad.Logo size={14} />
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${sc.bg} ${ad.status === 'Active' || ad.status === 'Completed' || ad.status === 'Paused' ? 'text-primary-foreground' : sc.color}`}>{ad.status}</span>
              </div>
            </div>
          </div>

          {/* Performance KPIs */}
          <div className="bg-card rounded-2xl p-4 border border-border-light mb-4">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-3">{t('campaigns.adPerformance')}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('campaigns.impressions'), value: ad.impr, icon: '👁️' },
                { label: t('campaigns.clicks'), value: ad.clicks, icon: '👆' },
                { label: t('campaigns.cpc'), value: `${ad.cpc} SAR`, icon: '💰' },
              ].map((kpi, i) => (
                <div key={i} className="text-center">
                  <span className="text-lg">{kpi.icon}</span>
                  <p className="text-[18px] font-extrabold text-foreground mt-1">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label: t('campaigns.spent'), value: `${ad.spent} SAR` },
                { label: t('common.budget'), value: ad.budget },
                { label: t('campaigns.roas'), value: ad.roas, highlight: true },
              ].map((kpi, i) => (
                <div key={i} className="text-center">
                  <p className={`text-[16px] font-bold ${kpi.highlight ? (parseFloat(ad.roas) >= 2 ? 'text-green-accent' : 'text-orange') : 'text-foreground'}`}>{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 7-Day Chart */}
          {ad.dailyData.length > 0 && (
            <div className="bg-card rounded-2xl p-4 border border-border-light mb-4">
              <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-2">{t('campaigns.dayClickTrend')}</p>
              <MiniChart data={ad.dailyData} color="hsl(233, 100%, 42%)" />
              <div className="flex justify-between mt-1">
                {days.slice(0, ad.dailyData.length).map(d => <span key={d} className="text-[8px] text-muted-foreground">{d}</span>)}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={async () => {
                const newStatus = ad.paused ? 'Active' : 'Paused';
                try {
                  await updateCampaign({ id: ad.id, status: newStatus });
                  toast.success(ad.paused ? 'Campaign resumed' : 'Campaign paused');
                  setSelectedAd({ ...ad, paused: !ad.paused, status: newStatus as AdStatus });
                } catch { toast.error('Failed'); }
              }}
              disabled={isUpdating}
              className={`h-11 rounded-xl text-[12px] font-bold btn-press flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                ad.paused ? 'bg-green-accent/10 text-green-accent border border-green-accent/20' : 'bg-muted text-muted-foreground'
              }`}
            >
              {ad.paused ? <><Play size={14} /> {t('common.resume')}</> : <><Pause size={14} /> {t('common.pause')}</>}
            </button>
            <button
              onClick={() => { setNewBudget(''); setShowBudgetModal(true); }}
              className="h-11 rounded-xl bg-brand-blue/10 text-brand-blue text-[12px] font-bold btn-press flex items-center justify-center gap-1.5 border border-brand-blue/20"
            >
              <DollarSign size={14} /> {t('common.budget')}
            </button>
            <button
              onClick={async () => {
                try {
                  await updateCampaign({ id: ad.id, status: 'Completed' });
                  toast.success('Campaign stopped');
                  setSelectedAd(null);
                } catch { toast.error('Failed'); }
              }}
              disabled={isUpdating}
              className="h-11 rounded-xl bg-destructive/10 text-destructive text-[12px] font-bold btn-press flex items-center justify-center gap-1.5 border border-destructive/20 disabled:opacity-50"
            >
              <StopCircle size={14} /> {t('common.stop')}
            </button>
          </div>
        </div>

        {/* Budget Modal */}
        <AnimatePresence>
          {showBudgetModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-foreground/40 flex items-center justify-center px-6" onClick={() => setShowBudgetModal(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl p-6 w-full max-w-[360px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-foreground">{t('campaigns.increaseDailyBudget')}</h3>
                  <button onClick={() => setShowBudgetModal(false)}><X size={18} className="text-muted-foreground" /></button>
                </div>
                <p className="text-[12px] text-muted-foreground mb-3">{t('campaigns.currentBudget', { budget: ad.budget })}</p>
                <input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder={t('campaigns.amountToAdd')} className="w-full h-11 px-4 rounded-xl border border-border bg-background text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                <div className="flex gap-2 mt-4">
                  {[10, 25, 50].map(v => (
                    <button key={v} onClick={() => setNewBudget(String(v))} className={`flex-1 h-9 rounded-lg text-[12px] font-bold transition-all ${newBudget === String(v) ? 'gradient-hero text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>+{v} SAR</button>
                  ))}
                </div>
                <button onClick={async () => {
                  const amount = parseInt(newBudget);
                  if (!amount || amount < 10) { toast.error(t('campaigns.minBudget')); return; }
                  try {
                    await updateCampaign({ id: ad.id, budget: ad.budgetNum + amount });
                    toast.success(t('campaigns.budgetIncreased', { amount }));
                    setShowBudgetModal(false);
                    setNewBudget('');
                  } catch { toast.error('Failed'); }
                }} disabled={isUpdating} className="w-full h-11 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press mt-4 disabled:opacity-50">
                  {t('campaigns.increaseBudget')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── Main List View ────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">{t('campaigns.title')}</h1>
            <p className="text-[14px] text-muted-foreground">{t('campaigns.activeCampaigns', { count: stats?.activeCount ?? 0 })}</p>
          </div>
          <button onClick={handleNewCampaign} className="h-[42px] px-4 rounded-xl bg-brand-blue text-primary-foreground text-[13px] font-bold flex items-center gap-1.5 btn-press">
            <Plus size={18} /> New Campaign
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-4 overflow-x-auto pb-1 -mx-1 px-1 md:justify-center">
          {isLoading ? (
            <>{[1, 2, 3].map(i => <StatSkeleton key={i} />)}</>
          ) : (
            <>
              {[
                { icon: '💰', value: stats ? `SAR ${stats.totalBudget.toLocaleString()}` : '—', label: t('campaigns.totalBudget'), bg: 'bg-purple-soft' },
                { icon: '👁️', value: stats ? (stats.totalReach >= 1000 ? `${(stats.totalReach / 1000).toFixed(1)}K` : String(stats.totalReach)) : '—', label: t('campaigns.totalReach'), bg: 'bg-green-soft' },
                { icon: '📈', value: stats ? `${stats.avgRoi}x` : '—', label: t('campaigns.avgRoi'), bg: 'bg-green-soft' },
              ].map((s, i) => (
                <div key={i} className="min-w-[160px] bg-card rounded-2xl p-4 border border-border-light flex-shrink-0">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center text-lg mb-2`}>{s.icon}</div>
                  <span className="text-[20px] font-extrabold text-foreground">{s.value}</span>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Tab Control */}
        <div className="mt-5 bg-card rounded-2xl p-1 border border-border flex">
          {(['campaigns', 'ads'] as Tab[]).map(tb => (
            <button key={tb} onClick={() => setTab(tb)} className={`flex-1 h-10 rounded-xl text-[13px] font-semibold transition-all ${tab === tb ? 'bg-brand-blue text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {tb === 'campaigns' ? t('campaigns.myCampaigns') : t('campaigns.adsManager')}
            </button>
          ))}
        </div>

        {tab === 'campaigns' && (
          <div className="mt-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(['Active', 'Scheduled', 'Completed', 'Drafts'] as Filter[]).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-3xl px-4 py-2 text-[12px] font-semibold whitespace-nowrap ${filter === f ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
                  {t(`campaigns.${f.toLowerCase()}`)}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-3">
              {isLoading ? (
                <CampaignSkeleton />
              ) : (displayCampaigns[filter] ?? []).length === 0 ? (
                <div className="bg-card rounded-2xl p-8 border border-border-light text-center">
                  <span className="text-3xl">📋</span>
                  <p className="text-[14px] font-semibold text-foreground mt-2">{t('campaigns.noDrafts')}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{t('campaigns.createFirst')}</p>
                  <button onClick={() => onNavigate?.('quickad')} className="mt-3 h-10 px-5 rounded-2xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">{t('campaigns.createCampaign')}</button>
                </div>
              ) : (
                (displayCampaigns[filter] ?? []).map((c, i) => {
                  const logos = getLogosForPlatforms(c.platforms);
                  return (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-card rounded-2xl border border-border-light overflow-hidden card-tap cursor-pointer"
                      style={{ borderLeft: `4px solid ${c.status === 'Active' ? 'hsl(157,100%,42%)' : c.status === 'Scheduled' ? 'hsl(233,100%,42%)' : '#9ca3af'}` }}
                      onClick={() => setSelectedCampaign(c)}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[16px] font-bold text-foreground">{c.name}</span>
                          {c.isAI && <span className="text-[10px] font-bold text-purple bg-purple-soft px-2 py-0.5 rounded-md">✦ AI</span>}
                          <span className={`text-[10px] font-bold text-primary-foreground px-2 py-0.5 rounded-md ${c.color}`}>{c.status}</span>
                        </div>
                        <div className="flex gap-1 mt-2">{logos.map((Logo, j) => <Logo key={j} size={16} />)}</div>
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {[
                            { label: t('common.budget'), val: c.budget },
                            { label: t('campaigns.spent'), val: c.spent },
                            { label: t('campaigns.totalReach'), val: c.reach },
                            { label: 'ROI', val: c.roi },
                          ].map((m, j) => (
                            <div key={j}>
                              <span className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">{m.label}</span>
                              <p className={`text-[14px] font-bold ${m.label === 'ROI' && m.val !== '—' ? 'text-green-accent' : 'text-foreground'}`}>{m.val}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">📅 {c.date}</p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {tab === 'ads' && (
          <div className="mt-4">
            <div className="gradient-hero rounded-3xl p-6 relative overflow-hidden shadow-hero">
              <div className="absolute w-32 h-32 rounded-full bg-primary-foreground/5 -top-8 -right-8" />
              <span className="text-[12px] text-primary-foreground/70 font-medium">{t('campaigns.adBalance')}</span>
              <p className="text-[32px] font-extrabold text-primary-foreground tracking-[-0.02em] mt-1">
                {stats ? `SAR ${stats.totalBudget.toLocaleString()}` : '—'}
              </p>
              <button onClick={() => onNavigate?.('topUp')} className="mt-3 px-4 py-2 rounded-xl bg-primary-foreground/20 backdrop-blur text-primary-foreground text-[13px] font-bold">{t('campaigns.topUp')}</button>
            </div>

            <h3 className="text-[18px] font-bold text-foreground mt-5">{t('campaigns.activeAds')}</h3>
            {isLoading ? (
              <div className="mt-3"><CampaignSkeleton /></div>
            ) : ads.length === 0 ? (
              <div className="mt-3 bg-card rounded-2xl p-8 border border-border-light text-center">
                <span className="text-3xl">📊</span>
                <p className="text-[14px] font-semibold text-foreground mt-2">No active ads</p>
                <p className="text-[12px] text-muted-foreground mt-1">Launch a quick ad to get started</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {ads.map(ad => {
                  const sc = statusConfig[ad.status];
                  return (
                    <div key={ad.id} className="bg-card rounded-2xl p-4 border border-border-light">
                      <button onClick={() => setSelectedAd(ad)} className="w-full text-start">
                        <div className="flex items-center gap-2">
                          <ad.Logo size={18} />
                          <span className="text-[14px] font-bold text-foreground">{ad.name}</span>
                          {ad.trend === 'up' && !ad.paused && <TrendingUp size={14} className="text-green-accent" />}
                          {ad.trend === 'down' && !ad.paused && <TrendingDown size={14} className="text-destructive" />}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ml-auto ${
                            ad.status === 'Active' ? 'bg-green-accent text-primary-foreground' :
                            ad.status === 'Learning' || ad.status === 'Submitted' ? 'bg-orange/10 text-orange' :
                            ad.status === 'Paused' ? 'bg-muted text-muted-foreground' :
                            'bg-muted text-muted-foreground'
                          }`}>{ad.status}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {[
                            { l: t('common.budget'), v: ad.budget },
                            { l: t('campaigns.impressions'), v: ad.impr },
                            { l: t('campaigns.clicks'), v: ad.clicks },
                            { l: t('campaigns.roas'), v: ad.roas },
                          ].map((m, j) => (
                            <div key={j}>
                              <span className="text-[9px] uppercase text-muted-foreground font-semibold">{m.l}</span>
                              <p className={`text-[13px] font-bold ${m.l === t('campaigns.roas') ? (parseFloat(ad.roas) >= 2 ? 'text-green-accent' : 'text-orange') : 'text-foreground'}`}>{m.v}</p>
                            </div>
                          ))}
                        </div>
                      </button>
                      <div className="flex gap-2 mt-3">
                        <button onClick={async () => {
                          const newStatus = ad.paused ? 'Active' : 'Paused';
                          try {
                            await updateCampaign({ id: ad.id, status: newStatus });
                            toast.success(ad.paused ? 'Resumed' : 'Paused');
                          } catch { toast.error('Failed'); }
                        }} className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold btn-press ${ad.paused ? 'bg-green-accent/10 text-green-accent' : 'bg-muted text-muted-foreground'}`}>
                          {ad.paused ? <><Play size={12} /> {t('common.resume')}</> : <><Pause size={12} /> {t('common.pause')}</>}
                        </button>
                        <button onClick={() => setSelectedAd(ad)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand-blue/10 text-brand-blue text-[12px] font-semibold btn-press">
                          <ArrowUpRight size={12} /> {t('common.details')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={handleNewCampaign} className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-6">
              {t('campaigns.launchQuickAd')}
            </button>
          </div>
        )}
      </div>
      <UpgradePrompt feature="Campaign Creation" benefit="launch campaigns and ads" open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </motion.div>
  );
};
