import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, X, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PaymentFlow } from '../components/PaymentFlow';
import { SalesChatWidget } from '../components/SalesAgent';
import { usePlanComparisonPlans, type PlanComparisonPlan } from '@/hooks/usePlanComparisonPlans';
import { useCreateSubscription } from '@/hooks/useSubscription';

interface PlanComparisonScreenProps {
  onBack: () => void;
}

interface PlanCardFeature {
  name: string;
  included: boolean;
}

interface PlanCard {
  name: string;
  monthlyPrice: number;
  current: boolean;
  badge?: string;
  popular?: boolean;
  features: PlanCardFeature[];
  watermark: boolean;
  planId?: string;
}

const formatPrice = (price: number) => price.toLocaleString();

const mapDynamicPlansToCards = (plans: PlanComparisonPlan[]): PlanCard[] => {
  return plans.map((plan) => ({
    name: plan.name,
    monthlyPrice: plan.monthlyPrice,
    current: false,
    popular: plan.popular,
    features: [
      ...plan.features.map((name) => ({ name, included: true })),
      ...plan.locked.map((name) => ({ name, included: false })),
    ],
    watermark: plan.watermark,
    planId: plan.id,
  }));
};

export const PlanComparisonScreen = ({ onBack }: PlanComparisonScreenProps) => {
  const { t } = useTranslation();
  const { data: dynamicPlans, isLoading, isError } = usePlanComparisonPlans();
  const { mutateAsync: createSubscription } = useCreateSubscription();

  const plans: PlanCard[] = dynamicPlans?.length ? mapDynamicPlansToCards(dynamicPlans) : [];

  const [selectedPlan, setSelectedPlan] = useState<PlanCard | null>(null);
  const [annual, setAnnual] = useState(false);
  const [showSalesChat, setShowSalesChat] = useState(false);

  const getPrice = (plan: PlanCard) => {
    const price = annual ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice;
    return formatPrice(price);
  };

  const currentPlanIndex = plans.findIndex(p => p.current);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 size={32} className="text-brand-blue animate-spin" />
      </div>
    );
  }

  if (isError || !plans.length) {
    return (
      <div className="bg-background min-h-screen">
        <div className="px-5 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
            <h1 className="text-[20px] font-bold text-foreground">{t('planComparison.title')}</h1>
          </div>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] font-semibold text-foreground mb-1">{t('planComparison.loadFailed')}</p>
            <p className="text-[13px] text-muted-foreground">{t('planComparison.tryAgain')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
        <div className="px-5 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
            <h1 className="text-[20px] font-bold text-foreground">{t('planComparison.title')}</h1>
          </div>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className={`text-[13px] font-semibold ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>{t('planComparison.monthly')}</span>
            <button onClick={() => setAnnual(!annual)} className={`w-12 h-7 rounded-full p-0.5 transition-colors ${annual ? 'bg-green-accent' : 'bg-border'}`}>
              <div className={`w-6 h-6 rounded-full bg-card shadow transition-transform ${annual ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
            </button>
            <span className={`text-[13px] font-semibold ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>{t('planComparison.annual')}</span>
            {annual && <span className="text-[10px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">{t('planComparison.save20')}</span>}
          </div>

          <div className="space-y-4">
            {plans.map((plan, i) => (
              <div key={i} className={`bg-card rounded-2xl p-5 border-2 ${plan.current ? 'border-brand-blue' : 'border-border-light'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[18px] font-bold text-foreground">{plan.name}</h3>
                  {plan.badge && <span className="text-[10px] font-bold text-primary-foreground gradient-btn px-2 py-0.5 rounded-md">{plan.badge}</span>}
                  {plan.popular && <span className="text-[10px] font-bold text-brand-blue bg-purple-soft px-2 py-0.5 rounded-md">{t('planComparison.mostPopular')}</span>}
                </div>
                <p className="text-[24px] font-extrabold text-foreground mt-2">{getPrice(plan)} ﷼<span className="text-[14px] font-medium text-muted-foreground">/{annual ? 'mo' : 'mo'}</span></p>
                {annual && <p className="text-[11px] text-green-accent font-medium">{t('planComparison.billedYearly', { amount: formatPrice(Math.round(plan.monthlyPrice * 12 * 0.2)) })}</p>}
                {plan.watermark && <p className="text-[10px] text-muted-foreground mt-1">{t('planComparison.watermarkNote')}</p>}
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
                  <div className="mt-4 h-[44px] rounded-2xl bg-muted flex items-center justify-center text-[13px] font-bold text-muted-foreground">{t('planComparison.currentPlan')}</div>
                ) : i > currentPlanIndex ? (
                  <button onClick={() => setSelectedPlan(plan)} className="w-full mt-4 h-[44px] rounded-2xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">{t('planComparison.upgrade')}</button>
                ) : (
                  <button className="w-full mt-4 text-muted-foreground text-[13px] font-medium">{t('planComparison.downgrade')}</button>
                )}
              </div>
            ))}
          </div>

          {/* Chat with Speeda */}
          <div className="text-center mt-5 mb-4">
            <button onClick={() => setShowSalesChat(true)} className="text-[13px] font-bold text-brand-blue flex items-center gap-1.5 mx-auto">
              <MessageSquare size={14} /> {t('planComparison.helpChoose')}
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
            redirectTitle={t('planComparison.redirectTitle')}
            redirectSubtitle={t('planComparison.redirectSubtitle')}
            summaryLabel={t('planComparison.planLabel', { name: selectedPlan.name, annual: annual ? t('planComparison.annualSuffix') : '' })}
            summaryValue={`${getPrice(selectedPlan)} ﷼/${t('subscription.perMonth')}`}
            summaryDetails={selectedPlan.features.filter(f => f.included).map(f => f.name).slice(0, 6)}
            successTitle={t('planComparison.welcomeTo', { name: selectedPlan.name })}
            successSubtitle={t('planComparison.successSubtitle')}
            successBadge={t('planComparison.successBadge', { name: selectedPlan.name })}
            successButton={t('planComparison.successButton')}
            variant="plan"
            onComplete={async () => {
              if (selectedPlan?.planId) {
                try {
                  const { checkoutUrl } = await createSubscription({
                    planId: selectedPlan.planId,
                    billingType: annual ? 'yearly' : 'monthly',
                  });
                  window.open(checkoutUrl, '_blank');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : t('subscription.toasts.checkoutFailed'));
                }
              }
              setSelectedPlan(null);
              onBack();
            }}
            onCancel={() => setSelectedPlan(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
