import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ActionPlanScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

type Priority = 'critical' | 'high' | 'recommended';

interface ActionDef {
  key: string;
  priority: Priority;
  priorityColor: string;
  borderColor: string;
  nav: string;
}

const actions: ActionDef[] = [
  {
    key: 'shawarmaReel',
    priority: 'critical',
    priorityColor: 'bg-red-accent',
    borderColor: 'border-s-red-accent',
    nav: 'create',
  },
  {
    key: 'negativeReview',
    priority: 'critical',
    priorityColor: 'bg-red-accent',
    borderColor: 'border-s-red-accent',
    nav: 'chat',
  },
  {
    key: 'boostBrunch',
    priority: 'high',
    priorityColor: 'bg-orange-accent',
    borderColor: 'border-s-orange-accent',
    nav: 'campaigns',
  },
  {
    key: 'scheduleWeekend',
    priority: 'high',
    priorityColor: 'bg-orange-accent',
    borderColor: 'border-s-orange-accent',
    nav: 'create',
  },
  {
    key: 'increaseBudget',
    priority: 'recommended',
    priorityColor: 'bg-brand-blue',
    borderColor: 'border-s-brand-blue',
    nav: 'campaigns',
  },
  {
    key: 'replyComments',
    priority: 'recommended',
    priorityColor: 'bg-brand-blue',
    borderColor: 'border-s-brand-blue',
    nav: 'chat',
  },
];

export const ActionPlanScreen = ({ onBack, onNavigate }: ActionPlanScreenProps) => {
  const { t } = useTranslation();
  const [doneActions, setDoneActions] = useState<number[]>([]);

  const handleAction = (idx: number, nav: string) => {
    setDoneActions(prev => [...prev, idx]);
    onNavigate(nav);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-extrabold text-foreground">{t('actionPlan.title')}</h1>
        </div>
        <p className="text-[13px] text-muted-foreground ms-9 mb-4">{t('actionPlan.date')}</p>

        {/* AI Summary */}
        <div className="bg-card rounded-2xl p-4 border border-border-light border-s-[3px] border-s-brand-blue mb-4">
          <span className="text-[11px] uppercase font-bold text-brand-blue tracking-[0.05em]">✦ {t('actionPlan.aiAnalysis')}</span>
          <p className="text-[14px] text-foreground leading-[1.55] mt-2">{t('actionPlan.summary')}</p>
        </div>

        {/* Action Items */}
        <div className="space-y-3">
          {actions.map((a, i) => {
            const isDone = doneActions.includes(i);
            return (
              <motion.div
                key={a.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card rounded-2xl p-[18px] border border-border-light border-s-4 ${a.borderColor} ${isDone ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.05em] text-primary-foreground px-2.5 py-0.5 rounded-lg ${a.priorityColor}`}>
                    {t(`actionPlan.priority.${a.priority}`)}
                  </span>
                  {isDone && <span className="text-[10px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">{t('actionPlan.status.done')}</span>}
                  {!isDone && <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{t('actionPlan.status.pending')}</span>}
                </div>
                <h3 className="text-[16px] font-bold text-foreground">{t(`actionPlan.items.${a.key}.title`)}</h3>
                <p className="text-[13px] text-muted-foreground leading-[1.5] mt-1">{t(`actionPlan.items.${a.key}.desc`)}</p>
                <p className="text-[13px] font-semibold text-green-accent mt-2">{t(`actionPlan.items.${a.key}.impact`)}</p>
                {!isDone && (
                  <button
                    onClick={() => handleAction(i, a.nav)}
                    className="mt-3 h-10 px-5 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press"
                  >
                    {t(`actionPlan.items.${a.key}.cta`)}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Summary */}
        <div className="bg-green-soft rounded-2xl p-4 mt-4">
          <p className="text-[14px] font-bold text-green-accent">{t('actionPlan.bottomSummary')}</p>
        </div>
      </div>
    </motion.div>
  );
};
