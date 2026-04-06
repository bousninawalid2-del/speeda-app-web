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
    { desc: 'Published Instagram Reel: Chicken Shawarma', cat: 'Content', time: '10:30 AM' },
    { desc: 'Auto-responded to comment from Ahmed K.', cat: 'Engagement', time: '10:15 AM' },
    { desc: 'Optimized Ramadan campaign: shifted 200 SAR to Instagram', cat: 'Optimization', time: '9:45 AM' },
    { desc: 'Generated 3 posts for approval queue', cat: 'Content', time: '9:00 AM' },
    { desc: 'Morning briefing prepared', cat: 'System', time: '8:30 AM' },
  ],
  yesterday: [
    { desc: 'Paused Facebook ad (ROAS dropped below 1.0)', cat: 'Optimization', time: '8:15 PM' },
    { desc: 'Scheduled 2 posts for Thursday peak hours', cat: 'Content', time: '6:00 PM' },
    { desc: 'Auto-responded to 5 Instagram comments', cat: 'Engagement', time: '3:30 PM' },
    { desc: 'New Menu TikTok ad reached 8.7K impressions', cat: 'Campaigns', time: '12:00 PM' },
    { desc: 'Boosted Weekend Brunch post (engagement >5%)', cat: 'Optimization', time: '10:00 AM' },
  ],
  earlier: [
    { desc: 'Weekly performance report generated', cat: 'System', time: 'Monday' },
    { desc: 'Competitor alert: Shawarmer launched weekend promo', cat: 'Intelligence', time: 'Monday' },
    { desc: 'Created Eid Al-Fitr campaign draft', cat: 'Campaigns', time: 'Sunday' },
  ],
};

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

  const filterItems = (items: typeof activityData.today) =>
    filter === 'All' ? items : items.filter(item => item.cat === filter);

  const Section = ({ title, items }: { title: string; items: typeof activityData.today }) => {
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
                <p className="text-[14px] text-foreground leading-[1.4]">{item.desc}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${catColors[item.cat] || 'bg-muted text-muted-foreground'}`}>{item.cat}</span>
                  <span className="text-[11px] text-muted-foreground">{item.time}</span>
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
            <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
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
