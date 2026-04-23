import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { usePlans, type Plan } from '@/hooks/usePlans';
import { useCreateSubscription } from '@/hooks/useSubscription';

interface SubscriptionScreenProps {
  onBack:           () => void;
  currentPlanName?: string | null;
}

const fmt = (n: number) => n.toLocaleString();

export const SubscriptionScreen = ({
  onBack,
  currentPlanName,
}: SubscriptionScreenProps) => {
  const { t } = useTranslation();
  const { data: plans, isLoading } = usePlans();
  const { mutateAsync: createSubscription } = useCreateSubscription();

  const defaultSelected = plans?.find(p => p.popular)?.id ?? plans?.[0]?.id ?? '';
  const [selected, setSelected] = useState(defaultSelected);
  const [annual, setAnnual] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const selectedPlan = plans?.find(p => p.id === selected);
  const getPrice = (plan: Plan) => annual ? plan.yearlyPrice : plan.monthlyPrice;

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    setPurchasing(true);
    try {
      const { checkoutUrl } = await createSubscription({
        planId: selectedPlan.id,
        billingType: annual ? 'yearly' : 'monthly',
      });
      window.open(checkoutUrl, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('subscription.toasts.checkoutFailed'));
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

  if (!plans?.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-[15px] text-muted-foreground">{t('subscription.loadFailed')}</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-8">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground">{t('subscription.title')}</h1>
        </div>

        {/* Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className={`text-[13px] font-semibold ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>{t('subscription.monthly')}</span>
          <button onClick={() => setAnnual(!annual)} className={`w-12 h-7 rounded-full p-0.5 transition-colors ${annual ? 'bg-green-accent' : 'bg-border'}`}>
            <div className={`w-6 h-6 rounded-full bg-card shadow transition-transform ${annual ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
          </button>
          <span className={`text-[13px] font-semibold ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>{t('subscription.annual')}</span>
          {annual && <span className="text-[10px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">{t('subscription.save20')}</span>}
        </div>

        <div className="space-y-3">
          {plans.map(plan => {
            const isCurrent = plan.name === currentPlanName;
            return (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                disabled={purchasing}
                className={`w-full p-5 rounded-2xl border-2 text-start transition-all ${
                  selected === plan.id
                    ? plan.popular ? 'border-brand-blue bg-purple-soft shadow-card' : 'border-brand-blue bg-purple-soft'
                    : 'border-border-light bg-card'
                } disabled:opacity-70`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-bold text-foreground">{plan.name}</h3>
                      {plan.popular && <span className="text-[10px] font-bold text-primary-foreground gradient-btn px-2 py-0.5 rounded-md">{t('subscription.mostPopular')}</span>}
                      {isCurrent && <span className="text-[10px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">{t('subscription.current')}</span>}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {t('subscription.tokensPerMonth', { count: plan.tokenCount })}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-[20px] font-extrabold text-foreground">{fmt(getPrice(plan))}</p>
                    <p className="text-[10px] text-muted-foreground">﷼/{annual ? t('subscription.perMonthBilledYearly') : t('subscription.perMonth')}</p>
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
                      <p className="text-[11px] text-brand-blue font-semibold mt-2">{t('subscription.moreFeatures', { count: plan.features.length - 6 })}</p>
                    )}
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {selectedPlan?.watermark && (
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            {t('subscription.watermarkNote')}
          </p>
        )}

        <button
          onClick={handleCheckout}
          disabled={purchasing || (selectedPlan?.name === currentPlanName)}
          className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-6 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {purchasing && <Loader2 size={16} className="animate-spin" />}
          {selectedPlan?.name === currentPlanName
            ? t('subscription.currentPlan', { name: selectedPlan?.name ?? '' })
            : t('subscription.upgradeTo', {
                name: selectedPlan?.name ?? '',
                price: selectedPlan ? fmt(getPrice(selectedPlan)) : '',
                period: annual ? 'mo' : t('subscription.perMonth'),
              })}
        </button>

        <p className="text-[11px] text-muted-foreground text-center mt-3">
          {t('subscription.redirectNote')}
        </p>
      </div>
    </motion.div>
  );
};
