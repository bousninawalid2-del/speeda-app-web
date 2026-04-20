import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Copy, Share2, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReferral } from '@/hooks/useReferral';

interface ReferralScreenProps {
  onBack: () => void;
}

export const ReferralScreen = ({ onBack }: ReferralScreenProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useReferral();

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.referralUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!data) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'Join Speeda AI', url: data.referralUrl }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
          <h1 className="text-[20px] font-bold text-foreground">{t('referral.title')}</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-brand-blue animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Hero */}
            <div className="text-center mb-6">
              <p className="text-[28px] font-extrabold text-foreground">{t('referral.hero')}</p>
              <p className="text-[14px] text-muted-foreground mt-2 leading-[1.55]">{t('referral.subtitle')}</p>
            </div>

            {/* Referral Link */}
            <div className="bg-card rounded-2xl border border-border-light p-4">
              <p className="text-[12px] text-muted-foreground mb-2">{t('referral.yourLink')}</p>
              <div className="bg-muted rounded-xl px-4 py-3 text-[14px] font-medium text-foreground break-all">{data.referralUrl}</div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleCopy} className="flex-1 h-10 rounded-xl border border-border text-foreground text-[13px] font-semibold flex items-center justify-center gap-2 btn-press">
                  {copied ? <Check size={14} className="text-green-accent" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : t('referral.copyLink')}
                </button>
                <button onClick={handleShare} className="flex-1 h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold flex items-center justify-center gap-2 shadow-btn btn-press">
                  <Share2 size={14} />
                  {t('referral.shareLink')}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Invited',       value: String(data.totalInvited) },
                { label: 'Signed Up',     value: String(data.totalSignedUp) },
                { label: 'Tokens Earned', value: `${data.totalTokens} ✦` },
              ].map((s, i) => (
                <div key={i} className="bg-card rounded-2xl p-3 border border-border-light text-center">
                  <p className="text-[20px] font-extrabold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Invited Friends */}
            <h2 className="text-[18px] font-bold text-foreground mt-6 mb-3">{t('referral.invited')}</h2>
            <div className="bg-card rounded-2xl border border-border-light overflow-hidden">
              {data.friends.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[14px] text-muted-foreground">No invites yet — share your link to get started!</p>
                </div>
              ) : (
                data.friends.map((f, i) => (
                  <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i > 0 ? 'border-t border-border-light' : ''}`}>
                    <div>
                      <p className="text-[14px] font-medium text-foreground">{f.name}</p>
                      <p className={`text-[11px] mt-0.5 ${f.status === 'signed_up' ? 'text-green-accent' : 'text-orange-accent'}`}>
                        {f.status === 'signed_up' ? t('referral.signedUp') : t('referral.pending')}
                      </p>
                    </div>
                    {f.tokens > 0 && <span className="text-[13px] font-semibold text-purple">+{f.tokens} ✦</span>}
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  );
};
