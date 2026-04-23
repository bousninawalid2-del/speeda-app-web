import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useCreateCampaign } from '@/hooks/useCampaigns';
import { usePosts } from '@/hooks/usePosts';
import {
  InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo,
  GoogleLogo, YouTubeLogo, XLogo, LinkedInLogo,
} from '../components/PlatformLogos';

// ─── Platform logo map ────────────────────────────────────────────────────────

const PLATFORM_LOGOS: Record<string, React.FC<{ size?: number }>> = {
  instagram: InstagramLogo,
  tiktok:    TikTokLogo,
  snapchat:  SnapchatLogo,
  facebook:  FacebookLogo,
  google:    GoogleLogo,
  youtube:   YouTubeLogo,
  x:         XLogo,
  linkedin:  LinkedInLogo,
};

// ─── Duration → days map ─────────────────────────────────────────────────────

const DURATION_DAYS: Record<string, number> = {
  '3 days':  3,
  '1 week':  7,
  '2 weeks': 14,
};

// ─── Component ────────────────────────────────────────────────────────────────

export const QuickAdScreen = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const [step, setStep]                         = useState(1);
  const [selected, setSelected]                 = useState<string[]>([]);
  const [budget, setBudget]                     = useState('500');
  const [duration, setDuration]                 = useState('1 week');
  const [creative, setCreative]                 = useState<string | null>(null);
  const [targetingMode, setTargetingMode]       = useState<'ai' | 'manual'>('ai');
  const [manualLocation, setManualLocation]     = useState('');
  const [manualAgeMin, setManualAgeMin]         = useState(22);
  const [manualAgeMax, setManualAgeMax]         = useState(38);
  const [manualInterests, setManualInterests]   = useState<string[]>([]);
  const [success, setSuccess]                   = useState(false);

  const { data: accounts, isLoading: accountsLoading } = useSocialAccounts();
  const { data: postsData, isLoading: postsLoading }   = usePosts({ status: 'Published', page: 1 });
  const { mutateAsync: createCampaign, isPending }      = useCreateCampaign();

  const connectedPlatforms = (accounts ?? []).filter(a => a.connected);

  const toggle = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const handleLaunch = async () => {
    if (selected.length === 0) { toast.error(t('quickAd.toasts.selectPlatform')); return; }
    const budgetNum = parseInt(budget.replace(',', ''));
    if (!budgetNum || budgetNum < 50) { toast.error(t('quickAd.toasts.minBudget')); return; }

    const days      = DURATION_DAYS[duration] ?? 7;
    const startDate = new Date().toISOString();
    const endDate   = new Date(Date.now() + days * 86_400_000).toISOString();

    try {
      await createCampaign({
        name:      `Quick Ad — ${selected.join(', ')} — ${new Date().toLocaleDateString()}`,
        platforms: selected.join(','),
        budget:    budgetNum,
        startDate,
        endDate,
        isAI:      targetingMode === 'ai',
        location:  targetingMode === 'manual' && manualLocation ? manualLocation : undefined,
        ageRange:  targetingMode === 'manual' ? `${manualAgeMin}-${manualAgeMax}` : undefined,
        interests: targetingMode === 'manual' && manualInterests.length > 0 ? manualInterests.join(',') : undefined,
        ayrsharePostIds: creative ?? undefined,
      });
      setSuccess(true);
    } catch {
      toast.error(t('quickAd.toasts.launchFailed'));
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-background min-h-screen flex flex-col items-center justify-center px-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }} className="w-20 h-20 rounded-full bg-green-accent flex items-center justify-center">
          <Check size={40} className="text-primary-foreground" strokeWidth={3} />
        </motion.div>
        <h2 className="text-[24px] font-extrabold text-foreground mt-6">{t('quickAd.adLaunched')}</h2>
        <p className="text-[14px] text-muted-foreground mt-2 text-center">{t('quickAd.adLaunchedDesc', { count: selected.length })}</p>
        <button onClick={onBack} className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-8">{t('quickAd.backToCampaigns')}</button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onBack()}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[18px] font-bold text-foreground flex-1">{t('quickAd.header')}</h1>
          <span className="text-[13px] text-muted-foreground">{t('quickAd.stepOf', { current: step, total: 3 })}</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mt-3 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'gradient-hero' : 'bg-border'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Platform Selection ─────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-[18px] font-bold text-foreground">{t('quickAd.step1Title')}</h2>
              <p className="text-[13px] text-muted-foreground mt-1">{t('quickAd.step1Subtitle')}</p>

              {accountsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="text-brand-blue animate-spin" />
                </div>
              ) : connectedPlatforms.length === 0 ? (
                <div className="mt-5 bg-card rounded-2xl p-6 border border-border-light text-center">
                  <p className="text-[14px] font-semibold text-foreground">{t('quickAd.noConnected')}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{t('quickAd.connectFirst')}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 mt-5">
                    {connectedPlatforms.map(p => {
                      const Logo = PLATFORM_LOGOS[p.platform.toLowerCase()] ?? InstagramLogo;
                      return (
                        <button key={p.platform} onClick={() => toggle(p.platform)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${selected.includes(p.platform) ? 'bg-purple-soft border-brand-blue' : 'bg-card border-border-light'}`}>
                          <Logo size={28} />
                          <span className="text-[11px] font-semibold text-foreground capitalize">{p.platform}</span>
                          {p.followers > 0 && <span className="text-[9px] text-muted-foreground">~{p.followers >= 1000 ? `${(p.followers / 1000).toFixed(1)}K` : p.followers}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-purple-soft rounded-2xl p-3 mt-4">
                    <p className="text-[13px] text-purple font-semibold">{t('quickAd.tipMulti')}</p>
                  </div>
                </>
              )}

              <button
                onClick={() => { if (selected.length === 0) { toast.error(t('quickAd.toasts.selectPlatform')); return; } setStep(2); }}
                className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-5"
              >
                {t('quickAd.next')}
              </button>
            </motion.div>
          )}

          {/* ── Step 2: Budget & Targeting ─────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-[18px] font-bold text-foreground">{t('quickAd.step2Title')}</h2>

              <h3 className="text-[14px] font-bold text-foreground mt-5 mb-2">{t('quickAd.budget')}</h3>
              <div className="flex flex-wrap gap-2">
                {['250', '500', '1,000', '2,500'].map(b => (
                  <button key={b} onClick={() => setBudget(b)} className={`rounded-3xl px-5 py-2 text-[13px] font-semibold ${budget === b ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>SAR {b}</button>
                ))}
              </div>

              <h3 className="text-[14px] font-bold text-foreground mt-5 mb-2">{t('quickAd.duration')}</h3>
              <div className="flex flex-wrap gap-2">
                {[{ id: '3 days', slug: 'days3' }, { id: '1 week', slug: 'week1' }, { id: '2 weeks', slug: 'weeks2' }].map(d => (
                  <button key={d.id} onClick={() => setDuration(d.id)} className={`rounded-3xl px-5 py-2 text-[13px] font-semibold ${duration === d.id ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>{t(`quickAd.durations.${d.slug}`)}</button>
                ))}
              </div>

              <h3 className="text-[14px] font-bold text-foreground mt-5 mb-2">{t('quickAd.targeting')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setTargetingMode('ai')} className={`relative rounded-2xl p-4 text-start transition-all overflow-hidden ${targetingMode === 'ai' ? 'border-2 border-brand-blue bg-purple-soft' : 'border border-border-light bg-card'}`}>
                  <span className="text-[18px] block mb-1">✦</span>
                  <p className="text-[13px] font-bold text-foreground">{t('quickAd.aiTargeting')}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{t('quickAd.aiTargetingDesc')}</p>
                </button>
                <button onClick={() => setTargetingMode('manual')} className={`rounded-2xl p-4 text-start transition-all ${targetingMode === 'manual' ? 'border-2 border-brand-blue bg-purple-soft' : 'border border-border-light bg-card'}`}>
                  <span className="text-[18px] block mb-1">🎯</span>
                  <p className="text-[13px] font-bold text-foreground">{t('quickAd.manualTargeting')}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{t('quickAd.manualTargetingDesc')}</p>
                </button>
              </div>

              {targetingMode === 'manual' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-3 overflow-hidden">
                  <div>
                    <label className="text-[12px] font-bold text-foreground block mb-1">{t('quickAd.location')}</label>
                    <input value={manualLocation} onChange={e => setManualLocation(e.target.value)} placeholder={t('quickAd.locationPlaceholder')} className="w-full h-10 px-4 rounded-xl border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-foreground block mb-1">{t('quickAd.ageRange', { min: manualAgeMin, max: manualAgeMax })}</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min={13} max={65} value={manualAgeMin} onChange={e => setManualAgeMin(Number(e.target.value))} className="flex-1 accent-brand-blue" />
                      <input type="range" min={13} max={65} value={manualAgeMax} onChange={e => setManualAgeMax(Number(e.target.value))} className="flex-1 accent-brand-blue" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-foreground block mb-1">{t('quickAd.interests')}</label>
                    <div className="flex flex-wrap gap-2">
                      {[{ id: 'Food', slug: 'food' }, { id: 'Restaurants', slug: 'restaurants' }, { id: 'Lifestyle', slug: 'lifestyle' }, { id: 'Shopping', slug: 'shopping' }, { id: 'Travel', slug: 'travel' }, { id: 'Fitness', slug: 'fitness' }].map(interest => (
                        <button key={interest.id} onClick={() => setManualInterests(prev => prev.includes(interest.id) ? prev.filter(i => i !== interest.id) : [...prev, interest.id])}
                          className={`rounded-3xl px-3 py-1.5 text-[11px] font-semibold ${manualInterests.includes(interest.id) ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>{t(`quickAd.interestOptions.${interest.slug}`)}</button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Cost summary */}
              <div className="bg-card rounded-2xl p-4 mt-4 border border-border-light space-y-2">
                <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">{t('quickAd.adSpend')}</span><span className="text-foreground">SAR {budget}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">{t('quickAd.speedaFee')}</span><span className="text-foreground">SAR {Math.round(parseInt(budget.replace(',', '')) * 0.15)}</span></div>
                <div className="border-t border-border-light pt-2 flex justify-between">
                  <span className="text-[14px] font-bold text-foreground">{t('quickAd.total')}</span>
                  <span className="text-[16px] font-extrabold text-brand-blue">SAR {Math.round(parseInt(budget.replace(',', '')) * 1.15)}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(1)} className="flex-1 h-[56px] rounded-2xl border border-border text-foreground font-bold text-[15px] btn-press">{t('quickAd.back')}</button>
                <button onClick={() => setStep(3)} className="flex-1 h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press">{t('quickAd.next')}</button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Creative & Launch ──────────────────────────────────── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-[18px] font-bold text-foreground">{t('quickAd.step3Title')}</h2>

              <button className="w-full mt-4 p-5 rounded-2xl border-2 border-dashed border-border flex items-center gap-3 card-tap">
                <Sparkles size={24} className="text-brand-teal" />
                <div className="text-start">
                  <p className="text-[14px] font-bold text-foreground">{t('quickAd.generateNew')}</p>
                  <p className="text-[12px] text-muted-foreground">{t('quickAd.generateNewDesc')}</p>
                </div>
              </button>

              {postsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="text-brand-blue animate-spin" />
                </div>
              ) : (postsData?.posts ?? []).filter(p => p.status === 'Published').length > 0 ? (
                <>
                  <p className="text-[13px] text-muted-foreground mt-4 mb-2">{t('quickAd.useExisting')}</p>
                  {postsData!.posts.filter(p => p.status === 'Published').slice(0, 5).map(p => (
                    <button key={p.id} onClick={() => setCreative(p.ayrshareId ?? p.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 mt-2 transition-all ${creative === (p.ayrshareId ?? p.id) ? 'border-brand-blue bg-purple-soft' : 'border-border-light bg-card'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${creative === (p.ayrshareId ?? p.id) ? 'border-brand-blue' : 'border-border'}`}>
                        {creative === (p.ayrshareId ?? p.id) && <div className="w-3 h-3 rounded-full bg-brand-blue" />}
                      </div>
                      <div className="text-start flex-1">
                        <p className="text-[13px] font-bold text-foreground capitalize">🖼️ {p.caption.slice(0, 50)}{p.caption.length > 50 ? '…' : ''}</p>
                        <p className="text-[11px] text-muted-foreground">{p.platform} · {p.status}</p>
                      </div>
                    </button>
                  ))}
                </>
              ) : null}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="h-[56px] px-6 rounded-2xl border border-border text-foreground font-bold text-[14px] btn-press">{t('quickAd.back')}</button>
                <button
                  onClick={handleLaunch}
                  disabled={isPending}
                  className="flex-1 h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[14px] shadow-btn btn-press disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? <><Loader2 size={18} className="animate-spin" /> {t('quickAd.launching')}</> : t('quickAd.launchAd', { amount: Math.round(parseInt(budget.replace(',', '')) * 1.15) })}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
