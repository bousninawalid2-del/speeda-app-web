import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, User, Shield, CreditCard, Globe2, Wifi, Brain, Bell, BellDot, BellRing, Languages, HelpCircle, MessageCircle, Sparkles, Info, Gift, MoreVertical, Rss, ExternalLink, Pause, Play, Trash2, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo, GoogleLogo,
  PinterestLogo, ThreadsLogo, VisaLogo, MadaLogo
} from '../components/PlatformLogos';
import { ComingSoonModal } from '../components/ComingSoon';
import { PlatformConnectFlow, DisconnectDialog, PlatformManageMenu } from '../components/PlatformConnectFlow';
import { useAuth } from '../contexts/AuthContext';
import { useTokens } from '../hooks/useTokens';
import { useSubscription } from '../hooks/useSubscription';
import { useSocialAccounts } from '../hooks/useSocialAccounts';
import { useBilling } from '../hooks/useBilling';
import { useConnectedPlatforms, useInvalidateConnectedPlatforms } from '../hooks/useConnectedPlatforms';
import { useRssFeeds, useAddRssFeed, useDeleteRssFeed } from '../hooks/useRssFeeds';
import { usePostingSchedule, useSavePostingSchedule, useDeletePostingSchedule } from '../hooks/usePostingSchedule';
import { useDmAutoResponse, useSaveDmAutoResponse } from '../hooks/useDmAutoResponse';
import { useBrandVoiceSettings } from '../hooks/useBrandVoiceSettings';
import { useSettingsMenu } from '../hooks/useSettingsMenu';
import { apiFetch } from '@/lib/api-client';

interface SettingsScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  onLogout?: () => void | Promise<void>;
}

export const SettingsScreen = ({ onBack, onNavigate, onLogout }: SettingsScreenProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: tokensData } = useTokens();
  const { data: subData } = useSubscription();
  const { data: socialData, refetch: refetchSocial } = useSocialAccounts();
  const { data: billingData } = useBilling();
  const { data: connectedPlatformsData, isLoading: platformsLoading } = useConnectedPlatforms();
  const invalidateConnectedPlatforms = useInvalidateConnectedPlatforms();
  const { data: brandVoiceData, isLoading: brandVoiceLoading } = useBrandVoiceSettings({
    tones: [], langs: [], keywords: [], businessDescription: '', sampleContent: '', otherLang: '',
  });
  const { data: menuItems } = useSettingsMenu([]);
  const { data: rssFeedsData, isLoading: rssLoading, error: rssError, refetch: refetchRss } = useRssFeeds();
  const addRssFeed = useAddRssFeed();
  const deleteRssFeed = useDeleteRssFeed();
  const { data: scheduleData, isLoading: scheduleLoading } = usePostingSchedule();
  const savePostingSchedule = useSavePostingSchedule();
  const deletePostingSchedule = useDeletePostingSchedule();
  const { data: dmAutoResponseData } = useDmAutoResponse();
  const saveDmAutoResponse = useSaveDmAutoResponse();

  const tokenBalance = tokensData?.balance ?? 0;
  const tokenTotal = tokensData?.total ?? 500;
  const tokenPercent = tokenTotal > 0 ? Math.round((tokenBalance / tokenTotal) * 100) : 0;
  const planName = subData?.subscription?.plan?.name ?? (subData?.trial?.active ? 'Free Trial' : 'Free');
  const displayName = user?.name ?? user?.email ?? '';

  const [automations, setAutomations] = useState([true, true, true, true, false]);
  const [notifs, setNotifs] = useState({ morningCards: true, pendingComments: true, eodSummary: true, perfReport: true, mosUpdate: true, competitorRanking: false, seasonalOpps: true, competitorActivity: true, campaignOpt: true, salesSuggestions: true });
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<{ name: string; Logo: any } | null>(null);
  const [managePlatform, setManagePlatform] = useState<string | null>(null);
  const [disconnectPlatform, setDisconnectPlatform] = useState<string | null>(null);

  const normalizePlatformName = (platform: string) => {
    const p = platform.toLowerCase();
    if (p === 'instagram') return 'Instagram';
    if (p === 'tiktok' || p === 'tik_tok') return 'TikTok';
    if (p === 'snapchat') return 'Snapchat';
    if (p === 'facebook') return 'Facebook';
    if (p === 'x' || p === 'twitter') return 'X';
    if (p === 'youtube') return 'YouTube';
    if (p === 'google' || p === 'googlebusiness' || p === 'google_business' || p === 'google business' || p === 'gmb') return 'Google Business';
    if (p === 'linkedin') return 'LinkedIn';
    if (p === 'pinterest') return 'Pinterest';
    if (p === 'threads') return 'Threads';
    return platform;
  };

  interface PlatformInfo {
    connected: boolean;
    username?: string | null;
    refreshWarning?: boolean;
    refreshDaysRemaining?: number | null;
  }

  const connectedPlatforms = useMemo<Record<string, PlatformInfo>>(() => {
    const map: Record<string, PlatformInfo> = {
      Instagram: { connected: false }, TikTok: { connected: false }, Snapchat: { connected: false },
      Facebook: { connected: false }, X: { connected: false }, YouTube: { connected: false },
      'Google Business': { connected: false }, LinkedIn: { connected: false },
      Pinterest: { connected: false }, Threads: { connected: false },
    };

    if (Array.isArray(connectedPlatformsData) && connectedPlatformsData.length > 0) {
      connectedPlatformsData.forEach((p) => {
        const key = normalizePlatformName(p.platform);
        if (key in map) {
          map[key] = {
            connected: p.connected,
            username: p.username,
            refreshWarning: p.refreshWarning,
            refreshDaysRemaining: p.refreshDaysRemaining,
          };
        }
      });
      return map;
    }

    // Fallback to legacy /api/social data
    let accounts: any[] = [];
    if (Array.isArray(socialData)) accounts = socialData;
    else if (Array.isArray((socialData as any)?.accounts)) accounts = (socialData as any).accounts;
    accounts.forEach((acc: any) => {
      const key = normalizePlatformName(String(acc?.platform ?? ''));
      if (key in map) map[key] = { connected: !!acc?.connected, username: acc?.username };
    });
    return map;
  }, [connectedPlatformsData, socialData]);

  const paymentMethods = useMemo(() => {
    const methods = Array.isArray((billingData as any)?.paymentMethods) ? (billingData as any).paymentMethods : [];
    return methods.map((method: any) => {
      const brand = String(method?.brand ?? method?.type ?? '').toLowerCase();
      const displayBrand = brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : '';
      return {
        id: String(method?.id ?? `${brand}-${method?.last4 ?? ''}`),
        brand,
        displayBrand,
        last4: String(method?.last4 ?? ''),
        isDefault: !!(method?.isDefault ?? method?.default),
      };
    });
  }, [billingData]);

  const toApiPlatform = (platform: string) => {
    if (platform === 'Google Business') return 'google';
    if (platform === 'TikTok') return 'tiktok';
    if (platform === 'LinkedIn') return 'linkedin';
    if (platform === 'YouTube') return 'youtube';
    return platform.toLowerCase();
  };

  const paymentLogo = (brand: string) => {
    if (brand.includes('visa')) return <VisaLogo size={24} />;
    if (brand.includes('mada')) return <MadaLogo size={24} />;
    return <CreditCard size={24} className="text-muted-foreground" />;
  };

  // RSS Feed state (server-backed via Ayrshare /feed)
  const [showAddRss, setShowAddRss] = useState(false);
  const [rssUrl, setRssUrl] = useState('');
  const rssFeeds = rssFeedsData ?? [];

  const feedTitle = (feed: any) => feed.title || feed.lastItem?.title || feed.url;
  const feedLastArticle = (feed: any) => {
    const t = feed.lastItem?.title; const d = feed.lastItem?.pubDate;
    if (t && d) return `${t} — ${new Date(d).toLocaleDateString()}`;
    if (t) return t;
    return 'No posts yet';
  };
  const feedActive = (feed: any) => feed.active !== false && feed.status !== 'paused';

  const RSSFeedSection = () => (
    <div className="px-4 py-3">
      {rssLoading ? (
        <div className="bg-muted rounded-2xl p-4 animate-pulse h-24" />
      ) : rssError ? (
        <div className="border border-red-accent/40 rounded-2xl p-4 text-center">
          <p className="text-[13px] text-red-accent">Failed to load RSS feeds</p>
          <button onClick={() => refetchRss()} className="mt-2 text-[12px] text-brand-blue font-semibold">Retry</button>
        </div>
      ) : rssFeeds.length === 0 && !showAddRss ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center">
          <Rss size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-[16px] font-semibold text-foreground">Connect your blog or newsletter</p>
          <p className="text-[13px] text-muted-foreground mt-1">Automatically share new articles on your social media</p>
          <button onClick={() => setShowAddRss(true)} className="mt-4 h-10 px-6 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">Add Feed</button>
        </div>
      ) : (
        <>
          {rssFeeds.map((feed) => {
            const active = feedActive(feed);
            return (
              <div key={feed.id} className="bg-muted rounded-2xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Rss size={16} className="text-brand-blue" />
                  <span className="text-[14px] font-semibold text-foreground flex-1 truncate">{feedTitle(feed)}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${active ? 'bg-green-accent/20 text-green-accent' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                    {active ? 'Active ✓' : 'Paused'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-1 truncate">{feed.url}</p>
                <p className="text-[12px] text-foreground">Last article: {feedLastArticle(feed)}</p>
                {feed.platforms && feed.platforms.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1">Platforms: {feed.platforms.join(', ')}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    disabled={deleteRssFeed.isPending}
                    onClick={() => deleteRssFeed.mutate(feed.id)}
                    className="text-red-accent text-[12px] font-semibold disabled:opacity-50"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowAddRss(true)} className="text-brand-blue text-[13px] font-semibold">+ Add Feed</button>
          {showAddRss && (
            <div className="bg-card rounded-2xl border border-border-light p-4 mt-3">
              <p className="text-[14px] font-semibold text-foreground mb-3">Add New Feed</p>
              <input value={rssUrl} onChange={e => setRssUrl(e.target.value)} placeholder="https://yourblog.com/rss" className="w-full h-10 rounded-xl bg-muted px-4 text-[13px] text-foreground placeholder:text-muted-foreground border-0 outline-none mb-3" />
              {addRssFeed.isError && <p className="text-[11px] text-red-accent mb-2">Failed to add feed. Check the URL.</p>}
              <div className="flex gap-2">
                <button
                  disabled={addRssFeed.isPending || !rssUrl.trim()}
                  onClick={() => {
                    if (!rssUrl.trim()) return;
                    addRssFeed.mutate(
                      { url: rssUrl.trim() },
                      { onSuccess: () => { setRssUrl(''); setShowAddRss(false); } },
                    );
                  }}
                  className="flex-1 h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press disabled:opacity-50"
                >
                  {addRssFeed.isPending ? 'Connecting…' : 'Connect Feed'}
                </button>
                <button onClick={() => { setShowAddRss(false); setRssUrl(''); addRssFeed.reset(); }} className="h-10 px-4 rounded-xl border border-border text-muted-foreground text-[13px] font-medium btn-press">{t('common.cancel')}</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Auto-Schedule state (server-backed via Ayrshare /auto-schedule)
  const AUTO_SCHEDULE_TITLE = 'speeda-auto';
  const DAY_KEYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as const; // Sunday=0 per Ayrshare

  // Convert "8:00 AM" ↔ "08:00Z"
  const ampmToUtc = (s: string): string => {
    const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(s.trim());
    if (!m) return s;
    let h = parseInt(m[1], 10); const min = m[2]; const ap = m[3].toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${min}Z`;
  };
  const utcToAmpm = (s: string): string => {
    const m = /^(\d{1,2}):(\d{2})Z?$/.exec(s.trim());
    if (!m) return s;
    let h = parseInt(m[1], 10); const min = m[2];
    const ap = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12; else if (h > 12) h -= 12;
    return `${h}:${min} ${ap}`;
  };

  const [autoScheduleOn, setAutoScheduleOn] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, string[]>>({
    Sun: [], Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [],
  });
  const [scheduleHydrated, setScheduleHydrated] = useState(false);

  useEffect(() => {
    if (scheduleHydrated || !scheduleData) return;
    const first = scheduleData[0];
    if (!first) { setScheduleHydrated(true); return; }
    setAutoScheduleOn(true);
    const times = (first.schedule || []).map(utcToAmpm);
    const days = first.daysOfWeek && first.daysOfWeek.length > 0 ? first.daysOfWeek : [0,1,2,3,4,5,6];
    const next: Record<string, string[]> = { Sun: [], Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };
    for (const d of days) {
      const key = DAY_KEYS[d];
      if (key) next[key] = [...times];
    }
    setSchedule(next);
    setScheduleHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleData, scheduleHydrated]);

  const removeSlot = (day: string, idx: number) => setSchedule(s => ({ ...s, [day]: s[day].filter((_, i) => i !== idx) }));
  const addSlot = (day: string) => {
    const opts = ['6:00 AM','8:00 AM','10:00 AM','12:00 PM','2:00 PM','4:00 PM','6:00 PM','8:00 PM','10:00 PM'];
    const next = opts.find(t => !(schedule[day] || []).includes(t));
    if (next) setSchedule(s => ({ ...s, [day]: [...(s[day] || []), next] }));
  };
  const handleSaveSchedule = () => {
    const allTimes = Array.from(new Set(Object.values(schedule).flat().map(ampmToUtc))).sort();
    const daysOfWeek = DAY_KEYS
      .map((k, i) => (schedule[k] && schedule[k].length > 0 ? i : -1))
      .filter((i) => i >= 0);
    if (allTimes.length === 0 || daysOfWeek.length === 0) {
      deletePostingSchedule.mutate(AUTO_SCHEDULE_TITLE);
      return;
    }
    savePostingSchedule.mutate({ title: AUTO_SCHEDULE_TITLE, schedule: allTimes, daysOfWeek });
  };
  const handleToggleAutoSchedule = () => {
    const next = !autoScheduleOn;
    setAutoScheduleOn(next);
    if (!next) deletePostingSchedule.mutate(AUTO_SCHEDULE_TITLE);
  };
  const AutoScheduleSection = () => (
    <div className="border-b border-border-light">
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex-1 me-3">
          <p className="text-[14px] text-foreground font-medium">📅 Posting Schedule</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Set recurring time slots for auto-scheduling</p>
        </div>
        <button onClick={handleToggleAutoSchedule} className={`w-11 h-6 rounded-full p-0.5 transition-colors ${autoScheduleOn ? 'bg-green-accent' : 'bg-border'}`}>
          <div className={`w-5 h-5 rounded-full bg-card shadow transition-transform ${autoScheduleOn ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
        </button>
      </div>
      {scheduleLoading && !scheduleHydrated && (
        <div className="px-4 pb-3 text-[11px] text-muted-foreground">Loading…</div>
      )}
      {autoScheduleOn && (
        <div className="px-4 pb-4">
          <p className="text-[14px] font-semibold text-foreground mb-3">Your Weekly Posting Schedule</p>
          <div className="space-y-2">
            {Object.entries(schedule).map(([day, times]) => (
              <div key={day} className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-foreground w-10">{day}</span>
                {times.map((time, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-muted rounded-lg px-2.5 py-1 text-[11px] font-medium text-foreground">
                    {time}<button onClick={() => removeSlot(day, i)} className="text-muted-foreground hover:text-red-accent text-[10px]">✕</button>
                  </span>
                ))}
                <button onClick={() => addSlot(day)} className="w-6 h-6 rounded-lg bg-brand-blue/10 text-brand-blue text-[14px] flex items-center justify-center font-bold">+</button>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-muted rounded-xl p-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Weekly Preview</p>
            <div className="flex gap-1">
              {Object.entries(schedule).map(([day, times]) => (
                <div key={day} className="flex-1 text-center">
                  <span className="text-[9px] font-semibold text-muted-foreground">{day}</span>
                  <div className="mt-1 space-y-0.5">{times.map((_, i) => <div key={i} className="h-1.5 rounded-full gradient-btn" />)}</div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleSaveSchedule}
            disabled={savePostingSchedule.isPending}
            className="w-full h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press mt-4 disabled:opacity-50"
          >
            {savePostingSchedule.isPending ? 'Saving…' : savePostingSchedule.isSuccess ? 'Saved ✓' : 'Save Schedule'}
          </button>
          {savePostingSchedule.isError && (
            <p className="text-[11px] text-red-accent mt-2">Failed to save. Try again.</p>
          )}
        </div>
      )}
    </div>
  );

  const toggleAuto = (idx: number) => {
    if (idx === 0) { setComingSoonFeature('autoBoost'); return; }
    if (idx === 4) { setComingSoonFeature('budgetOptimization'); return; }
    setAutomations(a => a.map((v, i) => i === idx ? !v : v));
  };
  const toggleNotif = (key: string) => setNotifs(n => ({ ...n, [key]: !(n as any)[key] }));

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{title}</h3>
      <div className="bg-card rounded-2xl border border-border-light overflow-hidden">{children}</div>
    </div>
  );

  const Row = ({ label, value, icon: Icon, onClick }: { label: string; value?: string; icon?: any; onClick?: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border-light last:border-0 text-start">
      {Icon && <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Icon size={16} className="text-muted-foreground" /></div>}
      <span className="text-[14px] text-foreground flex-1">{label}</span>
      {value && <span className="text-[13px] text-muted-foreground">{value}</span>}
      <ChevronRight size={16} className="text-muted-foreground rtl:rotate-180" />
    </button>
  );

  const Toggle = ({ label, sub, on, onChange, disabled }: { label: string; sub: string; on: boolean; onChange?: () => void; disabled?: boolean }) => (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-light last:border-0">
      <div className="flex-1 me-3">
        <p className="text-[14px] text-foreground font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
      {disabled ? (
        <span className="text-[11px] text-muted-foreground font-medium">{t('common.alwaysOn')}</span>
      ) : (
        <button onClick={onChange} className={`w-11 h-6 rounded-full p-0.5 transition-colors ${on ? 'bg-green-accent' : 'bg-border'}`}>
          <div className={`w-5 h-5 rounded-full bg-card shadow transition-transform ${on ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
        </button>
      )}
    </div>
  );

  const PlatformRow = ({ Logo, name, info, onConnect }: { Logo: any; name: string; info: PlatformInfo; onConnect?: () => void }) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light last:border-0">
      <Logo size={24} />
      <div className="flex-1 min-w-0">
        <span className="text-[14px] text-foreground block truncate">{name}</span>
        {info.connected && info.username && (
          <span className="text-[11px] text-muted-foreground block truncate">{info.username}</span>
        )}
        {info.refreshWarning && (
          <span className="text-[10px] font-semibold text-orange-accent block">
            ⚠ Refresh required soon{typeof info.refreshDaysRemaining === 'number' ? ` (${info.refreshDaysRemaining}d)` : ''}
          </span>
        )}
      </div>
      {info.connected ? (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-green-accent">✓ {t('common.connected')}</span>
          <button onClick={() => setManagePlatform(name)} className="p-1"><MoreVertical size={14} className="text-muted-foreground" /></button>
        </div>
      ) : (
        <button onClick={onConnect || (() => setConnectingPlatform({ name, Logo }))} className="text-[11px] font-semibold text-brand-blue">{t('common.connect')}</button>
      )}
    </div>
  );

  const switchLang = (lang: string) => {
    if (lang === 'fr') { setComingSoonFeature('frenchLanguage'); return; }
    i18n.changeLanguage(lang);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground">{t('settings.title')}</h1>
        </div>

        {/* Account */}
        <Section title={t('settings.account')}>
          <Row label={t('settings.profile')} value={displayName} icon={User} onClick={() => onNavigate?.('profile')} />
          <Row label={t('settings.security')} icon={Shield} onClick={() => onNavigate?.('security')} />
          <div className="px-4 py-3.5 border-b border-border-light">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={16} className="text-muted-foreground" />
              <span className="text-[14px] font-medium text-foreground">{t('settings.subscription')}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-primary-foreground gradient-btn px-2 py-0.5 rounded-md">{planName}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{t('settings.renewalDate')}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => onNavigate?.('subscription')} className="flex-1 h-9 rounded-xl gradient-btn text-primary-foreground text-[12px] font-bold btn-press">{t('settings.upgradePlan')}</button>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => onNavigate?.('planComparison')} className="text-brand-blue text-[12px] font-semibold">{t('settings.viewPlanComparison')}</button>
              <button onClick={() => onNavigate?.('billingHistory')} className="text-brand-blue text-[12px] font-semibold">{t('settings.billingHistory')}</button>
            </div>
          </div>
          <Row label={t('settings.referralProgram')} icon={Gift} onClick={() => onNavigate?.('referral')} />
        </Section>

        {/* Tokens */}
        <Section title={t('settings.tokensSection')}>
          <button onClick={() => onNavigate?.('tokens')} className="w-full px-4 py-3.5 text-start">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-foreground">{t('settings.tokensRemaining', { count: tokenBalance })}</p>
                <div className="h-1.5 rounded-full bg-muted mt-2 w-40 overflow-hidden">
                  <div className="h-full gradient-btn rounded-full" style={{ width: `${tokenPercent}%` }} />
                </div>
              </div>
              <span className="text-brand-blue text-[13px] font-semibold">{t('settings.manageTokens')}</span>
            </div>
          </button>
        </Section>

        {/* Marketing OS */}
        <Section title={t('settings.marketingOS')}>
          <div className="px-4 py-2">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('settings.connectedPlatforms')}</p>
          </div>
          {[
            { Logo: InstagramLogo, name: 'Instagram' },
            { Logo: TikTokLogo, name: 'TikTok' },
            { Logo: SnapchatLogo, name: 'Snapchat', note: 'Limited features — posting to Snapchat Stories only' },
            { Logo: FacebookLogo, name: 'Facebook' },
            { Logo: XLogo, name: 'X' },
            { Logo: YouTubeLogo, name: 'YouTube' },
            { Logo: GoogleLogo, name: 'Google Business' },
            { Logo: LinkedInLogo, name: 'LinkedIn' },
            { Logo: PinterestLogo, name: 'Pinterest' },
            { Logo: ThreadsLogo, name: 'Threads' },
          ].map((p, i) => (
            <div key={i}>
              <PlatformRow Logo={p.Logo} name={p.name} info={connectedPlatforms[p.name] ?? { connected: false }} />
              {'note' in p && p.note && (
                <p className="text-[11px] text-muted-foreground px-4 pb-2 -mt-1">{p.note}</p>
              )}
            </div>
          ))}
          {platformsLoading && (
            <div className="px-4 py-3 text-[11px] text-muted-foreground">Loading…</div>
          )}
        </Section>

        {/* AI Preferences */}
        <Section title={t('settings.aiPreferences')}>
          <div className="px-4 py-3.5 border-b border-border-light">
            <p className="text-[14px] font-medium text-foreground mb-2">{t('settings.brandVoice')}</p>
            {brandVoiceLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[12px] text-muted-foreground">{t('settings.tone')}:</span>
                  {(brandVoiceData?.tones ?? []).length === 0 ? (
                    <span className="text-[11px] text-muted-foreground italic">Not set</span>
                  ) : (
                    (brandVoiceData!.tones).map((tone) => (
                      <span key={tone} className="px-3 py-1 rounded-3xl bg-purple-soft text-purple text-[11px] font-semibold">{tone}</span>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[12px] text-muted-foreground">{t('settings.language')}:</span>
                  {(brandVoiceData?.langs ?? []).length === 0 ? (
                    <span className="text-[11px] text-muted-foreground italic">Not set</span>
                  ) : (
                    <span className="px-3 py-1 rounded-3xl bg-purple-soft text-purple text-[11px] font-semibold">{brandVoiceData!.langs.join(' + ')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] text-muted-foreground">{t('settings.keywords')}:</span>
                  {(brandVoiceData?.keywords ?? []).length === 0 ? (
                    <span className="text-[11px] text-muted-foreground italic">Not set</span>
                  ) : (
                    (brandVoiceData!.keywords).map((k) => (
                      <span key={k} className="px-3 py-1 rounded-3xl bg-muted text-foreground text-[11px] font-medium">{k}</span>
                    ))
                  )}
                </div>
              </>
            )}
            <button onClick={() => onNavigate?.('editBrandVoice')} className="text-brand-blue text-[13px] font-semibold mt-2">{t('settings.editBrandVoice')}</button>
          </div>
          {/* Menu Section */}
          <div className="px-4 py-3.5 border-b border-border-light">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[16px]">🍽️</span>
              <p className="text-[14px] font-medium text-foreground">Menu</p>
            </div>
            <p className="text-[12px] text-muted-foreground mb-3">Help our AI create content based on your actual dishes and prices</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">📋 Restaurant Menu</p>
                <p className="text-[11px] text-muted-foreground">
                  {(menuItems?.length ?? 0) === 0 ? 'No items uploaded' : `${menuItems!.length} item${menuItems!.length > 1 ? 's' : ''} uploaded`}
                </p>
              </div>
              <button onClick={() => onNavigate?.('menuManagement')} className="text-brand-blue text-[13px] font-semibold">Manage →</button>
            </div>
          </div>
          <div className="px-4 py-2">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('settings.automationRules')}</p>
          </div>
          {/* Auto-Schedule Rules */}
          <AutoScheduleSection />
          {[
            { label: t('settings.autoBoost'), sub: t('settings.autoBoostDesc') },
            { label: t('settings.autoRespond'), sub: t('settings.autoRespondDesc') },
            { label: t('settings.autoPublish'), sub: t('settings.autoPublishDesc') },
            { label: t('settings.autoPause'), sub: t('settings.autoPauseDesc') },
            { label: t('settings.autoAdjust'), sub: t('settings.autoAdjustDesc') },
          ].map((item, i) => (
            <Toggle key={i} label={item.label} sub={item.sub} on={automations[i]} onChange={() => toggleAuto(i)} />
          ))}
          {/* Auto-respond to DMs (global toggle via Ayrshare) */}
          <div className="px-4 py-2">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('settings.dmAutoRespond', '💬 DM Auto-Responses')}</p>
          </div>
          <Toggle
            label={t('settings.dmAutoRespondLabel', 'Auto-respond to DMs')}
            sub={t('settings.dmAutoRespondDesc', 'Automatically reply to incoming direct messages')}
            on={Boolean(dmAutoResponseData?.autoResponseActive)}
            onChange={() => {
              const next = !dmAutoResponseData?.autoResponseActive;
              saveDmAutoResponse.mutate({
                autoResponseActive: next,
                autoResponseMessage: dmAutoResponseData?.autoResponseMessage,
                autoResponseWaitSeconds: dmAutoResponseData?.autoResponseWaitSeconds,
              });
            }}
          />
          {dmAutoResponseData?.autoResponseActive && (
            <div className="px-4 py-3 border-b border-border-light">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Default message</label>
              <textarea
                defaultValue={dmAutoResponseData?.autoResponseMessage ?? ''}
                onBlur={(e) => {
                  const value = e.currentTarget.value;
                  if (value !== (dmAutoResponseData?.autoResponseMessage ?? '')) {
                    saveDmAutoResponse.mutate({
                      autoResponseActive: true,
                      autoResponseMessage: value,
                      autoResponseWaitSeconds: dmAutoResponseData?.autoResponseWaitSeconds,
                    });
                  }
                }}
                className="w-full mt-2 rounded-xl bg-muted px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground border-0 outline-none resize-none"
                rows={3}
                placeholder="Thanks for your message, we'll be in touch shortly!"
              />
              {saveDmAutoResponse.isError && (
                <p className="text-[11px] text-red-accent mt-1">Failed to save. Try again.</p>
              )}
            </div>
          )}
        </Section>

        {/* RSS Feeds */}
        <Section title={t('settings.rssFeeds', '📡 RSS Feeds')}>
          <RSSFeedSection />
        </Section>

        {/* Notifications */}
        <Section title={t('settings.notifications')}>
          <div className="px-4 py-2"><p className="text-[12px] font-semibold text-red-accent uppercase tracking-wider">{t('settings.urgent')}</p><p className="text-[10px] text-muted-foreground">{t('settings.urgentAlwaysOn')}</p></div>
          <Toggle label={t('settings.negativeReviews')} sub={t('settings.negativeReviewsDesc')} on={true} disabled />
          <Toggle label={t('settings.budgetDepleted')} sub={t('settings.budgetDepletedDesc')} on={true} disabled />
          <Toggle label={t('settings.platformDisconnected')} sub={t('settings.platformDisconnectedDesc')} on={true} disabled />
          <div className="px-4 py-2"><p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.daily')}</p></div>
          <Toggle label={t('settings.morningCards')} sub={t('settings.morningCardsDesc')} on={notifs.morningCards} onChange={() => toggleNotif('morningCards')} />
          <Toggle label={t('settings.pendingComments')} sub={t('settings.pendingCommentsDesc')} on={notifs.pendingComments} onChange={() => toggleNotif('pendingComments')} />
          <Toggle label={t('settings.eodSummary')} sub={t('settings.eodSummaryDesc')} on={notifs.eodSummary} onChange={() => toggleNotif('eodSummary')} />
          <div className="px-4 py-2"><p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.weekly')}</p></div>
          <Toggle label={t('settings.perfReport')} sub={t('settings.perfReportDesc')} on={notifs.perfReport} onChange={() => toggleNotif('perfReport')} />
          <Toggle label={t('settings.mosUpdate')} sub={t('settings.mosUpdateDesc')} on={notifs.mosUpdate} onChange={() => toggleNotif('mosUpdate')} />
          <Toggle label={t('settings.competitorRanking')} sub={t('settings.competitorRankingDesc')} on={notifs.competitorRanking} onChange={() => toggleNotif('competitorRanking')} />
          <div className="px-4 py-2"><p className="text-[12px] font-semibold text-purple uppercase tracking-wider">{t('settings.aiAlerts')}</p></div>
          <Toggle label={t('settings.seasonalOpps')} sub={t('settings.seasonalOppsDesc')} on={notifs.seasonalOpps} onChange={() => toggleNotif('seasonalOpps')} />
          <Toggle label={t('settings.competitorActivity')} sub={t('settings.competitorActivityDesc')} on={notifs.competitorActivity} onChange={() => toggleNotif('competitorActivity')} />
          <Toggle label={t('settings.campaignOptimization')} sub={t('settings.campaignOptimizationDesc')} on={notifs.campaignOpt} onChange={() => toggleNotif('campaignOpt')} />
          <div className="px-4 py-2"><p className="text-[12px] font-semibold text-purple uppercase tracking-wider">Sales & Promotions</p></div>
          <Toggle label="Sales suggestions" sub="In-app upgrade suggestions and plan advisor nudges" on={notifs.salesSuggestions} onChange={() => toggleNotif('salesSuggestions')} />
        </Section>

        {/* Language */}
        <Section title={t('settings.languageSection')}>
          {[
            { code: 'en', flag: '🇬🇧', label: 'English' },
            { code: 'ar', flag: '🇸🇦', label: 'العربية' },
            { code: 'fr', flag: '🇫🇷', label: 'Français' },
          ].map((l, i) => (
            <button key={l.code} onClick={() => switchLang(l.code)} className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-border-light last:border-0 ${i18n.language === l.code ? 'bg-purple-soft' : ''}`}>
              <span className="text-[18px]">{l.flag}</span>
              <span className="text-[14px] font-medium text-foreground flex-1">{l.label}</span>
              {l.code === 'fr' && <span className="text-[10px] font-bold text-primary-foreground gradient-hero px-2 py-0.5 rounded-md">Soon</span>}
              {i18n.language === l.code && <span className="text-[12px] font-bold text-brand-blue">✓</span>}
            </button>
          ))}
        </Section>

        {/* Payment Methods */}
        <Section title={i18n.language === 'ar' ? 'طرق الدفع' : i18n.language === 'fr' ? 'Moyens de paiement' : 'Payment Methods'}>
          {paymentMethods.length > 0 ? (
            <>
              {paymentMethods.map((method, index) => (
                <div key={method.id} className={`flex items-center gap-3 px-4 py-3.5 ${index < paymentMethods.length - 1 ? 'border-b border-border-light' : ''}`}>
                  {paymentLogo(method.brand)}
                  <span className="text-[14px] text-foreground flex-1">{method.displayBrand ? `${method.displayBrand} ····${method.last4}` : `····${method.last4}`}</span>
                  {method.isDefault && <span className="text-[11px] text-green-accent font-semibold">Default ✓</span>}
                </div>
              ))}
            </>
          ) : (
            <div className="px-4 py-6 text-center border-b border-border-light">
              <p className="text-[13px] text-muted-foreground">No payment methods added yet</p>
            </div>
          )}
          <div className="px-4 py-3">
            <button className="text-brand-blue text-[13px] font-semibold">+ {i18n.language === 'ar' ? 'إضافة طريقة دفع' : i18n.language === 'fr' ? 'Ajouter un moyen de paiement' : 'Add Payment Method'}</button>
          </div>
        </Section>

        {/* Support */}
        <Section title={t('settings.support')}>
          <Row label={t('settings.helpCenter')} icon={HelpCircle} onClick={() => onNavigate?.('helpCenter')} />
          <Row label={t('settings.contactSupport')} icon={MessageCircle} onClick={() => onNavigate?.('contactSupport')} />
          <Row label={t('settings.whatsNew')} icon={Sparkles} onClick={() => onNavigate?.('whatsNew')} />
        </Section>

        {/* About */}
        <Section title={t('settings.about')}>
          <div className="px-4 py-3.5 border-b border-border-light">
            <div className="flex justify-between">
              <span className="text-[14px] text-foreground">{t('settings.version')}</span>
              <span className="text-[14px] text-muted-foreground">4.5</span>
            </div>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[11px] text-muted-foreground">{t('settings.madeWith')}</p>
            <p className="text-[13px] text-brand-blue font-medium mt-1">speeda.ai</p>
            <div className="flex justify-center gap-4 mt-2 text-[12px] text-brand-blue">
              <span>{t('settings.termsOfService')}</span>
              <span>{t('settings.privacyPolicy')}</span>
            </div>
          </div>
        </Section>

        <div className="pt-5 border-t border-border-light mb-5">
          <div className="bg-card rounded-2xl border border-border-light overflow-hidden">
            <button
              onClick={async () => {
                try {
                  await onLogout?.();
                } catch {}
              }}
              aria-label={t('settings.logout', 'Log Out')}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-inset"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <LogOut size={16} className="text-destructive" />
              </div>
              <span className="text-[14px] text-destructive flex-1">{t('settings.logout', 'Log Out')}</span>
            </button>
          </div>
        </div>
      </div>

      <ComingSoonModal feature={comingSoonFeature || ''} open={!!comingSoonFeature} onClose={() => setComingSoonFeature(null)} />

      <AnimatePresence>
        {connectingPlatform && (
          <PlatformConnectFlow
            platformName={connectingPlatform.name}
            platformLogo={<connectingPlatform.Logo size={64} />}
            onComplete={async () => {
              setConnectingPlatform(null);
              await refetchSocial();
              invalidateConnectedPlatforms();
            }}
            onCancel={() => setConnectingPlatform(null)}
          />
        )}
        {managePlatform && (
          <PlatformManageMenu
            platformName={managePlatform}
            onDisconnect={() => { setDisconnectPlatform(managePlatform); setManagePlatform(null); }}
            onClose={() => setManagePlatform(null)}
          />
        )}
        {disconnectPlatform && (
          <DisconnectDialog
            platformName={disconnectPlatform}
            onConfirm={async () => {
              try {
                await apiFetch('/social/disconnect', {
                  method: 'POST',
                  body: JSON.stringify({ platform: toApiPlatform(disconnectPlatform) }),
                });
                await refetchSocial();
                invalidateConnectedPlatforms();
              } catch (error) {
                console.error('Failed to disconnect platform', disconnectPlatform, error);
              }
              setDisconnectPlatform(null);
            }}
            onCancel={() => setDisconnectPlatform(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
