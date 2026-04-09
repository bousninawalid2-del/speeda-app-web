import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, X, MessageSquare } from 'lucide-react';
import { PaymentFlow } from '../components/PaymentFlow';
import { SalesChatWidget } from '../components/SalesAgent';

interface PlanComparisonScreenProps {
  onBack: () => void;
}

const plans = [
  {
    name: 'Starter',
    monthlyPrice: 549,
    current: false,
    features: [
      { name: '200 tokens/month', included: true },
      { name: '3 platforms', included: true },
      { name: 'AI Content Generation', included: true },
      { name: 'Calendar & Scheduling', included: true },
      { name: 'Post Editing', included: true },
      { name: 'Media Library (50 files)', included: true },
      { name: 'Basic Analytics', included: true },
      { name: 'Engagement (read-only)', included: true },
      { name: 'MOS Score (read-only)', included: true },
      { name: 'Variations A/B', included: false },
      { name: 'Translation', included: false },
      { name: 'Auto-Schedule', included: false },
      { name: 'Competitor Intelligence', included: false },
    ],
    watermark: true,
  },
  {
    name: 'Pro',
    monthlyPrice: 1199,
    current: true,
    badge: '⭐ Current Plan',
    popular: true,
    features: [
      { name: '800 tokens/month', included: true },
      { name: 'All 10 platforms', included: true },
      { name: 'Everything in Starter', included: true },
      { name: 'Variations A/B', included: true },
      { name: 'Post Translation', included: true },
      { name: 'Auto-Schedule', included: true },
      { name: 'DM Management', included: true },
      { name: 'Complete Analytics', included: true },
      { name: 'Link Tracking', included: true },
      { name: 'Hashtag Intelligence', included: true },
      { name: 'Image Auto-Resize', included: true },
      { name: 'Campaigns & Ads', included: true },
      { name: 'PDF Export', included: true },
      { name: 'Watermark removed', included: true },
      { name: 'Competitor Intelligence', included: false },
    ],
    watermark: false,
  },
  {
    name: 'Business',
    monthlyPrice: 2499,
    current: false,
    features: [
      { name: '3,000 tokens/month', included: true },
      { name: 'All 10 platforms', included: true },
      { name: 'Everything in Pro', included: true },
      { name: 'Competitor Intelligence', included: true },
      { name: 'Weekly auto PDF reports', included: true },
      { name: 'Priority support', included: true },
      { name: 'Onboarding call', included: true },
      { name: 'Multi-location', included: true },
      { name: 'API access', included: true },
    ],
    watermark: false,
  },
];

const formatPrice = (price: number) => price.toLocaleString();

export const PlanComparisonScreen = ({ onBack }: PlanComparisonScreenProps) => {
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [annual, setAnnual] = useState(false);
  const [showSalesChat, setShowSalesChat] = useState(false);

  const getPrice = (plan: typeof plans[0]) => {
    const price = annual ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice;
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
            {plans.map((plan, i) => (
              <div key={i} className={`bg-card rounded-2xl p-5 border-2 ${plan.current ? 'border-brand-blue' : 'border-border-light'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[18px] font-bold text-foreground">{plan.name}</h3>
                  {plan.badge && <span className="text-[10px] font-bold text-primary-foreground gradient-btn px-2 py-0.5 rounded-md">{plan.badge}</span>}
                  {plan.popular && <span className="text-[10px] font-bold text-brand-blue bg-purple-soft px-2 py-0.5 rounded-md">Most Popular</span>}
                </div>
                <p className="text-[24px] font-extrabold text-foreground mt-2">{getPrice(plan)} ﷼<span className="text-[14px] font-medium text-muted-foreground">/{annual ? 'mo' : 'mo'}</span></p>
                {annual && <p className="text-[11px] text-green-accent font-medium">Billed yearly · Save {formatPrice(Math.round(plan.monthlyPrice * 12 * 0.2))} ﷼/year</p>}
                {plan.watermark && <p className="text-[10px] text-muted-foreground mt-1">Includes "Powered by Speeda AI ✦" watermark</p>}
                <div className="mt-3 space-y-2">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2">
                      {f.included ? (
                        <Check size={14} className="text-green-accent flex-shrink-0" />
                      ) : (
                        <X size={14} className="text-muted-foreground/40 flex-shrink-0" />
                      )}
                      <span className={`text-[13px] ${f.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{f.name}</span>
                    </div>
                  ))}
                </div>
                {plan.current ? (
                  <div className="mt-4 h-[44px] rounded-2xl bg-muted flex items-center justify-center text-[13px] font-bold text-muted-foreground">Current Plan</div>
                ) : i > plans.findIndex(p => p.current) ? (
                  <button onClick={() => setSelectedPlan(plan)} className="w-full mt-4 h-[44px] rounded-2xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">Upgrade</button>
                ) : (
                  <button className="w-full mt-4 text-muted-foreground text-[13px] font-medium">Downgrade</button>
                )}
              </div>
            ))}
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
            summaryDetails={selectedPlan.features.filter(f => f.included).map(f => f.name).slice(0, 6)}
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
