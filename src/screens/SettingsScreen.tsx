import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, User, Shield, CreditCard, Globe2, Wifi, Brain, Bell, BellDot, BellRing, Languages, HelpCircle, MessageCircle, Sparkles, Info, Gift, MoreVertical, Rss, ExternalLink, Pause, Play, Trash2 } from 'lucide-react';
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
import { useProfile } from '../hooks/useProfile';
import { useSocialAccounts } from '../hooks/useSocialAccounts';
import { useSettingsPreferences, useUpdateSettingsPreferences, NotificationSettings } from '../hooks/useSettingsPreferences';
import { apiFetch } from '@/lib/api-client';
import type { SocialAccount } from '@/services/social.service';
import { toast } from 'sonner';

interface SettingsScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

const DEFAULT_AUTOMATIONS = [true, true, true, true, false];
const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  morningCards: true,
  pendingComments: true,
  eodSummary: true,
  perfReport: true,
  mosUpdate: true,
  competitorRanking: false,
  seasonalOpps: true,
  competitorActivity: true,
  campaignOpt: true,
  salesSuggestions: true,
};

const PLATFORM_KEYS = ['Instagram', 'TikTok', 'Snapchat', 'Facebook', 'X', 'YouTube', 'Google Business', 'LinkedIn', 'Pinterest', 'Threads'] as const;

function logSettingsError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[settings screen] ${context}`, error);
  }
}

function sanitizePlatformName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function platformFromApi(platform: string): string | null {
  const normalized = sanitizePlatformName(platform);
  if (normalized.includes('instagram')) return 'Instagram';
  if (normalized.includes('tiktok')) return 'TikTok';
  if (normalized.includes('snapchat')) return 'Snapchat';
  if (normalized.includes('facebook')) return 'Facebook';
  if (normalized === 'x' || normalized.includes('twitter')) return 'X';
  if (normalized.includes('youtube')) return 'YouTube';
  if (normalized.includes('googlebusiness') || normalized.includes('googleprofile') || normalized.includes('googlemybusiness')) return 'Google Business';
  if (normalized.includes('linkedin')) return 'LinkedIn';
  if (normalized.includes('pinterest')) return 'Pinterest';
  if (normalized.includes('threads')) return 'Threads';
  return null;
}

function getApiPlatform(displayPlatform: string, accounts: SocialAccount[] | undefined): string {
  const found = accounts?.find((account) => platformFromApi(account.platform) === displayPlatform);
  return found?.platform ?? '';
}

function createPlatformMap(): Record<string, boolean> {
  return PLATFORM_KEYS.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<string, boolean>);
}

function formatProfileValue(name?: string | null, email?: string | null, phone?: string | null): string {
  const parts = [name, email, phone].filter(Boolean);
  return parts.join(' · ');
}

export const SettingsScreen = ({ onBack, onNavigate }: SettingsScreenProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { data: profileData } = useProfile();
  const { data: tokensData } = useTokens();
  const { data: subData } = useSubscription();
  const { data: socialAccounts, refetch: refetchSocialAccounts } = useSocialAccounts();
  const { data: settingsData } = useSettingsPreferences();
  const { mutateAsync: saveSettings } = useUpdateSettingsPreferences();

  const tokenBalance = tokensData?.balance ?? 0;
  const tokenTotal = tokensData?.total ?? 500;
  const tokenPercent = tokenTotal > 0 ? Math.round((tokenBalance / tokenTotal) * 100) : 0;
  const planName = subData?.subscription?.plan?.name ?? (subData?.trial?.active ? 'Free Trial' : 'Free');
  const profileValue = formatProfileValue(profileData?.name, profileData?.email, profileData?.phone) || user?.name || user?.email || '';

  const [automations, setAutomations] = useState(DEFAULT_AUTOMATIONS);
  const [notifs, setNotifs] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<{ name: string; Logo: any } | null>(null);
  const [managePlatform, setManagePlatform] = useState<string | null>(null);
  const [disconnectPlatform, setDisconnectPlatform] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>(createPlatformMap);

  // RSS Feed state
  const [rssFeeds, setRssFeeds] = useState<Array<{ url: string; title: string; active: boolean; postsCount: number; lastPost: string }>>([
    { url: 'https://malekskitchen.com/rss', title: "Malek's Kitchen Blog", active: true, postsCount: 12, lastPost: 'How to Make the Perfect Shawarma — Mar 18' },
  ]);
  const [showAddRss, setShowAddRss] = useState(false);
  const [rssUrl, setRssUrl] = useState('');

  useEffect(() => {
    if (!settingsData) return;
    setAutomations(settingsData.automations);
    setNotifs(settingsData.notifications);
  }, [settingsData]);

  useEffect(() => {
    if (!socialAccounts) return;
    const nextMap: Record<string, boolean> = createPlatformMap();
    for (const account of socialAccounts) {
      const matched = platformFromApi(account.platform);
      if (matched) nextMap[matched] = account.connected;
    }
    setConnectedPlatforms(nextMap);
  }, [socialAccounts]);

  const RSSFeedSection = () => (
    <div className="px-4 py-3">
      {rssFeeds.length === 0 && !showAddRss ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center">
          <Rss size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-[16px] font-semibold text-foreground">Connect your blog or newsletter</p>
          <p className="text-[13px] text-muted-foreground mt-1">Automatically share new articles on your social media</p>
          <button onClick={() => setShowAddRss(true)} className="mt-4 h-10 px-6 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">Add Feed</button>
        </div>
      ) : (
        <>
          {rssFeeds.map((feed, idx) => (
            <div key={idx} className="bg-muted rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Rss size={16} className="text-brand-blue" />
                <span className="text-[14px] font-semibold text-foreground flex-1">{feed.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${feed.active ? 'bg-green-accent/20 text-green-accent' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                  {feed.active ? 'Active ✓' : 'Paused'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-1">{feed.url}</p>
              <p className="text-[12px] text-foreground">Last article: {feed.lastPost}</p>
              <p className="text-[12px] text-muted-foreground">{feed.postsCount} articles posted automatically</p>
              <div className="flex items-center gap-3 mt-3">
                <button className="text-brand-blue text-[12px] font-semibold">{t('common.edit')}</button>
                <button onClick={() => setRssFeeds(f => f.map((ff, fi) => fi === idx ? { ...ff, active: !ff.active } : ff))} className="text-muted-foreground text-[12px] font-semibold">
                  {feed.active ? 'Pause' : 'Resume'}
                </button>
                <button onClick={() => setRssFeeds(f => f.filter((_, fi) => fi !== idx))} className="text-red-accent text-[12px] font-semibold">{t('common.delete')}</button>
              </div>
            </div>
          ))}
          <button onClick={() => setShowAddRss(true)} className="text-brand-blue text-[13px] font-semibold">+ Add Feed</button>
          {showAddRss && (
            <div className="bg-card rounded-2xl border border-border-light p-4 mt-3">
              <p className="text-[14px] font-semibold text-foreground mb-3">Add New Feed</p>
              <input value={rssUrl} onChange={e => setRssUrl(e.target.value)} placeholder="https://yourblog.com/rss" className="w-full h-10 rounded-xl bg-muted px-4 text-[13px] text-foreground placeholder:text-muted-foreground border-0 outline-none mb-3" />
              <div className="flex gap-2">
                <button onClick={() => { if (rssUrl.trim()) { setRssFeeds(f => [...f, { url: rssUrl, title: 'New Feed', active: true, postsCount: 0, lastPost: 'No posts yet' }]); setRssUrl(''); setShowAddRss(false); } }} className="flex-1 h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">Connect Feed</button>
                <button onClick={() => { setShowAddRss(false); setRssUrl(''); }} className="h-10 px-4 rounded-xl border border-border text-muted-foreground text-[13px] font-medium btn-press">{t('common.cancel')}</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Auto-Schedule state
  const [autoScheduleOn, setAutoScheduleOn] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, string[]>>({
    Mon: ['8:00 AM', '12:00 PM', '8:00 PM'], Tue: ['8:00 AM', '8:00 PM'], Wed: ['12:00 PM', '8:00 PM'],
    Thu: ['8:00 AM', '12:00 PM'], Fri: ['8:00 PM'], Sat: ['12:00 PM', '8:00 PM'], Sun: ['8:00 AM'],
  });
  const removeSlot = (day: string, idx: number) => setSchedule(s => ({ ...s, [day]: s[day].filter((_, i) => i !== idx) }));
  const addSlot = (day: string) => {
    const opts = ['6:00 AM','8:00 AM','10:00 AM','12:00 PM','2:00 PM','4:00 PM','6:00 PM','8:00 PM','10:00 PM'];
    const next = opts.find(t => !(schedule[day] || []).includes(t));
    if (next) setSchedule(s => ({ ...s, [day]: [...(s[day] || []), next] }));
  };
  const AutoScheduleSection = () => (
    <div className="border-b border-border-light">
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex-1 me-3">
          <p className="text-[14px] text-foreground font-medium">📅 Posting Schedule</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Set recurring time slots for auto-scheduling</p>
        </div>
        <button onClick={() => setAutoScheduleOn(!autoScheduleOn)} className={`w-11 h-6 rounded-full p-0.5 transition-colors ${autoScheduleOn ? 'bg-green-accent' : 'bg-border'}`}>
          <div className={`w-5 h-5 rounded-full bg-card shadow transition-transform ${autoScheduleOn ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
        </button>
      </div>
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
          <button className="w-full h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press mt-4">Save Schedule</button>
        </div>
      )}
    </div>
  );

  const refreshSocialState = async () => {
    try {
      await refetchSocialAccounts();
    } catch (error) {
      logSettingsError('refresh social accounts failed', error);
    }
  };

  const toggleAuto = async (idx: number) => {
    if (idx === 0) { setComingSoonFeature('autoBoost'); return; }
    if (idx === 4) { setComingSoonFeature('budgetOptimization'); return; }
    const previous = [...automations];
    const next = automations.map((value, index) => index === idx ? !value : value);
    setAutomations(next);
    try {
      await saveSettings({ automations: next });
    } catch (error) {
      setAutomations(previous);
      logSettingsError('failed to save automation toggle', error);
    }
  };
  const toggleNotif = async (key: keyof NotificationSettings) => {
    const previous = { ...notifs };
    const next = { ...notifs, [key]: !notifs[key] };
    setNotifs(next);
    try {
      await saveSettings({ notifications: next });
    } catch (error) {
      setNotifs(previous);
      logSettingsError('failed to save notification toggle', error);
    }
  };

  const handlePlatformConnect = async () => {
    try {
      const response = await apiFetch<{ url: string }>('/social/connect', { method: 'POST' });
      if (response.url && typeof window !== 'undefined') {
        window.open(response.url, '_blank', 'noopener,noreferrer');
      }
      await refreshSocialState();
    } catch (error) {
      logSettingsError('failed to start social connection', error);
    }
  };

  const handlePlatformDisconnect = async (displayPlatform: string) => {
    const apiPlatform = getApiPlatform(displayPlatform, socialAccounts);
    if (!apiPlatform) {
      toast.error(t('common.error'));
      logSettingsError(`disconnect skipped: unknown platform ${displayPlatform}`, new Error('platform_not_found'));
      return;
    }

    const previous = { ...connectedPlatforms };
    setConnectedPlatforms((current) => ({ ...current, [displayPlatform]: false }));
    try {
      await apiFetch('/social/disconnect', {
        method: 'POST',
        body: JSON.stringify({ platform: apiPlatform }),
      });
      await refreshSocialState();
    } catch (error) {
      setConnectedPlatforms(previous);
      toast.error(t('common.error'));
      logSettingsError(`failed to disconnect ${displayPlatform}`, error);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{title}</h3>
      <div className="bg-card rounded-2xl border border-border-light overflow-hidden">{children}</div>
    </div>
  );

  const Row = ({ label, value, icon: Icon, onClick }: { label: string; value?: string; icon?: any; onClick?: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border-light last:border-0 text-left">
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

  const PlatformRow = ({ Logo, name, connected, onConnect }: { Logo: any; name: string; connected: boolean; onConnect?: () => void }) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light last:border-0">
      <Logo size={24} />
      <span className="text-[14px] text-foreground flex-1">{name}</span>
      {connected ? (
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
          <Row label={t('settings.profile')} value={profileValue} icon={User} onClick={() => onNavigate?.('profile')} />
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
          <button onClick={() => onNavigate?.('tokens')} className="w-full px-4 py-3.5 text-left">
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
              <PlatformRow {...p} connected={!!connectedPlatforms[p.name]} />
              {'note' in p && p.note && (
                <p className="text-[11px] text-muted-foreground px-4 pb-2 -mt-1">{p.note}</p>
              )}
            </div>
          ))}
        </Section>

        {/* AI Preferences */}
        <Section title={t('settings.aiPreferences')}>
          <div className="px-4 py-3.5 border-b border-border-light">
            <p className="text-[14px] font-medium text-foreground mb-2">{t('settings.brandVoice')}</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] text-muted-foreground">{t('settings.tone')}:</span>
              <span className="px-3 py-1 rounded-3xl bg-purple-soft text-purple text-[11px] font-semibold">Professional</span>
              <span className="px-3 py-1 rounded-3xl bg-purple-soft text-purple text-[11px] font-semibold">Fun</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] text-muted-foreground">{t('settings.language')}:</span>
              <span className="px-3 py-1 rounded-3xl bg-purple-soft text-purple text-[11px] font-semibold">Saudi + English</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] text-muted-foreground">{t('settings.keywords')}:</span>
              {['shawarma', 'brunch', 'Riyadh', 'family'].map(k => (
                <span key={k} className="px-3 py-1 rounded-3xl bg-muted text-foreground text-[11px] font-medium">{k}</span>
              ))}
            </div>
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
                <p className="text-[11px] text-muted-foreground">4 items uploaded</p>
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
            <Toggle key={i} label={item.label} sub={item.sub} on={automations[i]} onChange={() => { void toggleAuto(i); }} />
          ))}
          {/* Auto-respond to DMs */}
          <div className="px-4 py-2">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('settings.dmAutoRespond', '💬 DM Auto-Responses')}</p>
          </div>
          <Toggle label={t('settings.dmAutoRespondLabel', 'Auto-respond to DMs')} sub={t('settings.dmAutoRespondDesc', 'Set up auto-responses for common DM topics')} on={automations[1]} onChange={() => { void toggleAuto(1); }} />
          {automations[1] && (
            <div className="px-4 py-3 space-y-2 border-b border-border-light">
              {[
                { trigger: t('settings.dmTriggerHours', 'Opening hours'), response: t('settings.dmResponseHours', "We're open Sunday to Thursday, 9 AM to 11 PM. Come visit us! 🍽️") },
                { trigger: t('settings.dmTriggerMenu', 'Menu request'), response: t('settings.dmResponseMenu', "Here's our latest menu. What can we help you with?") },
                { trigger: t('settings.dmTriggerLocation', 'Location'), response: t('settings.dmResponseLocation', "We're located in Riyadh. Here's the Google Maps link!") },
                { trigger: t('settings.dmTriggerReservation', 'Reservation'), response: t('settings.dmResponseReservation', "We'd love to have you! Please call us to book a table.") },
              ].map((tpl, i) => (
                <div key={i} className="bg-muted rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-foreground">{tpl.trigger}</span>
                    <button className="w-9 h-5 rounded-full bg-green-accent p-0.5">
                      <div className="w-4 h-4 rounded-full bg-card shadow translate-x-4 rtl:-translate-x-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{tpl.response}</p>
                </div>
              ))}
              <button className="text-brand-blue text-[12px] font-semibold mt-1">+ {t('settings.addCustomResponse', 'Add Custom Response')}</button>
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
          <Toggle label={t('settings.morningCards')} sub={t('settings.morningCardsDesc')} on={notifs.morningCards} onChange={() => { void toggleNotif('morningCards'); }} />
          <Toggle label={t('settings.pendingComments')} sub={t('settings.pendingCommentsDesc')} on={notifs.pendingComments} onChange={() => { void toggleNotif('pendingComments'); }} />
          <Toggle label={t('settings.eodSummary')} sub={t('settings.eodSummaryDesc')} on={notifs.eodSummary} onChange={() => { void toggleNotif('eodSummary'); }} />
          <div className="px-4 py-2"><p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.weekly')}</p></div>
          <Toggle label={t('settings.perfReport')} sub={t('settings.perfReportDesc')} on={notifs.perfReport} onChange={() => { void toggleNotif('perfReport'); }} />
          <Toggle label={t('settings.mosUpdate')} sub={t('settings.mosUpdateDesc')} on={notifs.mosUpdate} onChange={() => { void toggleNotif('mosUpdate'); }} />
          <Toggle label={t('settings.competitorRanking')} sub={t('settings.competitorRankingDesc')} on={notifs.competitorRanking} onChange={() => { void toggleNotif('competitorRanking'); }} />
          <div className="px-4 py-2"><p className="text-[12px] font-semibold text-purple uppercase tracking-wider">{t('settings.aiAlerts')}</p></div>
          <Toggle label={t('settings.seasonalOpps')} sub={t('settings.seasonalOppsDesc')} on={notifs.seasonalOpps} onChange={() => { void toggleNotif('seasonalOpps'); }} />
          <Toggle label={t('settings.competitorActivity')} sub={t('settings.competitorActivityDesc')} on={notifs.competitorActivity} onChange={() => { void toggleNotif('competitorActivity'); }} />
          <Toggle label={t('settings.campaignOptimization')} sub={t('settings.campaignOptimizationDesc')} on={notifs.campaignOpt} onChange={() => { void toggleNotif('campaignOpt'); }} />
          <div className="px-4 py-2"><p className="text-[12px] font-semibold text-purple uppercase tracking-wider">Sales & Promotions</p></div>
          <Toggle label="Sales suggestions" sub="In-app upgrade suggestions and plan advisor nudges" on={notifs.salesSuggestions} onChange={() => { void toggleNotif('salesSuggestions'); }} />
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
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-light">
            <VisaLogo size={24} />
            <span className="text-[14px] text-foreground flex-1">Visa ····4242</span>
            <span className="text-[11px] text-green-accent font-semibold">Default ✓</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-light">
            <MadaLogo size={24} />
            <span className="text-[14px] text-foreground flex-1">mada ····8888</span>
          </div>
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
      </div>

      <ComingSoonModal feature={comingSoonFeature || ''} open={!!comingSoonFeature} onClose={() => setComingSoonFeature(null)} />

      <AnimatePresence>
        {connectingPlatform && (
          <PlatformConnectFlow
            platformName={connectingPlatform.name}
            platformLogo={<connectingPlatform.Logo size={64} />}
            onComplete={() => {
              void handlePlatformConnect();
              setConnectingPlatform(null);
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
            onConfirm={() => {
              void handlePlatformDisconnect(disconnectPlatform);
              setDisconnectPlatform(null);
            }}
            onCancel={() => setDisconnectPlatform(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
