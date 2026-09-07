import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, X, Loader2 } from 'lucide-react';

// Feature names and plan names are stored in English as internal identifiers;
// these map each to its translation key so the same plan data can render in
// any language.
const featureLabelKeys: Record<string, string> = {
  '200 tokens/month': 'plans.features.tokens200',
  '3 platforms': 'plans.features.platforms3',
  'AI Content Generation': 'plans.features.aiContentGen',
  'Calendar & Scheduling': 'plans.features.calendarScheduling',
  'Post Editing': 'plans.features.postEditing',
  'Media Library (50 files)': 'plans.features.mediaLibrary50',
  'Basic Analytics': 'plans.features.basicAnalytics',
  'Basic Analytics (KPIs only)': 'plans.features.basicAnalyticsKpis',
  'Engagement (read-only)': 'plans.features.engagementReadOnly',
  'MOS Score (read-only)': 'plans.features.mosScoreReadOnly',
  'WhatsApp 10 msg/day': 'plans.features.whatsapp10',
  'Variations A/B': 'plans.features.variationsAB',
  Translation: 'plans.features.translation',
  'Auto-Schedule': 'plans.features.autoSchedule',
  'DM Management': 'plans.features.dmManagement',
  'Complete Analytics': 'plans.features.completeAnalytics',
  'Link Tracking': 'plans.features.linkTracking',
  'Hashtag Intelligence': 'plans.features.hashtagIntel',
  'Image Resize': 'plans.features.imageResize',
  'Campaigns & Ads': 'plans.features.campaignsAds',
  'PDF Export': 'plans.features.pdfExport',
  'Competitor Intelligence': 'plans.features.competitorIntel',
  '800 tokens/month': 'plans.features.tokens800',
  'All 10 platforms': 'plans.features.allPlatforms',
  'Everything in Starter': 'plans.features.everythingInStarter',
  'Post Translation': 'plans.features.postTranslation',
  'DM Management & AI Responses': 'plans.features.dmManagementAi',
  'Image Auto-Resize': 'plans.features.imageAutoResize',
  'Campaigns & Ads ': 'plans.features.campaignsAds',
  'RSS Feed Auto-Posting': 'plans.features.rssAutoPosting',
  'Unlimited Media Library': 'plans.features.unlimitedMedia',
  'Complete MOS Score': 'plans.features.completeMosScore',
  'WhatsApp unlimited': 'plans.features.whatsappUnlimited',
  'Watermark removed': 'plans.features.watermarkRemoved',
  '3,000 tokens/month': 'plans.features.tokens3000',
  'Everything in Pro': 'plans.features.everythingInPro',
  'Weekly auto PDF reports': 'plans.features.weeklyPdfReports',
  'Priority support': 'plans.features.prioritySupport',
  'Onboarding call': 'plans.features.onboardingCall',
  'Multi-location': 'plans.features.multiLocation',
  'API access': 'plans.features.apiAccess',
};

const planNameKeys: Record<string, string> = {
  Starter: 'plans.starterName',
  Pro: 'plans.proName',
  Business: 'plans.businessName',
};

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
  /** Active plan being sent to checkout */
  processingPlanId?: string | null;
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
  processingPlanId,
  onCheckout,
}: SubscriptionScreenProps) => {
  const { t } = useTranslation();
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
          <h1 className="text-[20px] font-bold text-foreground">{t('plans.chooseYourPlan')}</h1>
        </div>

        {/* Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className={`text-[13px] font-semibold ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>{t('plans.monthly')}</span>
          <button onClick={() => setAnnual(!annual)} className={`w-12 h-7 rounded-full p-0.5 transition-colors ${annual ? 'bg-green-accent' : 'bg-border'}`}>
            <div className={`w-6 h-6 rounded-full bg-card shadow transition-transform ${annual ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
          </button>
          <span className={`text-[13px] font-semibold ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>{t('plans.annual')}</span>
          {annual && <span className="text-[10px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">{t('plans.save20')}</span>}
        </div>

        <div className="space-y-3">
          {plans.map(plan => {
            const isCurrent = plan.name === currentPlanName;
            return (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                disabled={purchasing}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                  selected === plan.id
                    ? plan.popular ? 'border-brand-blue bg-purple-soft shadow-card' : 'border-brand-blue bg-purple-soft'
                    : 'border-border-light bg-card'
                } disabled:opacity-70`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-bold text-foreground">{t(planNameKeys[plan.name] ?? plan.name, plan.name)}</h3>
                      {processingPlanId === plan.id && <Loader2 size={14} className="text-brand-blue animate-spin" />}
                      {plan.popular && <span className="text-[10px] font-bold text-primary-foreground gradient-btn px-2 py-0.5 rounded-md">{t('plans.mostPopular')}</span>}
                      {isCurrent && <span className="text-[10px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">{t('plans.current')}</span>}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {t('plans.tokensPerMo', { count: plan.tokenCount.toLocaleString() })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[20px] font-extrabold text-foreground">{fmt(getPrice(plan))}</p>
                    <p className="text-[10px] text-muted-foreground">﷼/{annual ? t('plans.moBilledYearly') : t('plans.perMonthShort')}</p>
                  </div>
                </div>

                {selected === plan.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 pt-3 border-t border-border-light overflow-hidden">
                    <div className="space-y-1.5">
                      {plan.features.slice(0, 6).map((f, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <Check size={12} className="text-green-accent flex-shrink-0" />
                          <span className="text-[12px] text-foreground">{t(featureLabelKeys[f] ?? f, f)}</span>
                        </div>
                      ))}
                      {plan.locked.length > 0 && plan.locked.slice(0, 2).map((f, j) => (
                        <div key={`l-${j}`} className="flex items-center gap-2 opacity-50">
                          <X size={12} className="text-muted-foreground flex-shrink-0" />
                          <span className="text-[12px] text-muted-foreground line-through">{t(featureLabelKeys[f] ?? f, f)}</span>
                        </div>
                      ))}
                    </div>
                    {plan.features.length > 6 && (
                      <p className="text-[11px] text-brand-blue font-semibold mt-2">{t('plans.moreFeatures', { count: plan.features.length - 6 })}</p>
                    )}
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {selectedPlan?.watermark && (
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            {t('plans.watermarkStarterNote')}
          </p>
        )}

        <button
          onClick={handleCheckout}
          disabled={purchasing || !onCheckout || (selectedPlan?.name === currentPlanName)}
          className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-6 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {purchasing && <Loader2 size={16} className="animate-spin" />}
          {selectedPlan?.name === currentPlanName
            ? t('plans.currentPlanCta', { plan: t(planNameKeys[selectedPlan?.name ?? ''] ?? selectedPlan?.name ?? '', selectedPlan?.name ?? '') })
            : t('plans.upgradeToCta', {
                plan: t(planNameKeys[selectedPlan?.name ?? ''] ?? selectedPlan?.name ?? '', selectedPlan?.name ?? ''),
                price: selectedPlan ? fmt(getPrice(selectedPlan)) : '',
                period: annual ? 'mo' : t('plans.perMonthShort'),
              })}
        </button>

        <p className="text-[11px] text-muted-foreground text-center mt-3">
          {t('plans.securePaymentNote')}
        </p>
      </div>
    </motion.div>
  );
};
