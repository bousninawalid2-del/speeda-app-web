import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, X, Loader2 } from 'lucide-react';

export interface PlanData {
  id:           string;
  name:         string;
  monthlyPrice: number;
  yearlyPrice:  number;
  tokenCount:   number;
  features:     string[];
  locked:       string[];
  watermark:    boolean;
  popular:      boolean;
}

interface SubscriptionScreenProps {
  onBack:           () => void;
  /** Live plans from DB. Falls back to embedded defaults when undefined. */
  plans?:           PlanData[];
  isLoading?:       boolean;
  /** Current active plan name (to show "current" badge) */
  currentPlanName?: string | null;
  /** Called when user taps upgrade — receives planId + billingType */
  onCheckout?:      (planId: string, billingType: 'monthly' | 'yearly') => Promise<void>;
}

const FALLBACK_PLANS: PlanData[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 549,
    yearlyPrice: 439,
    tokenCount: 200,
    popular: false,
    watermark: true,
    features: [
      '200 tokens/month', '3 platforms', 'AI Content Generation',
      'Calendar & Scheduling', 'Post Editing', 'Media Library (50 files)',
      'Basic Analytics (KPIs only)', 'Engagement (read-only)',
      'MOS Score (read-only)', 'WhatsApp 10 msg/day',
    ],
    locked: [
      'Variations A/B', 'Translation', 'Auto-Schedule', 'DM Management',
      'Complete Analytics', 'Link Tracking', 'Hashtag Intelligence',
      'Image Resize', 'Campaigns & Ads', 'PDF Export', 'Competitor Intelligence',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 1199,
    yearlyPrice: 959,
    tokenCount: 800,
    popular: true,
    watermark: false,
    features: [
      '800 tokens/month', 'All 10 platforms', 'Everything in Starter',
      'Variations A/B', 'Post Translation', 'Auto-Schedule',
      'DM Management & AI Responses', 'Complete Analytics', 'Link Tracking',
      'Hashtag Intelligence', 'Image Auto-Resize', 'Campaigns & Ads',
      'PDF Export', 'RSS Feed Auto-Posting', 'Unlimited Media Library',
      'Complete MOS Score', 'WhatsApp unlimited', 'Watermark removed',
    ],
    locked: ['Competitor Intelligence'],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 2499,
    yearlyPrice: 1999,
    tokenCount: 3000,
    popular: false,
    watermark: false,
    features: [
      '3,000 tokens/month', 'All 10 platforms', 'Everything in Pro',
      'Competitor Intelligence', 'Weekly auto PDF reports', 'Priority support',
      'Onboarding call', 'Multi-location', 'API access',
    ],
    locked: [],
  },
];

const fmt = (n: number) => n.toLocaleString();

export const SubscriptionScreen = ({
  onBack,
  plans: livePlans,
  isLoading,
  currentPlanName,
  onCheckout,
}: SubscriptionScreenProps) => {
  const plans = livePlans ?? FALLBACK_PLANS;
  const defaultSelected = plans.find(p => p.popular)?.id ?? plans[0]?.id ?? '';
  const [selected, setSelected] = useState(currentPlanName
    ? (plans.find(p => p.name === currentPlanName)?.id ?? defaultSelected)
    : defaultSelected);
  const [annual, setAnnual] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const selectedPlan = plans.find(p => p.id === selected);
  const getPrice = (plan: PlanData) => annual ? plan.yearlyPrice : plan.monthlyPrice;

  const handleCheckout = async () => {
    if (!selectedPlan || !onCheckout) return;
    setPurchasing(true);
    try {
      await onCheckout(selectedPlan.id, annual ? 'yearly' : 'monthly');
    } finally {
      setPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 size={32} className="text-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground">Choose Your Plan</h1>
        </div>

        {/* Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className={`text-[13px] font-semibold ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
          <button onClick={() => setAnnual(!annual)} className={`w-12 h-7 rounded-full p-0.5 transition-colors ${annual ? 'bg-green-accent' : 'bg-border'}`}>
            <div className={`w-6 h-6 rounded-full bg-card shadow transition-transform ${annual ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
          </button>
          <span className={`text-[13px] font-semibold ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>Annual</span>
          {annual && <span className="text-[10px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">Save 20%</span>}
        </div>

        <div className="space-y-3">
          {plans.map(plan => {
            const isCurrent = plan.name === currentPlanName;
            return (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                  selected === plan.id
                    ? plan.popular ? 'border-brand-blue bg-purple-soft shadow-card' : 'border-brand-blue bg-purple-soft'
                    : 'border-border-light bg-card'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-bold text-foreground">{plan.name}</h3>
                      {plan.popular && <span className="text-[10px] font-bold text-primary-foreground gradient-btn px-2 py-0.5 rounded-md">Most Popular</span>}
                      {isCurrent && <span className="text-[10px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">Current</span>}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {plan.tokenCount.toLocaleString()} tokens/mo
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[20px] font-extrabold text-foreground">{fmt(getPrice(plan))}</p>
                    <p className="text-[10px] text-muted-foreground">﷼/{annual ? 'mo (billed yearly)' : 'month'}</p>
                  </div>
                </div>

                {selected === plan.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 pt-3 border-t border-border-light overflow-hidden">
                    <div className="space-y-1.5">
                      {plan.features.slice(0, 6).map((f, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <Check size={12} className="text-green-accent flex-shrink-0" />
                          <span className="text-[12px] text-foreground">{f}</span>
                        </div>
                      ))}
                      {plan.locked.length > 0 && plan.locked.slice(0, 2).map((f, j) => (
                        <div key={`l-${j}`} className="flex items-center gap-2 opacity-50">
                          <X size={12} className="text-muted-foreground flex-shrink-0" />
                          <span className="text-[12px] text-muted-foreground line-through">{f}</span>
                        </div>
                      ))}
                    </div>
                    {plan.features.length > 6 && (
                      <p className="text-[11px] text-brand-blue font-semibold mt-2">+{plan.features.length - 6} more features</p>
                    )}
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {selectedPlan?.watermark && (
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            ⓘ Starter includes "Powered by Speeda AI ✦" watermark on published posts
          </p>
        )}

        <button
          onClick={handleCheckout}
          disabled={purchasing || !onCheckout || (selectedPlan?.name === currentPlanName)}
          className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-6 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {purchasing && <Loader2 size={16} className="animate-spin" />}
          {selectedPlan?.name === currentPlanName
            ? `${selectedPlan?.name ?? ''} — Current Plan`
            : `Upgrade to ${selectedPlan?.name ?? ''} — ${selectedPlan ? fmt(getPrice(selectedPlan)) : ''} ﷼/${annual ? 'mo' : 'month'}`}
        </button>

        <p className="text-[11px] text-muted-foreground text-center mt-3">
          You'll be redirected to our secure payment page powered by MamoPay
        </p>
      </div>
    </motion.div>
  );
};
