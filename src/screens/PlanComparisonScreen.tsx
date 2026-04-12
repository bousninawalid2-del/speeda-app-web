import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, X, MessageSquare } from 'lucide-react';
import { PaymentFlow } from '../components/PaymentFlow';
import { SalesChatWidget } from '../components/SalesAgent';

export interface PlanData {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  tokenCount: number;
  platformLimit: number;
  features: string[];
  locked: string[];
  watermark: boolean;
  popular: boolean;
  sortOrder: number;
}

interface PlanComparisonScreenProps {
  onBack: () => void;
  plans?: PlanData[];
  isLoadingPlans?: boolean;
  currentPlanName?: string;
  onUpgrade?: (planId: string, billingType: 'monthly' | 'yearly') => void;
}

const STATIC_PLANS = [
  {
    id: 'static-starter',
    name: 'Starter',
    monthlyPrice: 549,
    yearlyPrice: 439,
    tokenCount: 200,
    platformLimit: 3,
    features: ['AI Content Generation', 'Calendar & Scheduling', 'Post Editing', 'Media Library (50 files)', 'Basic Analytics', 'Engagement (read-only)', 'MOS Score (read-only)'],
    locked: ['Variations A/B', 'Translation', 'Auto-Schedule', 'Competitor Intelligence'],
    watermark: true,
    popular: false,
    sortOrder: 1,
  },
  {
    id: 'static-pro',
    name: 'Pro',
    monthlyPrice: 1199,
    yearlyPrice: 959,
    tokenCount: 800,
    platformLimit: 10,
    features: ['Everything in Starter', 'Variations A/B', 'Post Translation', 'Auto-Schedule', 'DM Management', 'Complete Analytics', 'Link Tracking', 'Hashtag Intelligence', 'Campaigns & Ads', 'PDF Export', 'Watermark removed'],
    locked: ['Competitor Intelligence'],
    watermark: false,
    popular: true,
    sortOrder: 2,
  },
  {
    id: 'static-business',
    name: 'Business',
    monthlyPrice: 2499,
    yearlyPrice: 1999,
    tokenCount: 3000,
    platformLimit: 20,
    features: ['Everything in Pro', 'Competitor Intelligence', 'Weekly auto PDF reports', 'Priority support', 'Onboarding call', 'Multi-location', 'API access'],
    locked: [],
    watermark: false,
    popular: false,
    sortOrder: 3,
  },
];

const formatPrice = (price: number) => price.toLocaleString();

export const PlanComparisonScreen = ({ onBack, plans: apiPlans, isLoadingPlans, currentPlanName, onUpgrade }: PlanComparisonScreenProps) => {
  const displayPlans = apiPlans && apiPlans.length > 0 ? apiPlans : STATIC_PLANS;
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [annual, setAnnual] = useState(false);
  const [showSalesChat, setShowSalesChat] = useState(false);

  const getPrice = (plan: PlanData) => {
    const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
    return formatPrice(price);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
        <div className="px-5 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
            <h1 className="text-[20px] font-bold text-foreground">Compare Plans</h1>
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

          <div className="space-y-4">
            {displayPlans.map((plan, i) => {
              const isCurrent = currentPlanName ? plan.name === currentPlanName : plan.name === 'Pro';
              const currentIdx = displayPlans.findIndex(p => currentPlanName ? p.name === currentPlanName : p.name === 'Pro');
              const allFeatures = [
                `${plan.tokenCount.toLocaleString()} tokens/month`,
                `${plan.platformLimit} platforms`,
                ...plan.features,
              ];
              return (
                <div key={plan.id} className={`bg-card rounded-2xl p-5 border-2 ${isCurrent ? 'border-brand-blue' : 'border-border-light'}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[18px] font-bold text-foreground">{plan.name}</h3>
                    {isCurrent && <span className="text-[10px] font-bold text-primary-foreground gradient-btn px-2 py-0.5 rounded-md">{'\u2B50'} Current Plan</span>}
                    {plan.popular && <span className="text-[10px] font-bold text-brand-blue bg-purple-soft px-2 py-0.5 rounded-md">Most Popular</span>}
                  </div>
                  <p className="text-[24px] font-extrabold text-foreground mt-2">{getPrice(plan)} {'\uFDFC'}<span className="text-[14px] font-medium text-muted-foreground">/mo</span></p>
                  {annual && <p className="text-[11px] text-green-accent font-medium">Billed yearly {'\u00B7'} Save {formatPrice(Math.round((plan.monthlyPrice - plan.yearlyPrice) * 12))} {'\uFDFC'}/year</p>}
                  {plan.watermark && <p className="text-[10px] text-muted-foreground mt-1">Includes &quot;Powered by Speeda AI {'\u2726'}&quot; watermark</p>}
                  <div className="mt-3 space-y-2">
                    {allFeatures.map((f, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Check size={14} className="text-green-accent flex-shrink-0" />
                        <span className="text-[13px] text-foreground">{f}</span>
                      </div>
                    ))}
                    {plan.locked.map((f, j) => (
                      <div key={`locked-${j}`} className="flex items-center gap-2">
                        <X size={14} className="text-muted-foreground/40 flex-shrink-0" />
                        <span className="text-[13px] text-muted-foreground line-through">{f}</span>
                      </div>
                    ))}
                  </div>
                  {isCurrent ? (
                    <div className="mt-4 h-[44px] rounded-2xl bg-muted flex items-center justify-center text-[13px] font-bold text-muted-foreground">Current Plan</div>
                  ) : i > currentIdx ? (
                    <button onClick={() => setSelectedPlan(plan)} className="w-full mt-4 h-[44px] rounded-2xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">Upgrade</button>
                  ) : (
                    <button className="w-full mt-4 text-muted-foreground text-[13px] font-medium">Downgrade</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chat with Speeda */}
          <div className="text-center mt-5 mb-4">
            <button onClick={() => setShowSalesChat(true)} className="text-[13px] font-bold text-brand-blue flex items-center gap-1.5 mx-auto">
              <MessageSquare size={14} /> ✦ Need help choosing? Chat with Speeda
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSalesChat && (
          <SalesChatWidget onNavigate={() => {}} onClose={() => setShowSalesChat(false)} contextFeature="pricing" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPlan && (
          <PaymentFlow
            redirectTitle="Completing your upgrade…"
            redirectSubtitle="You'll be redirected to our secure payment page"
            summaryLabel={`${selectedPlan.name} Plan${annual ? ' (Annual)' : ''}`}
            summaryValue={`${getPrice(selectedPlan)} ﷼/month`}
            summaryDetails={selectedPlan.features.slice(0, 6)}
            successTitle={`Welcome to ${selectedPlan.name}! ✦`}
            successSubtitle="Your plan has been upgraded successfully"
            successBadge={`${selectedPlan.name} Pack`}
            successButton="Start Creating →"
            variant="plan"
            onComplete={() => { setSelectedPlan(null); onBack(); }}
            onCancel={() => setSelectedPlan(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
