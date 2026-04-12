import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, TrendingUp, TrendingDown, Eye, Bell, Plus, BarChart3, Clock, Zap, Target, Search, FileText, Users, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ComingSoonModal } from '../components/ComingSoon';
import { useIsMobile } from '../hooks/use-mobile';
import { FeatureLockOverlay, useFreeTier } from '../components/FreeTier';

export interface CompetitorApiData {
  id: string;
  name: string;
  platform: string;
  handle: string;
  followers: number;
  postsPerWeek: number;
  avgEngagement: number;
}

interface CompetitorWatchScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  apiCompetitors?: CompetitorApiData[];
  isLoadingCompetitors?: boolean;
  onAddCompetitor?: (data: { name: string; platform: string; handle: string }) => void;
  onRemoveCompetitor?: (id: string) => void;
}

type TabKey = 'overview' | 'timeline' | 'trends' | 'content' | 'hashtags';

// STATIC: data365 — Phase 2
// TODO: connect data365 for real competitor data
// ── Sample competitor data (fallback when no API data) ──
const competitors = [
  {
    emoji: '🍗', name: 'AlBaik', type: 'Restaurant · Riyadh', avatar: '🍗',
    posts: 12, eng: '6.2%', engVal: 6.2, followers: '890K', followersNum: 890000, followersGrowth: '+2.1K',
    postsPerWeek: 4, reviewRating: 4.7,
    trendData: [3.8, 4.2, 5.1, 4.8, 5.9, 6.2],
    activities: [
      { text: 'Posted 2 Reels today (food prep behind the scenes)', time: '3h ago', type: 'content' as const },
      { text: 'Launched a Ramadan combo deal at 25 SAR', time: 'Yesterday', type: 'promo' as const },
      { text: 'Replied to 45 comments in 2 hours', time: '2 days ago', type: 'engagement' as const },
    ],
    counterMove: 'AlBaik posted kitchen behind-the-scenes content. This format gets 3x engagement. I can create a similar Reel for your kitchen.',
    cta: 'Create Counter Reel →',
    threat: 'high' as const,
    topHashtags: ['#AlBaik', '#RiyadhEats', '#ChickenLovers', '#SaudiFood', '#FriedChicken', '#FastFood', '#Halal', '#FoodieRiyadh', '#ComboMeal', '#BTS'],
    latestPosts: [
      { thumb: '🍗', eng: '2.4K', platform: 'Instagram' },
      { thumb: '🎬', eng: '5.1K', platform: 'TikTok' },
      { thumb: '📸', eng: '890', platform: 'Instagram' },
      { thumb: '🎥', eng: '3.2K', platform: 'TikTok' },
      { thumb: '🍔', eng: '1.1K', platform: 'Facebook' },
      { thumb: '🧑‍🍳', eng: '4.5K', platform: 'Instagram' },
      { thumb: '🎞️', eng: '2.8K', platform: 'TikTok' },
      { thumb: '🥤', eng: '670', platform: 'Instagram' },
      { thumb: '📱', eng: '1.9K', platform: 'TikTok' },
    ],
    postingPattern: { mon: 2, tue: 1, wed: 2, thu: 3, fri: 1, sat: 2, sun: 1, bestTime: '7-9 PM', bestDay: 'Thursday' },
  },
  {
    emoji: '🌯', name: 'Shawarmer', type: 'Fast Casual · Riyadh', avatar: '🌯',
    posts: 6, eng: '3.1%', engVal: 3.1, followers: '245K', followersNum: 245000, followersGrowth: '+580',
    postsPerWeek: 2, reviewRating: 4.3,
    trendData: [2.8, 3.0, 2.5, 3.4, 2.9, 3.1],
    activities: [
      { text: 'Launched weekend brunch promo -15%', time: 'Today', type: 'promo' as const },
    ],
    counterMove: 'Shawarmer is running a 15% discount. Your brunch post is performing well — boost it to capture the same audience.',
    cta: 'Boost Your Brunch Post →',
    threat: 'medium' as const,
    topHashtags: ['#Shawarmer', '#Shawarma', '#RiyadhFood', '#WeekendBrunch', '#FastCasual', '#SaudiEats', '#Discount', '#FoodDeal', '#Wrap', '#Lunch'],
    latestPosts: [
      { thumb: '🌯', eng: '450', platform: 'Instagram' },
      { thumb: '🥙', eng: '320', platform: 'Facebook' },
      { thumb: '🎬', eng: '1.2K', platform: 'TikTok' },
      { thumb: '📸', eng: '280', platform: 'Instagram' },
      { thumb: '🍽️', eng: '510', platform: 'Instagram' },
      { thumb: '🎥', eng: '890', platform: 'TikTok' },
      { thumb: '🥤', eng: '190', platform: 'Facebook' },
      { thumb: '📱', eng: '670', platform: 'Instagram' },
      { thumb: '🧑‍🍳', eng: '340', platform: 'TikTok' },
    ],
    postingPattern: { mon: 1, tue: 0, wed: 1, thu: 1, fri: 1, sat: 1, sun: 1, bestTime: '12-2 PM', bestDay: 'Friday' },
  },
  {
    emoji: '🍔', name: 'Kudu', type: 'Fast Food · Saudi-wide', avatar: '🍔',
    posts: 9, eng: '4.5%', engVal: 4.5, followers: '520K', followersNum: 520000, followersGrowth: '+1.3K',
    postsPerWeek: 3, reviewRating: 4.1,
    trendData: [3.2, 3.8, 4.1, 5.0, 4.2, 4.5],
    activities: [
      { text: 'Trending on TikTok Riyadh with a viral challenge video', time: '2 days ago', type: 'content' as const },
      { text: 'Partnered with a local food influencer (50K followers)', time: '4 days ago', type: 'partnership' as const },
    ],
    counterMove: 'TikTok challenges are trending. I can create a fun challenge concept for your restaurant.',
    cta: 'Generate TikTok Idea →',
    threat: 'medium' as const,
    topHashtags: ['#Kudu', '#Burger', '#FastFood', '#SaudiWide', '#TikTokFood', '#Challenge', '#FoodChallenge', '#Riyadh', '#Jeddah', '#ComboMeal'],
    latestPosts: [
      { thumb: '🍔', eng: '3.8K', platform: 'TikTok' },
      { thumb: '🎬', eng: '12K', platform: 'TikTok' },
      { thumb: '📸', eng: '1.5K', platform: 'Instagram' },
      { thumb: '🥤', eng: '890', platform: 'Instagram' },
      { thumb: '🎥', eng: '2.1K', platform: 'TikTok' },
      { thumb: '🍟', eng: '670', platform: 'Facebook' },
      { thumb: '📱', eng: '4.2K', platform: 'TikTok' },
      { thumb: '🧑‍🍳', eng: '1.1K', platform: 'Instagram' },
      { thumb: '🎞️', eng: '780', platform: 'Facebook' },
    ],
    postingPattern: { mon: 1, tue: 2, wed: 1, thu: 2, fri: 1, sat: 1, sun: 1, bestTime: '5-8 PM', bestDay: 'Tuesday' },
  },
];

const userData = {
  followers: '34.5K', followersNum: 34500,
  eng: '4.8%', engVal: 4.8,
  postsPerWeek: 3, reviewRating: 4.6, posts: 8,
  topHashtags: ['#Foodie', '#Yummy', '#HealthyEating', '#InstaFood', '#FoodPhotography', '#Tasty', '#Recipe', '#Cooking', '#FoodBlog', '#Culinary'],
};

const engagementBars = [
  { label: 'You', val: 4.8, isUser: true },
  { label: 'AlBaik', val: 6.2, isUser: false },
  { label: 'Shawarmer', val: 3.1, isUser: false },
  { label: 'Kudu', val: 4.5, isUser: false },
];

const timelineEvents = [
  { competitor: '🍗 AlBaik', text: 'Posted 2 Reels (food prep BTS)', time: '3h ago', type: 'content', impact: 'high' },
  { competitor: '🌯 Shawarmer', text: 'Launched weekend brunch promo -15%', time: 'Today', type: 'promo', impact: 'medium' },
  { competitor: '🍗 AlBaik', text: 'Ramadan combo deal at 25 SAR', time: 'Yesterday', type: 'promo', impact: 'high' },
  { competitor: '🍔 Kudu', text: 'Viral TikTok challenge (120K views)', time: '2 days ago', type: 'content', impact: 'high' },
  { competitor: '🍗 AlBaik', text: 'Replied to 45 comments in 2 hours', time: '2 days ago', type: 'engagement', impact: 'low' },
  { competitor: '🍔 Kudu', text: 'Influencer partnership (50K followers)', time: '4 days ago', type: 'partnership', impact: 'medium' },
  { competitor: '🌯 Shawarmer', text: 'Updated profile bio & menu link', time: '3 days ago', type: 'content', impact: 'low' },
];

const activityTypeConfig: Record<string, { color: string; icon: typeof TrendingUp }> = {
  content: { color: 'text-brand-blue', icon: Eye },
  promo: { color: 'text-orange', icon: Zap },
  engagement: { color: 'text-green-accent', icon: TrendingUp },
  partnership: { color: 'text-purple', icon: Target },
};

const threatColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-orange/10 text-orange border-orange/20',
  low: 'bg-green-accent/10 text-green-accent border-green-accent/20',
};

const MiniSparkline = ({ data, highlight }: { data: number[]; highlight?: boolean }) => {
  const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1;
  const h = 28; const w = 64;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4)}`).join(' ');
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={highlight ? 'hsl(var(--brand-blue))' : 'hsl(var(--muted-foreground) / 0.4)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const TrendChart = ({ data, highlight }: { data: number[]; highlight?: boolean }) => {
  const max = Math.max(...data) + 0.5; const min = Math.min(...data) - 0.5; const range = max - min || 1;
  const h = 60; const w = 280; const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
  const points = data.map((v, i) => ({ x: (i / (data.length - 1)) * (w - 20) + 10, y: h - 8 - ((v - min) / range) * (h - 20) }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${h - 4} L ${points[0].x} ${h - 4} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 16}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {[0, 1, 2].map(i => <line key={i} x1="10" y1={12 + i * ((h - 20) / 2)} x2={w - 10} y2={12 + i * ((h - 20) / 2)} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 2" />)}
      <path d={areaD} fill={highlight ? 'hsl(var(--brand-blue) / 0.08)' : 'hsl(var(--muted-foreground) / 0.05)'} />
      <path d={pathD} fill="none" stroke={highlight ? 'hsl(var(--brand-blue))' : 'hsl(var(--muted-foreground) / 0.5)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={highlight ? 'hsl(var(--brand-blue))' : 'hsl(var(--muted-foreground) / 0.4)'} stroke="hsl(var(--card))" strokeWidth="1.5" />)}
      {points.map((p, i) => <text key={`w${i}`} x={p.x} y={h + 12} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{weeks[i]}</text>)}
      {points.map((p, i) => <text key={`v${i}`} x={p.x} y={p.y - 8} textAnchor="middle" fontSize="8" fontWeight="bold" fill={highlight ? 'hsl(var(--brand-blue))' : 'hsl(var(--foreground))'}>{data[i]}%</text>)}
    </svg>
  );
};

export const CompetitorWatchScreen = ({ onBack, onNavigate, apiCompetitors, isLoadingCompetitors, onAddCompetitor, onRemoveCompetitor }: CompetitorWatchScreenProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { currentPlan } = useFreeTier();
  const maxVal = Math.max(...engagementBars.map(b => b.val));
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [expandedCompetitor, setExpandedCompetitor] = useState<number | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<string>('all');
  const [selectedCompetitorIdx, setSelectedCompetitorIdx] = useState(0);
  const [setupMode, setSetupMode] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupIg, setSetupIg] = useState('');

  const isLocked = currentPlan !== 'business';

  const tabs: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
    { key: 'overview', label: t('competitor.overview'), icon: BarChart3 },
    { key: 'content', label: t('competitor.content'), icon: Eye },
    { key: 'hashtags', label: t('competitor.hashtags'), icon: Hash },
    { key: 'timeline', label: t('competitor.timeline'), icon: Clock },
    { key: 'trends', label: t('competitor.trends'), icon: TrendingUp },
  ];

  const filteredTimeline = timelineFilter === 'all' ? timelineEvents : timelineEvents.filter(e => e.type === timelineFilter);
  const selectedCompetitor = competitors[selectedCompetitorIdx];

  const LockWrap = ({ children }: { children: React.ReactNode }) => {
    if (!isLocked) return <>{children}</>;
    return (
      <FeatureLockOverlay requiredPlan="business" featureName={t('competitor.competitorIntelligence')} featureDescription={t('competitor.competitorIntelligenceDesc')} onUpgrade={() => onNavigate('planComparison')}>
        {children}
      </FeatureLockOverlay>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-extrabold text-foreground">🔍 {t('competitor.title')}</h1>
        </div>

        {/* Preview Banner */}
        {!bannerDismissed && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-purple-soft rounded-[14px] p-[14px] px-[18px] mb-4 flex items-start gap-3">
            <span className="text-brand-blue text-[16px] mt-0.5 shrink-0">✦</span>
            <p className="text-[13px] text-muted-foreground leading-[1.5] flex-1">
              <span className="font-bold text-foreground">{t('competitor.previewMode')}</span> — {t('competitor.previewDesc')}
            </p>
            <button onClick={() => setBannerDismissed(true)} className="shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
              <X size={14} className="text-muted-foreground" />
            </button>
          </motion.div>
        )}

        {/* Competitor Selector */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">{t('competitor.trackedCompetitors', { count: competitors.length })}</p>
            <button onClick={() => setSetupMode(true)} className="text-[11px] font-bold text-brand-blue flex items-center gap-1"><Plus size={12} /> {t('common.add')}</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {competitors.map((c, i) => (
              <button key={i} onClick={() => setSelectedCompetitorIdx(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0 transition-all ${
                  selectedCompetitorIdx === i ? 'border-brand-blue bg-brand-blue/5' : 'border-border bg-card'
                }`}>
                <span className="text-lg">{c.emoji}</span>
                <span className="text-[12px] font-bold text-foreground">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add Competitor Modal */}
        <AnimatePresence>
          {setupMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-foreground/40 flex items-center justify-center px-5" onClick={() => setSetupMode(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl p-6 w-full max-w-[400px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-foreground">{t('competitor.addCompetitor')}</h3>
                  <button onClick={() => setSetupMode(false)}><X size={18} className="text-muted-foreground" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] font-bold text-foreground">{t('competitor.businessName')}</label>
                    <input value={setupName} onChange={e => setSetupName(e.target.value)} placeholder="e.g. AlBaik" className="w-full h-10 mt-1 px-4 rounded-xl border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-foreground">{t('competitor.instagramUsername')}</label>
                    <input value={setupIg} onChange={e => setSetupIg(e.target.value)} placeholder="@albaikiofficial" className="w-full h-10 mt-1 px-4 rounded-xl border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                  </div>
                  <button onClick={() => {
                    if (onAddCompetitor && setupName.trim() && setupIg.trim()) {
                      onAddCompetitor({ name: setupName.trim(), platform: 'instagram', handle: setupIg.trim() });
                      setSetupMode(false);
                      setSetupName('');
                      setSetupIg('');
                    } else {
                      setSetupMode(false);
                      setShowComingSoon(true);
                    }
                  }} className="w-full h-11 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">
                    {t('competitor.trackCompetitor')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-muted rounded-2xl p-1 mb-4 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 h-9 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap px-2 ${
                activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        <LockWrap>
          <AnimatePresence mode="wait">
            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {/* KPI Comparison */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: t('competitor.followers'), you: userData.followers, them: selectedCompetitor.followers, youNum: userData.followersNum, themNum: selectedCompetitor.followersNum },
                    { label: t('competitor.engagementRate'), you: userData.eng, them: selectedCompetitor.eng, youNum: userData.engVal, themNum: selectedCompetitor.engVal },
                    { label: t('competitor.postsPerWeek'), you: String(userData.postsPerWeek), them: String(selectedCompetitor.postsPerWeek), youNum: userData.postsPerWeek, themNum: selectedCompetitor.postsPerWeek },
                    { label: t('competitor.reviewRating'), you: String(userData.reviewRating), them: String(selectedCompetitor.reviewRating), youNum: userData.reviewRating, themNum: selectedCompetitor.reviewRating },
                  ].map((kpi, i) => {
                    const youBetter = kpi.youNum >= kpi.themNum;
                    return (
                      <div key={i} className="bg-card rounded-2xl p-3 border border-border-light">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                        <div className="flex items-end justify-between mt-2">
                          <div>
                            <p className="text-[9px] text-brand-blue font-bold">{t('common.you')}</p>
                            <p className={`text-[16px] font-extrabold ${youBetter ? 'text-green-accent' : 'text-foreground'}`}>{kpi.you}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground mb-1">{t('common.vs')}</span>
                          <div className="text-end">
                            <p className="text-[9px] text-muted-foreground font-bold">{selectedCompetitor.name}</p>
                            <p className={`text-[16px] font-extrabold ${!youBetter ? 'text-destructive' : 'text-foreground'}`}>{kpi.them}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Posting Pattern */}
                <div className="bg-card rounded-2xl p-4 border border-border-light mb-4">
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-3">{t('competitor.postingPattern')} — {selectedCompetitor.name}</p>
                  <div className="flex gap-1 items-end h-16 mb-2">
                    {Object.entries(selectedCompetitor.postingPattern).filter(([k]) => !['bestTime', 'bestDay'].includes(k)).map(([day, count]) => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t-md gradient-hero" style={{ height: `${((count as number) / 3) * 100}%`, minHeight: count ? 8 : 2, opacity: count ? 1 : 0.2 }} />
                        <span className="text-[8px] text-muted-foreground uppercase">{day.slice(0, 2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-2">
                    <p className="text-[11px] text-muted-foreground">{t('competitor.bestTime')}: <span className="font-bold text-foreground">{selectedCompetitor.postingPattern.bestTime}</span></p>
                    <p className="text-[11px] text-muted-foreground">{t('competitor.bestDay')}: <span className="font-bold text-foreground">{selectedCompetitor.postingPattern.bestDay}</span></p>
                  </div>
                </div>

                {/* AI Competitive Insights */}
                <div className="bg-purple-soft rounded-2xl p-4 border border-border-light mb-4">
                  <p className="text-[12px] font-bold text-brand-blue uppercase tracking-wide mb-3">{t('competitor.aiCompetitiveInsights')}</p>
                  <div className="space-y-3">
                    {[
                      { text: `${selectedCompetitor.name} has ${selectedCompetitor.followers} followers but your engagement is 34% higher — focus on engagement-driven content`, action: 'Focus on Engagement →' },
                      { text: `They post ${selectedCompetitor.postsPerWeek}x/week vs your ${userData.postsPerWeek}x — increase your Reel output to match`, action: 'Create More Reels →' },
                      { text: `Their reviews dropped to ${selectedCompetitor.reviewRating} — highlight your ${userData.reviewRating}★ rating in posts`, action: 'Highlight Reviews →' },
                      { text: `${selectedCompetitor.name} is trending on TikTok — create a counter challenge before the trend peaks`, action: 'Generate Challenge →' },
                    ].map((insight, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-brand-blue text-[12px] shrink-0 mt-0.5">✦</span>
                        <div className="flex-1">
                          <p className="text-[12px] text-foreground">{insight.text}</p>
                          <button onClick={() => setShowComingSoon(true)} className="text-[11px] font-bold text-brand-blue mt-1">{insight.action}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Engagement Comparison */}
                <h2 className="text-[14px] font-bold text-foreground mb-3">{t('competitor.engagementComparison')}</h2>
                <div className="bg-card rounded-2xl p-4 border border-border-light space-y-3 mb-4">
                  {engagementBars.map((b, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className={`font-medium ${b.isUser ? 'text-brand-blue font-bold' : 'text-foreground'}`}>{b.isUser ? t('common.you') : b.label}</span>
                        <span className="font-bold text-foreground">{b.val}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(b.val / maxVal) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                          className={`h-full rounded-full ${b.isUser ? 'gradient-hero' : 'bg-muted-foreground/30'}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Counter-Move */}
                <div className="bg-card rounded-2xl border border-border-light overflow-hidden mb-4">
                  <div className="border-t-2" style={{ borderImage: 'linear-gradient(to right, hsl(233,100%,42%), hsl(193,100%,48%)) 1' }} />
                  <div className="p-4">
                    <span className="text-[11px] uppercase font-bold text-brand-blue tracking-[0.05em]">{t('competitor.counterMoveGenerator')}</span>
                    <p className="text-[13px] text-foreground mt-2">{selectedCompetitor.counterMove}</p>
                    <button onClick={() => setShowComingSoon(true)} className="mt-3 h-9 px-4 rounded-xl gradient-btn text-primary-foreground text-[12px] font-bold btn-press">{selectedCompetitor.cta}</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── CONTENT TAB ── */}
            {activeTab === 'content' && (
              <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <p className="text-[14px] font-bold text-foreground mb-3">{t('competitor.latestPosts', { emoji: selectedCompetitor.emoji, name: selectedCompetitor.name })}</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {selectedCompetitor.latestPosts.map((post, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      className="aspect-square bg-card rounded-xl border border-border-light flex flex-col items-center justify-center relative overflow-hidden group">
                      <span className="text-3xl">{post.thumb}</span>
                      <div className="absolute bottom-0 inset-x-0 bg-foreground/60 backdrop-blur-sm py-1 px-2 flex items-center justify-between">
                        <span className="text-[9px] text-primary-foreground font-medium">{post.platform}</span>
                        <span className="text-[9px] text-primary-foreground font-bold">❤️ {post.eng}</span>
                      </div>
                      <button onClick={() => setShowComingSoon(true)} className="absolute inset-0 bg-brand-blue/0 group-hover:bg-brand-blue/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-[10px] font-bold text-brand-blue bg-card/90 px-2 py-1 rounded-lg">{t('competitor.counterThis')}</span>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── HASHTAGS TAB ── */}
            {activeTab === 'hashtags' && (
              <motion.div key="hashtags" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-card rounded-2xl p-3 border border-border-light">
                    <p className="text-[11px] font-bold text-brand-blue uppercase tracking-wide mb-2">{t('competitor.yourTop10')}</p>
                    <div className="space-y-1.5">
                      {userData.topHashtags.map((tag, i) => {
                        const overlap = selectedCompetitor.topHashtags.some(tg => tg.toLowerCase() === tag.toLowerCase());
                        return (
                          <div key={i} className={`text-[11px] px-2 py-1 rounded-lg ${overlap ? 'bg-green-accent/10 text-green-accent font-bold' : 'text-foreground'}`}>
                            {tag} {overlap && '✓'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-card rounded-2xl p-3 border border-border-light">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">{selectedCompetitor.name}</p>
                    <div className="space-y-1.5">
                      {selectedCompetitor.topHashtags.map((tag, i) => {
                        const youUse = userData.topHashtags.some(tg => tg.toLowerCase() === tag.toLowerCase());
                        const opportunity = !youUse;
                        return (
                          <div key={i} className={`text-[11px] px-2 py-1 rounded-lg ${youUse ? 'bg-green-accent/10 text-green-accent font-bold' : opportunity ? 'bg-brand-blue/10 text-brand-blue font-medium' : 'text-foreground'}`}>
                            {tag} {opportunity && t('competitor.tryThis')}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-accent/20" /><span className="text-[10px] text-muted-foreground">{t('competitor.overlap')}</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-brand-blue/20" /><span className="text-[10px] text-muted-foreground">{t('competitor.opportunity')}</span></div>
                </div>

                <div className="bg-purple-soft rounded-2xl p-3 border border-border-light">
                  <p className="text-[12px] text-foreground">
                    <span className="text-brand-blue font-bold">✦</span> {selectedCompetitor.name} uses <span className="font-bold">{selectedCompetitor.topHashtags[1]}</span> — consider adding it to your posts for better local reach.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── TIMELINE TAB ── */}
            {activeTab === 'timeline' && (
              <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {['all', 'content', 'promo', 'engagement', 'partnership'].map(f => (
                    <button key={f} onClick={() => setTimelineFilter(f)}
                      className={`px-3 h-8 rounded-xl text-[11px] font-bold capitalize whitespace-nowrap transition-all ${
                        timelineFilter === f ? 'gradient-hero text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}>{f}</button>
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-border" />
                  <div className="space-y-3">
                    {filteredTimeline.map((event, i) => {
                      const cfg = activityTypeConfig[event.type] || activityTypeConfig.content;
                      const Icon = cfg.icon;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3 relative">
                          <div className="w-[30px] h-[30px] rounded-full bg-card border-2 border-border flex items-center justify-center z-10 shrink-0">
                            <Icon size={13} className={cfg.color} />
                          </div>
                          <div className="flex-1 bg-card rounded-xl border border-border-light p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[12px] font-bold text-foreground">{event.competitor}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                  event.impact === 'high' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                  event.impact === 'medium' ? 'bg-orange/10 text-orange border-orange/20' :
                                  'bg-muted text-muted-foreground border-border'
                                }`}>{t(`competitor.${event.impact}`)}</span>
                                <span className="text-[10px] text-muted-foreground">{event.time}</span>
                              </div>
                            </div>
                            <p className="text-[12px] text-foreground">{event.text}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TRENDS TAB ── */}
            {activeTab === 'trends' && (
              <motion.div key="trends" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div className="space-y-4">
                  <div className="bg-card rounded-2xl p-4 border border-border-light">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[14px] font-bold text-brand-blue">{t('competitor.yourEngagementTrend')}</span>
                      <span className="text-[12px] font-bold text-green-accent flex items-center gap-1"><TrendingUp size={12} /> +18%</span>
                    </div>
                    <TrendChart data={[3.2, 3.5, 3.8, 4.1, 4.5, 4.8]} highlight />
                  </div>
                  {competitors.map((c, i) => {
                    const lastVal = c.trendData[c.trendData.length - 1]; const prevVal = c.trendData[c.trendData.length - 2];
                    const change = ((lastVal - prevVal) / prevVal * 100).toFixed(0); const isUp = lastVal >= prevVal;
                    return (
                      <div key={i} className="bg-card rounded-2xl p-4 border border-border-light">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[14px] font-bold text-foreground">{c.emoji} {c.name}</span>
                          <span className={`text-[12px] font-bold flex items-center gap-1 ${isUp ? 'text-destructive' : 'text-green-accent'}`}>
                            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {isUp ? '+' : ''}{change}%
                          </span>
                        </div>
                        <TrendChart data={c.trendData} />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </LockWrap>

        {/* Generate PDF Report */}
        <button onClick={() => setShowComingSoon(true)} className="w-full h-11 mt-5 rounded-2xl border border-border text-muted-foreground text-[13px] font-bold btn-press flex items-center justify-center gap-2">
          <FileText size={16} /> {t('competitor.generateReport')}
        </button>

        {/* Notify Me */}
        <div className="bg-card rounded-2xl p-[18px] border border-border-light mt-5 relative overflow-hidden" style={{ borderLeft: '3px solid transparent', borderImage: 'linear-gradient(to bottom, hsl(233,100%,42%), hsl(193,100%,48%)) 1 0 0 0' }}>
          <p className="text-[14px] font-bold text-foreground">{t('competitor.notifyTitle')}</p>
          <div className={`mt-3 ${isMobile ? 'space-y-2' : 'flex gap-2'}`}>
            <input type="email" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} placeholder={t('competitor.yourEmail')}
              className="h-10 px-4 rounded-[14px] border border-border bg-background text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/30 flex-1 w-full" />
            <button className="h-10 px-5 rounded-[14px] gradient-btn text-primary-foreground text-[13px] font-bold btn-press whitespace-nowrap shadow-btn">
              <Bell size={14} className="inline mr-1.5" />{t('competitor.notifyMe')}
            </button>
          </div>
        </div>
      </div>

      <ComingSoonModal feature="competitorIntelligence" open={showComingSoon} onClose={() => setShowComingSoon(false)} />
    </motion.div>
  );
};