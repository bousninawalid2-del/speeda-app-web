import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, RefreshCw, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo, GoogleLogo, PinterestLogo, ThreadsLogo } from '../components/PlatformLogos';
import { useTranslation } from 'react-i18next';
import type { SocialAccount } from '@/services/social.service';

// ── Platform logo map ────────────────────────────────────────────────────────
const LOGOS: Record<string, React.FC<{ size?: number }>> = {
  instagram: InstagramLogo, tiktok: TikTokLogo, snapchat: SnapchatLogo,
  facebook: FacebookLogo, x: XLogo, youtube: YouTubeLogo,
  linkedin: LinkedInLogo, googlebusiness: GoogleLogo,
  pinterest: PinterestLogo, threads: ThreadsLogo,
};

interface PlatformDisplay {
  Logo:           React.FC<{ size?: number }>;
  name:           string;
  status:         'healthy' | 'warning' | 'error';
  lastSync:       string;
  tokenExpiry:    string;
  postsThisMonth: number;
  errors:         number;
}

function socialAccountToDisplay(acc: SocialAccount): PlatformDisplay {
  const name = acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1);
  return {
    Logo:           LOGOS[acc.platform.toLowerCase()] ?? InstagramLogo,
    name:           name === 'Googlebusiness' ? 'Google Business' : name,
    status:         acc.status ?? (acc.connected ? 'healthy' : 'error'),
    lastSync:       acc.lastSync ?? 'Recently',
    tokenExpiry:    '—',
    postsThisMonth: acc.postsThisMonth ?? 0,
    errors:         acc.errors ?? 0,
  };
}

// ── Fallback demo data ───────────────────────────────────────────────────────
const DEMO_PLATFORMS: PlatformDisplay[] = [
  { Logo: InstagramLogo, name: 'Instagram', status: 'healthy', lastSync: '2 min ago', tokenExpiry: 'Jun 15, 2026', postsThisMonth: 12, errors: 0 },
  { Logo: TikTokLogo, name: 'TikTok', status: 'healthy', lastSync: '5 min ago', tokenExpiry: 'May 20, 2026', postsThisMonth: 8, errors: 0 },
  { Logo: SnapchatLogo, name: 'Snapchat', status: 'warning', lastSync: '1h ago', tokenExpiry: 'Apr 2, 2026', postsThisMonth: 3, errors: 1 },
  { Logo: FacebookLogo, name: 'Facebook', status: 'healthy', lastSync: '3 min ago', tokenExpiry: 'Jul 10, 2026', postsThisMonth: 10, errors: 0 },
  { Logo: XLogo, name: 'X (Twitter)', status: 'error', lastSync: '3h ago', tokenExpiry: 'Expired', postsThisMonth: 5, errors: 3 },
];

const DEMO_ERRORS = [
  { platform: 'X (Twitter)', error: 'Authentication token expired', time: '3h ago', severity: 'critical' as const },
  { platform: 'Snapchat', error: 'Rate limit reached — retrying in 15 min', time: '1h ago', severity: 'warning' as const },
];

// ── Component ────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  healthy: { color: 'text-green-accent', icon: CheckCircle, label: 'Healthy' },
  warning: { color: 'text-orange-accent', icon: AlertTriangle, label: 'Warning' },
  error: { color: 'text-red-accent', icon: XCircle, label: 'Error' },
};

interface AccountHealthScreenProps {
  onBack:      () => void;
  onNavigate?: (screen: string) => void;
  /** Live social accounts from /api/social. Falls back to demo data. */
  accounts?:   SocialAccount[];
  isLoading?:  boolean;
  onRefresh?:  () => void;
}

export const AccountHealthScreen = ({
  onBack,
  onNavigate,
  accounts: liveAccounts,
  isLoading,
  onRefresh,
}: AccountHealthScreenProps) => {
  const { t } = useTranslation();

  const platforms: PlatformDisplay[] = liveAccounts
    ? liveAccounts.filter(a => a.connected).map(socialAccountToDisplay)
    : DEMO_PLATFORMS;

  const recentErrors = liveAccounts
    ? platforms
        .filter(p => p.errors > 0)
        .map(p => ({ platform: p.name, error: `${p.errors} posting error(s) this month`, time: p.lastSync, severity: p.status === 'error' ? 'critical' as const : 'warning' as const }))
    : DEMO_ERRORS;

  const healthyCount = platforms.filter(p => p.status === 'healthy').length;
  const warningCount = platforms.filter(p => p.status === 'warning').length;
  const errorCount   = platforms.filter(p => p.status === 'error').length;

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
          <h1 className="text-[20px] font-extrabold text-foreground">{t('accountHealth.title', 'Account Health')}</h1>
          <button onClick={onRefresh} className="ml-auto p-2 rounded-xl bg-card border border-border-light">
            {isLoading
              ? <Loader2 size={16} className="text-brand-blue animate-spin" />
              : <RefreshCw size={16} className="text-muted-foreground" />}
          </button>
        </div>

        {/* Health Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-green-accent/10 rounded-2xl p-4 text-center border border-green-accent/20">
            <CheckCircle size={24} className="text-green-accent mx-auto" />
            <p className="text-[22px] font-extrabold text-green-accent mt-1">{healthyCount}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{t('accountHealth.healthy', 'Healthy')}</p>
          </div>
          <div className="bg-orange-accent/10 rounded-2xl p-4 text-center border border-orange-accent/20">
            <AlertTriangle size={24} className="text-orange-accent mx-auto" />
            <p className="text-[22px] font-extrabold text-orange-accent mt-1">{warningCount}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{t('accountHealth.warnings', 'Warnings')}</p>
          </div>
          <div className="bg-red-accent/10 rounded-2xl p-4 text-center border border-red-accent/20">
            <XCircle size={24} className="text-red-accent mx-auto" />
            <p className="text-[22px] font-extrabold text-red-accent mt-1">{errorCount}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{t('accountHealth.errors', 'Errors')}</p>
          </div>
        </div>

        {isLoading && platforms.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-brand-blue animate-spin" />
          </div>
        ) : platforms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[15px] font-semibold text-foreground mb-1">No connected platforms</p>
            <button onClick={() => onNavigate?.('social')} className="text-brand-blue text-[13px] font-semibold mt-2">Connect your first account →</button>
          </div>
        ) : (
          <>
            {/* Platform Cards */}
            <h3 className="text-[16px] font-bold text-foreground mb-3">{t('accountHealth.platforms', 'Platform Status')}</h3>
            <div className="space-y-3 mb-5">
              {platforms.map((p, i) => {
                const cfg = statusConfig[p.status] ?? statusConfig.healthy;
                const Icon = cfg.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-card rounded-2xl p-4 border border-border-light">
                    <div className="flex items-center gap-3">
                      <p.Logo size={24} />
                      <div className="flex-1">
                        <span className="text-[14px] font-bold text-foreground">{p.name}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Icon size={12} className={cfg.color} />
                          <span className={`text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      </div>
                      {p.status === 'error' && (
                        <button onClick={() => onNavigate?.('social')} className="text-[11px] font-bold text-brand-blue bg-brand-blue/10 px-3 py-1.5 rounded-lg">
                          {t('accountHealth.reconnect', 'Reconnect')}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div>
                        <span className="text-[9px] uppercase text-muted-foreground font-semibold">{t('accountHealth.lastSync', 'Last Sync')}</span>
                        <p className="text-[12px] font-medium text-foreground">{p.lastSync}</p>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-muted-foreground font-semibold">{t('accountHealth.tokenExpiry', 'Token Expiry')}</span>
                        <p className={`text-[12px] font-medium ${p.tokenExpiry === 'Expired' ? 'text-red-accent' : 'text-foreground'}`}>{p.tokenExpiry}</p>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-muted-foreground font-semibold">{t('accountHealth.posts', 'Posts/Month')}</span>
                        <p className="text-[12px] font-medium text-foreground">{p.postsThisMonth}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Recent Errors */}
            {recentErrors.length > 0 && (
              <>
                <h3 className="text-[16px] font-bold text-foreground mb-3">{t('accountHealth.recentErrors', 'Recent Errors')}</h3>
                <div className="space-y-2">
                  {recentErrors.map((err, i) => (
                    <div key={i} className={`rounded-xl p-3 border ${
                      err.severity === 'critical' ? 'bg-red-accent/5 border-red-accent/20' : 'bg-orange-accent/5 border-orange-accent/10'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-foreground">{err.platform}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          err.severity === 'critical' ? 'bg-red-accent text-primary-foreground' : 'bg-orange-accent/20 text-orange-accent'
                        }`}>{err.severity}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{err.time}</span>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-1">{err.error}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
