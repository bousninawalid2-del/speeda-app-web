import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, MoreVertical } from 'lucide-react';
import { InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo, GoogleLogo, PinterestLogo, ThreadsLogo } from '../components/PlatformLogos';
import { PlatformConnectFlow, DisconnectDialog, PlatformManageMenu } from '../components/PlatformConnectFlow';
import { CalendarTab } from '../components/CalendarTab';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocialAccountData {
  platform:   string;
  username?:  string;
  followers:  number;
  connected:  boolean;
}

interface AccountDisplay {
  Logo:      React.ComponentType<{ size?: number }>;
  name:      string;
  platform:  string;
  followers: string;
  connected: boolean;
  health:    'healthy' | 'warning' | 'error' | 'none';
  note?:     string;
}

interface SocialMediaScreenProps {
  onBack:          () => void;
  externalAccounts?: SocialAccountData[];
  isLoading?:      boolean;
  /** Called when user clicks Connect — returns Ayrshare Max URL to open */
  onConnect?:      () => Promise<string | null>;
  /** Called when user confirms disconnect */
  onDisconnect?:   (platform: string) => Promise<void>;
}

// ─── Static platform catalogue ───────────────────────────────────────────────

type CatalogueEntry = Pick<AccountDisplay, 'Logo' | 'name' | 'platform'> & { note?: string };

const PLATFORM_CATALOGUE: CatalogueEntry[] = [
  { Logo: InstagramLogo, name: 'Instagram',       platform: 'instagram' },
  { Logo: TikTokLogo,   name: 'TikTok',           platform: 'tiktok' },
  { Logo: SnapchatLogo, name: 'Snapchat',         platform: 'snapchat', note: 'Limited features — Stories only' },
  { Logo: FacebookLogo, name: 'Facebook',          platform: 'facebook' },
  { Logo: XLogo,        name: 'X',                platform: 'x' },
  { Logo: YouTubeLogo,  name: 'YouTube',           platform: 'youtube' },
  { Logo: GoogleLogo,   name: 'Google Biz',        platform: 'googlebusiness' },
  { Logo: LinkedInLogo, name: 'LinkedIn',           platform: 'linkedin' },
  { Logo: PinterestLogo,name: 'Pinterest',          platform: 'pinterest' },
  { Logo: ThreadsLogo,  name: 'Threads',            platform: 'threads' },
];

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  if (n === 0)        return '—';
  return String(n);
}

// ─── Static post queue (mock) ─────────────────────────────────────────────────

const queue = [
  { Logo: InstagramLogo, title: 'New menu item showcase',  type: 'Reel',   time: 'Tomorrow, 7:00 PM',  status: 'Scheduled',    color: 'text-green-accent' },
  { Logo: TikTokLogo,   title: 'Behind the kitchen',      type: 'Video',  time: 'Tomorrow, 12:00 PM', status: 'Scheduled',    color: 'text-green-accent' },
  { Logo: FacebookLogo, title: 'Weekend special offer',    type: 'Post',   time: 'Fri, 6:00 PM',       status: 'Draft',        color: 'text-orange-accent' },
  { Logo: XLogo,        title: 'Our story — how we started',type: 'Thread',time: 'Fri, 9:00 AM',       status: 'Scheduled',    color: 'text-green-accent' },
  { Logo: InstagramLogo,title: 'Customer testimonial',     type: 'Story',  time: 'Sat, 10:00 AM',      status: 'AI Generated', color: 'text-purple' },
  { Logo: YouTubeLogo,  title: '30-sec shawarma prep',     type: 'Short',  time: 'Sat, 2:00 PM',       status: 'Pending',      color: 'text-orange-accent' },
];

const healthIndicator = (health: string) => {
  switch (health) {
    case 'healthy': return '🟢';
    case 'warning': return '🟡';
    case 'error':   return '🔴';
    default:        return null;
  }
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const AccountSkeleton = () => (
  <div className="bg-card rounded-2xl p-4 border border-border-light flex items-center gap-3 animate-pulse">
    <div className="w-6 h-6 rounded-full bg-muted" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-muted rounded w-24" />
      <div className="h-2.5 bg-muted rounded w-16" />
    </div>
    <div className="h-3 bg-muted rounded w-16" />
  </div>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export const SocialMediaScreen = ({
  onBack,
  externalAccounts,
  isLoading = false,
  onConnect,
  onDisconnect,
}: SocialMediaScreenProps) => {
  const [tab, setTab] = useState('Accounts');
  const [connectingPlatform, setConnectingPlatform] = useState<{ name: string; Logo: React.ComponentType<{ size?: number }> } | null>(null);
  const [managePlatform,     setManagePlatform]     = useState<string | null>(null);
  const [disconnectPlatform, setDisconnectPlatform] = useState<string | null>(null);
  const [disconnecting,      setDisconnecting]      = useState(false);
  const [connectLoading,     setConnectLoading]     = useState(false);

  // Merge static catalogue with external data
  const accounts: AccountDisplay[] = PLATFORM_CATALOGUE.map(cat => {
    const ext = externalAccounts?.find(a => a.platform === cat.platform);
    return {
      ...cat,
      connected: ext?.connected ?? false,
      followers: ext ? formatFollowers(ext.followers) : '—',
      health:    ext?.connected ? 'healthy' : 'none',
    } as AccountDisplay;
  });

  const connectedCount = accounts.filter(a => a.connected).length;
  const totalFollowers = externalAccounts
    ? externalAccounts.reduce((s, a) => s + (a.connected ? a.followers : 0), 0)
    : 0;

  const handleConnect = async () => {
    if (!onConnect) {
      // Fallback: no-op when running without backend
      return;
    }
    setConnectLoading(true);
    try {
      const url = await onConnect();
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnectConfirm = async () => {
    if (!disconnectPlatform) return;
    setDisconnecting(true);
    try {
      if (onDisconnect) await onDisconnect(disconnectPlatform);
    } finally {
      setDisconnecting(false);
      setDisconnectPlatform(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
          <h1 className="text-[20px] font-bold text-foreground flex-1">Social Media</h1>
          <button
            onClick={handleConnect}
            disabled={connectLoading}
            className="h-8 px-3 rounded-xl bg-brand-blue text-primary-foreground text-[12px] font-bold flex items-center gap-1 disabled:opacity-60"
          >
            {connectLoading ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus size={14} />}
            Connect
          </button>
        </div>
        <p className="text-[13px] text-muted-foreground mb-4">{connectedCount} of {accounts.length} connected</p>

        {/* Stats Banner */}
        <div className="gradient-hero rounded-2xl p-4 grid grid-cols-3 gap-2 text-center">
          {[
            { v: isLoading ? '—' : formatFollowers(totalFollowers), l: 'Total Followers' },
            { v: `${connectedCount}/${accounts.length}`,             l: 'Platforms' },
            { v: '5',                                                l: 'Scheduled' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-[20px] font-extrabold text-primary-foreground">{s.v}</p>
              <p className="text-[10px] text-primary-foreground/70">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-4 bg-card rounded-2xl p-1 border border-border flex">
          {['Accounts', 'Post Queue', 'Calendar'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 h-9 rounded-xl text-[12px] font-semibold ${tab === t ? 'bg-brand-blue text-primary-foreground' : 'text-muted-foreground'}`}>{t}</button>
          ))}
        </div>

        {tab === 'Accounts' && (
          <div className="mt-4 space-y-2">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <AccountSkeleton key={i} />)
              : accounts.map((a, i) => (
                <div key={i} className="bg-card rounded-2xl p-4 border border-border-light flex items-center gap-3">
                  <div className="relative">
                    <a.Logo size={24} />
                    {a.connected && healthIndicator(a.health) && (
                      <span className="absolute -top-1 -right-1 text-[8px]">{healthIndicator(a.health)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-foreground">{a.name}</p>
                    <p className="text-[12px] text-muted-foreground">{a.followers}</p>
                    {a.note && <p className="text-[10px] text-muted-foreground">{a.note}</p>}
                    {a.health === 'error' && a.connected && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-red-accent font-semibold">⚠️ Connection issue</span>
                        <button onClick={handleConnect} className="text-[10px] text-brand-blue font-semibold">Reconnect</button>
                      </div>
                    )}
                  </div>
                  {a.connected ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-green-accent">✓ Connected</span>
                      <button onClick={() => setManagePlatform(a.name)}><MoreVertical size={14} className="text-muted-foreground" /></button>
                    </div>
                  ) : (
                    <button onClick={handleConnect} className="text-[11px] font-semibold text-brand-blue">Connect</button>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {tab === 'Post Queue' && (
          <div className="mt-4 space-y-2">
            {queue.map((q, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border-light flex items-center gap-3">
                <q.Logo size={20} />
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-foreground">{q.title}</p>
                  <p className="text-[11px] text-muted-foreground">{q.type} · {q.time}</p>
                </div>
                <span className={`text-[11px] font-semibold ${q.color}`}>{q.status}</span>
              </div>
            ))}
            <button className="w-full bg-card rounded-2xl p-4 border-2 border-dashed border-border text-brand-blue text-[13px] font-bold text-center">+ Schedule New Post</button>
          </div>
        )}

        {tab === 'Calendar' && (
          <div className="mt-4">
            <CalendarTab onCreatePost={() => {}} onCreateStrategy={() => {}} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {connectingPlatform && (
          <PlatformConnectFlow
            platformName={connectingPlatform.name}
            platformLogo={<connectingPlatform.Logo size={64} />}
            onComplete={() => setConnectingPlatform(null)}
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
            onConfirm={handleDisconnectConfirm}
            onCancel={() => setDisconnectPlatform(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
