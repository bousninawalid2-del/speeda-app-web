import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo, GoogleLogo, PinterestLogo, ThreadsLogo } from '../components/PlatformLogos';
import { useTranslation } from 'react-i18next';

const platforms = [
  { Logo: InstagramLogo, name: 'Instagram', status: 'healthy', lastSync: '2 min ago', tokenExpiry: 'Jun 15, 2026', postsThisMonth: 12, errors: 0 },
  { Logo: TikTokLogo, name: 'TikTok', status: 'healthy', lastSync: '5 min ago', tokenExpiry: 'May 20, 2026', postsThisMonth: 8, errors: 0 },
  { Logo: SnapchatLogo, name: 'Snapchat', status: 'warning', lastSync: '1h ago', tokenExpiry: 'Apr 2, 2026', postsThisMonth: 3, errors: 1 },
  { Logo: FacebookLogo, name: 'Facebook', status: 'healthy', lastSync: '3 min ago', tokenExpiry: 'Jul 10, 2026', postsThisMonth: 10, errors: 0 },
  { Logo: XLogo, name: 'X (Twitter)', status: 'error', lastSync: '3h ago', tokenExpiry: 'Expired', postsThisMonth: 5, errors: 3 },
  { Logo: YouTubeLogo, name: 'YouTube', status: 'healthy', lastSync: '10 min ago', tokenExpiry: 'Aug 1, 2026', postsThisMonth: 4, errors: 0 },
  { Logo: LinkedInLogo, name: 'LinkedIn', status: 'healthy', lastSync: '15 min ago', tokenExpiry: 'Oct 12, 2026', postsThisMonth: 2, errors: 0 },
  { Logo: GoogleLogo, name: 'Google Business', status: 'healthy', lastSync: '8 min ago', tokenExpiry: 'Sep 5, 2026', postsThisMonth: 6, errors: 0 },
  { Logo: PinterestLogo, name: 'Pinterest', status: 'healthy', lastSync: '20 min ago', tokenExpiry: 'Nov 1, 2026', postsThisMonth: 1, errors: 0 },
  { Logo: ThreadsLogo, name: 'Threads', status: 'healthy', lastSync: '12 min ago', tokenExpiry: 'Dec 15, 2026', postsThisMonth: 3, errors: 0 },
];

const recentErrors = [
  { platform: 'X (Twitter)', error: 'Authentication token expired', time: '3h ago', severity: 'critical' },
  { platform: 'Snapchat', error: 'Rate limit reached — retrying in 15 min', time: '1h ago', severity: 'warning' },
  { platform: 'X (Twitter)', error: 'Post failed: media format not supported', time: '5h ago', severity: 'error' },
  { platform: 'X (Twitter)', error: 'API timeout — post queued for retry', time: 'Yesterday', severity: 'warning' },
];

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  healthy: { color: 'text-green-accent', icon: CheckCircle, label: 'Healthy' },
  warning: { color: 'text-orange-accent', icon: AlertTriangle, label: 'Warning' },
  error: { color: 'text-red-accent', icon: XCircle, label: 'Error' },
};

export const AccountHealthScreen = ({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (screen: string) => void }) => {
  const { t } = useTranslation();
  const healthyCount = platforms.filter(p => p.status === 'healthy').length;
  const warningCount = platforms.filter(p => p.status === 'warning').length;
  const errorCount = platforms.filter(p => p.status === 'error').length;

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
          <h1 className="text-[20px] font-extrabold text-foreground">{t('accountHealth.title', 'Account Health')}</h1>
          <button className="ml-auto p-2 rounded-xl bg-card border border-border-light"><RefreshCw size={16} className="text-muted-foreground" /></button>
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

        {/* Platform Cards */}
        <h3 className="text-[16px] font-bold text-foreground mb-3">{t('accountHealth.platforms', 'Platform Status')}</h3>
        <div className="space-y-3 mb-5">
          {platforms.map((p, i) => {
            const cfg = statusConfig[p.status];
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
                    <button onClick={() => onNavigate?.('settings')} className="text-[11px] font-bold text-brand-blue bg-brand-blue/10 px-3 py-1.5 rounded-lg">
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
        <h3 className="text-[16px] font-bold text-foreground mb-3">{t('accountHealth.recentErrors', 'Recent Errors')}</h3>
        <div className="space-y-2">
          {recentErrors.map((err, i) => (
            <div key={i} className={`rounded-xl p-3 border ${
              err.severity === 'critical' ? 'bg-red-accent/5 border-red-accent/20' :
              err.severity === 'error' ? 'bg-red-accent/5 border-red-accent/10' :
              'bg-orange-accent/5 border-orange-accent/10'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-foreground">{err.platform}</span>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  err.severity === 'critical' ? 'bg-red-accent text-primary-foreground' :
                  err.severity === 'error' ? 'bg-red-accent/20 text-red-accent' :
                  'bg-orange-accent/20 text-orange-accent'
                }`}>{err.severity}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{err.time}</span>
              </div>
              <p className="text-[12px] text-muted-foreground mt-1">{err.error}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
