import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AIActivityScreenProps {
  onBack: () => void;
}

type Category = 'All' | 'Content' | 'Campaigns' | 'Engagement' | 'Optimization';

const activityData = {
  today: [
    { slug: 'publishedReel', cat: 'Content', timeKey: 't1030am' },
    { slug: 'autoReplyAhmed', cat: 'Engagement', timeKey: 't1015am' },
    { slug: 'optimizedRamadan', cat: 'Optimization', timeKey: 't945am' },
    { slug: 'generated3Posts', cat: 'Content', timeKey: 't900am' },
    { slug: 'morningBriefing', cat: 'System', timeKey: 't830am' },
  ],
  yesterday: [
    { slug: 'pausedFacebook', cat: 'Optimization', timeKey: 't815pm' },
    { slug: 'scheduled2Posts', cat: 'Content', timeKey: 't600pm' },
    { slug: 'autoReply5', cat: 'Engagement', timeKey: 't330pm' },
    { slug: 'newMenuReach', cat: 'Campaigns', timeKey: 't1200pm' },
    { slug: 'boostedBrunch', cat: 'Optimization', timeKey: 't1000am' },
  ],
  earlier: [
    { slug: 'weeklyReport', cat: 'System', timeKey: 'monday' },
    { slug: 'competitorAlert', cat: 'Intelligence', timeKey: 'monday' },
    { slug: 'eidDraft', cat: 'Campaigns', timeKey: 'sunday' },
  ],
};

type ActivityItem = { slug: string; cat: string; timeKey: string };

const catColors: Record<string, string> = {
  Content: 'bg-purple-soft text-purple',
  Campaigns: 'bg-green-soft text-brand-teal',
  Engagement: 'bg-green-soft text-green-accent',
  Optimization: 'bg-orange-soft text-orange-accent',
  System: 'bg-muted text-muted-foreground',
  Intelligence: 'bg-red-soft text-red-accent',
};

export const AIActivityScreen = ({ onBack }: AIActivityScreenProps) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Category>('All');
  const filters: Category[] = ['All', 'Content', 'Campaigns', 'Engagement', 'Optimization'];

  const filterItems = (items: ActivityItem[]) =>
    filter === 'All' ? items : items.filter(item => item.cat === filter);

  const Section = ({ title, items }: { title: string; items: ActivityItem[] }) => {
    const filtered = filterItems(items);
    if (filtered.length === 0) return null;
    return (
      <div className="mb-5">
        <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{title}</h3>
        <div className="bg-card rounded-2xl border border-border-light overflow-hidden">
          {filtered.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border-light' : ''}`}>
              <span className="text-brand-blue text-[12px] mt-0.5 flex-shrink-0">✦</span>
              <div className="flex-1">
                <p className="text-[14px] text-foreground leading-[1.4]">{t(`activity.items.${item.slug}`)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${catColors[item.cat] || 'bg-muted text-muted-foreground'}`}>{t(`activity.cat.${item.cat}`)}</span>
                  <span className="text-[11px] text-muted-foreground">{t(`activity.times.${item.timeKey}`)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
            <h1 className="text-[20px] font-bold text-foreground">{t('activity.title')}</h1>
          </div>
          <Filter size={18} className="text-muted-foreground" />
        </div>

        {/* Summary */}
        <div className="bg-purple-soft rounded-2xl p-4 mb-4">
          <p className="text-[13px] text-purple font-medium">{t('activity.summary')}</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-3xl text-[13px] font-semibold whitespace-nowrap btn-press ${filter === f ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
              {t(`activity.${f.toLowerCase()}`)}
            </button>
          ))}
        </div>

        <Section title={t('activity.today')} items={activityData.today} />
        <Section title={t('activity.yesterday')} items={activityData.yesterday} />
        <Section title={t('activity.earlierThisWeek')} items={activityData.earlier} />
      </div>
    </motion.div>
  );
};
