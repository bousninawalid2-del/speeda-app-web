import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PaymentFlow } from '../components/PaymentFlow';
import _speedaLogoWhite from '../assets/speeda-logo-white.png';
const speedaLogoWhite = (typeof _speedaLogoWhite === 'string' ? _speedaLogoWhite : (_speedaLogoWhite as { src: string }).src);

export interface LiveTokenData {
  balance:  number;
  used:     number;
  total:    number;
  history:  Array<{ id: string; description: string; tokens: number; agent: string; createdAt: string }>;
  byAgent:  Record<string, number>;
}

interface TokensScreenProps {
  onBack:         () => void;
  scrollToPacks?: boolean;
  liveData?:      LiveTokenData;
  isLoading?:     boolean;
  isPurchasePending?: boolean;
  onPurchase?:    (packId: string) => Promise<void>;
}

const tokenPacks = [
  { id: 'fallback-1', amount: 200, price: 199, discount: null, badge: null },
  { id: 'fallback-2', amount: 500, price: 449, discount: '20', badge: null },
  { id: 'fallback-3', amount: 1500, price: 1199, discount: '33', badge: 'popular' },
  { id: 'fallback-4', amount: 5000, price: 3499, discount: '48', badge: 'bestValue' },
];

type AgentType = 'Content' | 'Strategy' | 'Engagement' | 'Analytics' | 'Ads' | 'Brand';

const agentColors: Record<AgentType, { bg: string; text: string; bar: string }> = {
  Content: { bg: 'bg-purple-soft', text: 'text-purple', bar: 'hsl(254, 75%, 65%)' },
  Strategy: { bg: 'bg-purple-soft', text: 'text-purple', bar: 'hsl(280, 70%, 60%)' },
  Engagement: { bg: 'bg-green-soft', text: 'text-green-accent', bar: 'hsl(157, 100%, 42%)' },
  Analytics: { bg: 'bg-purple-soft', text: 'text-brand-teal', bar: 'hsl(193, 100%, 48%)' },
  Ads: { bg: 'bg-orange-soft', text: 'text-orange-accent', bar: 'hsl(28, 100%, 63%)' },
  Brand: { bg: 'bg-red-soft', text: 'text-red-accent', bar: 'hsl(340, 80%, 60%)' },
};

const usageHistory: { desc: string; tokens: number; time: string; agent: AgentType }[] = [
  { desc: 'Content generation — Instagram post', tokens: 3, time: '2h ago', agent: 'Content' },
  { desc: 'Ad creative — Ramadan campaign', tokens: 5, time: '4h ago', agent: 'Ads' },
  { desc: 'A/B variations — Weekend offer', tokens: 4, time: 'Yesterday', agent: 'Content' },
  { desc: 'Smart metadata — TikTok video', tokens: 2, time: 'Yesterday', agent: 'Content' },
  { desc: 'AI response — Google review', tokens: 1, time: 'Yesterday', agent: 'Engagement' },
  { desc: 'Content generation — Snapchat story', tokens: 3, time: '2 days ago', agent: 'Content' },
  { desc: 'Strategy plan — March campaign', tokens: 8, time: '3 days ago', agent: 'Strategy' },
  { desc: 'Brand voice analysis', tokens: 2, time: '3 days ago', agent: 'Brand' },
  { desc: 'Weekly analytics report', tokens: 4, time: '4 days ago', agent: 'Analytics' },
];

const agentSummary: { agent: AgentType; tokens: number; percent: number }[] = [
  { agent: 'Content', tokens: 420, percent: 52 },
  { agent: 'Strategy', tokens: 128, percent: 16 },
  { agent: 'Engagement', tokens: 96, percent: 12 },
  { agent: 'Analytics', tokens: 72, percent: 9 },
  { agent: 'Ads', tokens: 48, percent: 6 },
  { agent: 'Brand', tokens: 36, percent: 5 },
];

// Currency helper
const formatPrice = (price: number, lang: string): string => {
  if (lang === 'ar') return `${price.toLocaleString()} ريال`;
  return `SAR ${price.toLocaleString()}`;
};

const formatPerToken = (perToken: string, lang: string): string => {
  if (lang === 'ar') return `${perToken} ريال/توكن`;
  return `SAR ${perToken}/token`;
};

export const TokensScreen = ({ onBack, scrollToPacks, liveData, isLoading, isPurchasePending, onPurchase }: TokensScreenProps) => {
  const { t, i18n } = useTranslation();
  const [howOpen, setHowOpen] = useState(false);
  const [autoRecharge, setAutoRecharge] = useState(false);
  const [buyingPack, setBuyingPack] = useState<number | null>(null);
  const [purchasingPackIdx, setPurchasingPackIdx] = useState<number | null>(null);

  // Prefer live data; fall back to static mock
  const balance     = liveData?.balance  ?? 342;
  const totalTokens = liveData?.total    ?? 800;
  const usedTokens  = liveData?.used     ?? 458;
  const liveHistory = liveData?.history;
  const liveByAgent = liveData?.byAgent;
  const availablePacks = liveData?.packages?.length
    ? liveData.packages.map((pack, idx) => ({
        id: pack.id,
        amount: pack.tokenCount,
        price: pack.price,
        discount: idx === 1 ? '20' : idx === 2 ? '33' : idx >= 3 ? '48' : null,
        badge: idx === 2 ? 'popular' : idx === 3 ? 'bestValue' : null,
      }))
    : tokenPacks;

  const handlePurchase = async (packIdx: number) => {
    const pack = availablePacks[packIdx];
    if (!pack || !onPurchase) {
      setBuyingPack(packIdx);
      return;
    }
    setPurchasingPackIdx(packIdx);
    try {
      await onPurchase(pack.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Purchase failed. Please try again.');
    } finally {
      setPurchasingPackIdx(null);
    }
  };
  const packsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollToPacks && packsRef.current) {
      setTimeout(() => {
        packsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }, [scrollToPacks]);

  return (
    <>
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
        <div className="px-5 pt-6">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
            <h1 className="text-[20px] font-bold text-foreground">{t('tokens.title')}</h1>
          </div>

          {/* Hero Balance */}
          <div className="bg-card rounded-2xl border border-border-light p-5">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-extrabold text-brand-blue tracking-[-0.02em]">{isLoading ? '…' : `✦ ${balance}`}</span>
              <span className="text-[18px] text-muted-foreground">{t('tokens.of', { total: totalTokens })}</span>
            </div>
            <div className="h-3 rounded-full bg-muted mt-3 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: totalTokens > 0 ? `${((balance / totalTokens) * 100).toFixed(1)}%` : '0%' }} transition={{ duration: 0.8 }} className="h-full gradient-btn rounded-full" />
            </div>
            <p className="text-[12px] text-muted-foreground mt-2">{t('tokens.planInfo')}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{t('tokens.dailyAvg')}</p>
          </div>

          {/* How Tokens Work */}
          <button onClick={() => setHowOpen(!howOpen)} className="w-full mt-4 bg-card rounded-2xl border border-border-light p-4 flex items-center justify-between">
            <span className="text-[14px] font-semibold text-foreground">{t('tokens.howWork')}</span>
            {howOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {howOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="bg-card rounded-2xl border border-border-light p-4 mt-1 space-y-2">
                  {[t('tokens.howWorkDesc1'), t('tokens.howWorkDesc2'), t('tokens.howWorkDesc3'), t('tokens.howWorkDesc4')].map((d, i) => (
                    <p key={i} className="text-[13px] text-muted-foreground">• {d}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buy More — with branded header */}
          <div ref={packsRef} className="flex items-center gap-3 mt-6 mb-3">
            <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center shrink-0 shadow-lg">
              <img src={speedaLogoWhite} alt="Speeda AI" className="w-6 h-6 object-contain" />
            </div>
            <h2 className="text-[18px] font-bold text-foreground">{t('tokens.needMore')}</h2>
          </div>
          <div className="space-y-3">
            {availablePacks.map((pack, i) => (
              <div key={pack.id} className="bg-card rounded-2xl border border-border-light p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[18px] font-bold text-foreground">{pack.amount.toLocaleString()} {t('common.tokens')}</span>
                      {pack.discount && <span className="text-[10px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">{t('tokens.off', { percent: pack.discount })}</span>}
                      {pack.badge === 'popular' && <span className="text-[10px] font-bold text-primary-foreground gradient-btn px-2 py-0.5 rounded-md">{t('tokens.popular')}</span>}
                      {pack.badge === 'bestValue' && <span className="text-[10px] font-bold text-primary-foreground bg-brand-blue px-2 py-0.5 rounded-md">{t('tokens.bestValue')}</span>}
                    </div>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{formatPrice(pack.price, i18n.language)} · {formatPerToken((pack.price / pack.amount).toFixed(2), i18n.language)}</p>
                  </div>
                  <button onClick={() => handlePurchase(i)} disabled={isPurchasePending || purchasingPackIdx !== null} className={`h-10 px-5 rounded-xl text-[13px] font-bold btn-press disabled:opacity-60 ${pack.badge === 'popular' ? 'gradient-btn text-primary-foreground shadow-btn' : 'border border-border text-foreground'}`}>
                    {purchasingPackIdx === i ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processing…
                      </span>
                    ) : t('tokens.buy')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Auto-Recharge */}
          <div className="mt-5 bg-card rounded-2xl border border-border-light p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 me-3">
                <p className="text-[14px] font-medium text-foreground">{t('tokens.autoRecharge')}</p>
                {autoRecharge && <p className="text-[11px] text-muted-foreground mt-0.5">{t('tokens.autoRechargeDesc')}</p>}
              </div>
              <button onClick={() => setAutoRecharge(!autoRecharge)} className={`w-11 h-6 rounded-full p-0.5 transition-colors ${autoRecharge ? 'bg-green-accent' : 'bg-border'}`}>
                <div className={`w-5 h-5 rounded-full bg-card shadow transition-transform ${autoRecharge ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
              </button>
            </div>
          </div>

          {/* This Month's Usage Summary */}
          <h2 className="text-[18px] font-bold text-foreground mt-6 mb-3">{t('tokens.thisMonthUsage')}</h2>
          <div className="bg-card rounded-2xl border border-border-light p-4 mb-5">
            <div className="space-y-3">
              {(liveByAgent
                ? Object.entries(liveByAgent).map(([agent, tokens]) => ({
                    agent: agent as AgentType,
                    tokens,
                    percent: usedTokens > 0 ? Math.round((tokens / usedTokens) * 100) : 0,
                  }))
                : agentSummary
              ).map(({ agent, tokens, percent }) => (
                <div key={agent}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-foreground">{t('tokens.agent', { name: agent })}</span>
                    <span className="text-[11px] text-muted-foreground">{tokens} {t('common.tokens')} ({percent}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: agentColors[agent as AgentType]?.bar ?? '#888' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-muted-foreground mt-3 pt-3 border-t border-border-light"
              dangerouslySetInnerHTML={{ __html: t('tokens.totalUsed', { used: usedTokens, total: totalTokens }) }}
            />
          </div>

          {/* Usage History */}
          <h2 className="text-[18px] font-bold text-foreground mb-3">{t('tokens.usageHistory')}</h2>
          <div className="bg-card rounded-2xl border border-border-light overflow-hidden">
            {(liveHistory?.length
              ? liveHistory.map(l => ({ desc: l.description, tokens: l.tokens, time: new Date(l.createdAt).toLocaleDateString(), agent: l.agent as AgentType }))
              : usageHistory
            ).map((item, i) => {
              const ac = agentColors[item.agent as AgentType] ?? agentColors.Content;
              return (
                <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-border-light' : ''}`}>
                  <div className="flex-1">
                    <p className="text-[13px] text-foreground">{item.desc}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[11px] text-muted-foreground">{item.time}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${ac.bg} ${ac.text}`}>{t('tokens.agent', { name: item.agent })}</span>
                    </div>
                  </div>
                  <span className="text-[13px] font-semibold text-purple">✦ {item.tokens}</span>
                </div>
              );
            })}
          </div>
          <button className="text-brand-blue text-[13px] font-semibold mt-3 mb-6">{t('tokens.viewFullHistory')}</button>
        </div>
      </motion.div>

      <AnimatePresence>
        {buyingPack !== null && (
          <PaymentFlow
            redirectTitle={`Purchasing ${availablePacks[buyingPack].amount.toLocaleString()} tokens…`}
            redirectSubtitle="You'll be redirected to our secure payment page"
            summaryLabel={`${availablePacks[buyingPack].amount.toLocaleString()} Tokens`}
            summaryValue={formatPrice(availablePacks[buyingPack].price, i18n.language)}
            successTitle="Tokens Added! ✦"
            successSubtitle={`${availablePacks[buyingPack].amount.toLocaleString()} tokens have been added to your account`}
            successDetail={`New balance: ${balance + availablePacks[buyingPack].amount} tokens`}
            successButton="Continue"
            variant="tokens"
            onComplete={() => setBuyingPack(null)}
            onCancel={() => setBuyingPack(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
