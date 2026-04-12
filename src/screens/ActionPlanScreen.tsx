import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ActionTaskData {
  id: string;
  title: string;
  description: string | null;
  platform: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
}

interface ActionPlanScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  tasks?: ActionTaskData[];
  isLoading?: boolean;
  onMarkDone?: (id: string) => void;
}

const priorityConfig: Record<string, { label: string; bgColor: string; borderColor: string }> = {
  high:   { label: 'Critical',    bgColor: 'bg-red-accent',   borderColor: 'border-l-red-accent' },
  medium: { label: 'High',        bgColor: 'bg-orange-accent', borderColor: 'border-l-orange-accent' },
  low:    { label: 'Recommended', bgColor: 'bg-brand-blue',    borderColor: 'border-l-brand-blue' },
};

const FALLBACK_ACTIONS = [
  {
    id: 'demo-1',
    priority: 'high',
    title: 'Post Shawarma Reel during peak hour',
    description: "Your audience is most active at 8 PM tonight. I've prepared a Reel featuring your Chicken Shawarma. Publishing now could reach 4,200+ people.",
    platform: 'instagram',
    status: 'pending',
    dueDate: null,
  },
  {
    id: 'demo-2',
    priority: 'high',
    title: 'Respond to negative review from Sara M.',
    description: 'A 1-star Google review was posted 2 hours ago. Quick response can recover the customer and protect your rating.',
    platform: null,
    status: 'pending',
    dueDate: null,
  },
  {
    id: 'demo-3',
    priority: 'medium',
    title: 'Boost your Weekend Brunch post',
    description: 'This post has 3x your average engagement. Boosting it for SAR 150 could reach 50K people.',
    platform: null,
    status: 'pending',
    dueDate: null,
  },
  {
    id: 'demo-4',
    priority: 'medium',
    title: 'Schedule 3 posts for the weekend',
    description: "I've generated 3 posts for Friday-Saturday. They're in your approval queue.",
    platform: null,
    status: 'pending',
    dueDate: null,
  },
  {
    id: 'demo-5',
    priority: 'low',
    title: 'Reply to 4 pending comments',
    description: "4 Instagram comments are waiting. I've drafted AI responses for all of them.",
    platform: 'instagram',
    status: 'pending',
    dueDate: null,
  },
];

export const ActionPlanScreen = ({ onBack, onNavigate, tasks, isLoading, onMarkDone }: ActionPlanScreenProps) => {
  const { t } = useTranslation();
  const [localDone, setLocalDone] = useState<string[]>([]);

  const displayTasks = tasks && tasks.length > 0 ? tasks : FALLBACK_ACTIONS;

  const handleDone = (task: ActionTaskData) => {
    if (onMarkDone) {
      onMarkDone(task.id);
    }
    setLocalDone(prev => [...prev, task.id]);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-extrabold text-foreground">{t('actionPlan.title', "Today's Action Plan")}</h1>
        </div>
        <p className="text-[13px] text-muted-foreground ms-9 mb-4">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        {/* AI Summary */}
        <div className="bg-card rounded-2xl p-4 border border-border-light border-s-[3px] border-s-brand-blue mb-4">
          <span className="text-[11px] uppercase font-bold text-brand-blue tracking-[0.05em]">{'\u2726'} {t('actionPlan.aiAnalysis', 'AI Analysis')}</span>
          <p className="text-[14px] text-foreground leading-[1.55] mt-2">
            {/* TODO: connect AI */}
            {t('actionPlan.summary', `You have ${displayTasks.filter(t => t.status !== 'completed' && !localDone.includes(t.id)).length} pending actions. Complete them to maximize your social media impact today.`)}
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && displayTasks.length === 0 && (
          <div className="bg-card rounded-2xl p-8 border border-border-light text-center">
            <CheckCircle2 size={40} className="text-green-accent mx-auto mb-3" />
            <h3 className="text-[16px] font-bold text-foreground mb-1">All caught up!</h3>
            <p className="text-[13px] text-muted-foreground">No pending actions right now. Check back later.</p>
          </div>
        )}

        {/* Action Items */}
        <div className="space-y-3">
          {displayTasks.map((task, i) => {
            const isDone = task.status === 'completed' || localDone.includes(task.id);
            const config = priorityConfig[task.priority] ?? priorityConfig.medium;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-card rounded-2xl p-[18px] border border-border-light border-s-4 ${config.borderColor} ${isDone ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.05em] text-primary-foreground px-2.5 py-0.5 rounded-lg ${config.bgColor}`}>{config.label}</span>
                  {isDone && <span className="text-[10px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">{'\u2705'} Done</span>}
                  {!isDone && <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{'\u23F3'} Pending</span>}
                  {task.platform && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md capitalize">{task.platform}</span>
                  )}
                </div>
                <h3 className="text-[16px] font-bold text-foreground">{task.title}</h3>
                {task.description && (
                  <p className="text-[13px] text-muted-foreground leading-[1.5] mt-1">{task.description}</p>
                )}
                {task.dueDate && (
                  <p className="text-[12px] text-muted-foreground mt-1">Due: {formatDate(task.dueDate)}</p>
                )}
                {!isDone && (
                  <button
                    onClick={() => handleDone(task)}
                    className="mt-3 h-10 px-5 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press"
                  >
                    Mark Done
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Summary */}
        <div className="bg-green-soft rounded-2xl p-4 mt-4">
          <p className="text-[14px] font-bold text-green-accent">
            {displayTasks.filter(t => t.status !== 'completed' && !localDone.includes(t.id)).length} actions remaining today
          </p>
        </div>
      </div>
    </motion.div>
  );
};
