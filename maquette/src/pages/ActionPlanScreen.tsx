import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ActionPlanScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const actions = [
  {
    priority: 'Critical',
    priorityColor: 'bg-red-accent',
    borderColor: 'border-l-red-accent',
    title: 'Post Shawarma Reel during peak hour',
    desc: "Your audience is most active at 8 PM tonight. I've prepared a Reel featuring your Chicken Shawarma. Publishing now could reach 4,200+ people.",
    impact: '📈 Est. +4,200 reach · +120 engagements',
    cta: 'Open Content Studio →',
    nav: 'create',
  },
  {
    priority: 'Critical',
    priorityColor: 'bg-red-accent',
    borderColor: 'border-l-red-accent',
    title: 'Respond to negative review from Sara M.',
    desc: 'A 1-star Google review was posted 2 hours ago. Quick response can recover the customer and protect your rating.',
    impact: '⭐ Protect your 4.6 rating · Customer recovery',
    cta: 'Open Engagement →',
    nav: 'chat',
  },
  {
    priority: 'High',
    priorityColor: 'bg-orange-accent',
    borderColor: 'border-l-orange-accent',
    title: 'Boost your Weekend Brunch post',
    desc: 'This post has 3x your average engagement. Boosting it for SAR 150 could reach 50K people.',
    impact: '📈 Est. 50K reach · ~65 conversions',
    cta: 'Boost Now →',
    nav: 'campaigns',
  },
  {
    priority: 'High',
    priorityColor: 'bg-orange-accent',
    borderColor: 'border-l-orange-accent',
    title: 'Schedule 3 posts for the weekend',
    desc: "I've generated 3 posts for Friday-Saturday. They're in your approval queue.",
    impact: '📈 Maintain posting consistency · +15% weekly reach',
    cta: 'Review Posts →',
    nav: 'create',
  },
  {
    priority: 'Recommended',
    priorityColor: 'bg-brand-blue',
    borderColor: 'border-l-brand-blue',
    title: 'Increase Instagram ad budget by 20%',
    desc: 'Your Instagram campaign has 2.8x ROAS. Increasing budget from 30 to 36 SAR/day could generate ~12 more conversions/week.',
    impact: '💰 Est. +12 conversions/week · +840 SAR revenue',
    cta: 'Adjust Budget →',
    nav: 'campaigns',
  },
  {
    priority: 'Recommended',
    priorityColor: 'bg-brand-blue',
    borderColor: 'border-l-brand-blue',
    title: 'Reply to 4 pending comments',
    desc: "4 Instagram comments are waiting. I've drafted AI responses for all of them.",
    impact: '💬 Faster replies = +22% follower trust',
    cta: 'View Comments →',
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
          <h1 className="text-[20px] font-extrabold text-foreground">{t('actionPlan.title', "Today's Action Plan")}</h1>
        </div>
        <p className="text-[13px] text-muted-foreground ms-9 mb-4">{t('actionPlan.date', 'March 19, 2026')}</p>

        {/* AI Summary */}
        <div className="bg-card rounded-2xl p-4 border border-border-light border-s-[3px] border-s-brand-blue mb-4">
          <span className="text-[11px] uppercase font-bold text-brand-blue tracking-[0.05em]">✦ {t('actionPlan.aiAnalysis', 'AI Analysis')}</span>
          <p className="text-[14px] text-foreground leading-[1.55] mt-2">{t('actionPlan.summary', 'Your engagement is up 23% this week. Based on your data, here are the 6 actions I recommend for today, ranked by expected impact.')}</p>
        </div>

        {/* Action Items */}
        <div className="space-y-3">
          {actions.map((a, i) => {
            const isDone = doneActions.includes(i);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card rounded-2xl p-[18px] border border-border-light border-s-4 ${a.borderColor} ${isDone ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.05em] text-primary-foreground px-2.5 py-0.5 rounded-lg ${a.priorityColor}`}>{a.priority}</span>
                  {isDone && <span className="text-[10px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">✅ Done</span>}
                  {!isDone && <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">⏳ Pending</span>}
                </div>
                <h3 className="text-[16px] font-bold text-foreground">{a.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-[1.5] mt-1">{a.desc}</p>
                <p className="text-[13px] font-semibold text-green-accent mt-2">{a.impact}</p>
                {!isDone && (
                  <button
                    onClick={() => handleAction(i, a.nav)}
                    className="mt-3 h-10 px-5 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press"
                  >
                    {a.cta}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Summary */}
        <div className="bg-green-soft rounded-2xl p-4 mt-4">
          <p className="text-[14px] font-bold text-green-accent">{t('actionPlan.bottomSummary', 'Completing all 6 actions today could result in: +54K reach · +65 conversions · improved rating')}</p>
        </div>
      </div>
    </motion.div>
  );
};
