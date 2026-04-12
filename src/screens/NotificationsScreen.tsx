import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NotificationItem {
  icon: string;
  bg: string;
  title: string;
  text: string;
  time: string;
  unread: boolean;
  nav?: string;
}

// STATIC: Push notifications — Phase 2
// TODO: connect notifications API

const notifications: { groupKey: string; items: NotificationItem[] }[] = [
  { groupKey: 'notifications.today', items: [
    { icon: '📢', bg: 'bg-green-soft', title: 'Campaign Milestone', text: 'Your Ramadan campaign reached 15K people today', time: '10m ago', unread: true, nav: 'campaigns' },
    { icon: '✦', bg: 'bg-purple-soft', title: 'AI Content Ready', text: '3 new posts generated for your approval', time: '1h ago', unread: true, nav: 'create' },
    { icon: '⭐', bg: 'bg-orange-soft', title: 'New Reviews', text: 'You received 4 new Google reviews', time: '2h ago', unread: true, nav: 'chat-engagement-reviews' },
    { icon: '⚠️', bg: 'bg-red-soft', title: 'Budget Alert', text: 'Instagram ad budget 80% consumed', time: '3h ago', unread: false, nav: 'campaigns' },
    { icon: '📡', bg: 'bg-purple-soft', title: 'RSS Auto-Post', text: 'New article "Perfect Shawarma Tips" published to Instagram & Facebook', time: '4h ago', unread: false, nav: 'create' },
    { icon: '🔗', bg: 'bg-green-soft', title: 'Webhook: Post Published', text: 'Your scheduled post went live on Instagram successfully', time: '4h ago', unread: false, nav: 'create' },
  ]},
  { groupKey: 'notifications.yesterday', items: [
    { icon: '📊', bg: 'bg-purple-soft', title: 'Weekly Report', text: 'Your weekly analytics report is ready', time: 'Yesterday', unread: false, nav: 'weeklyReport' },
    { icon: '💜', bg: 'bg-green-soft', title: 'Engagement Milestone', text: 'You hit 10K total followers across platforms', time: 'Yesterday', unread: false, nav: 'analytics' },
    { icon: '🔴', bg: 'bg-red-soft', title: 'Platform Disconnected', text: 'X (Twitter) connection lost — tap to reconnect', time: 'Yesterday', unread: false, nav: 'social' },
    { icon: '🔗', bg: 'bg-green-soft', title: 'Webhook: Boost Complete', text: 'Your boosted post reached 12.4K impressions', time: 'Yesterday', unread: false, nav: 'campaigns' },
  ]},
  { groupKey: 'notifications.earlier', items: [
    { icon: '✅', bg: 'bg-green-soft', title: 'Campaign Completed', text: 'Weekend Special campaign ended with 2.3x ROI', time: '2 days ago', unread: false, nav: 'campaigns' },
    { icon: '🔗', bg: 'bg-orange-soft', title: 'Webhook: Post Failed', text: 'TikTok post failed — media format error', time: '3 days ago', unread: false, nav: 'postHistory' },
  ]},
];

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export const NotificationsScreen = ({ onBack, onNavigate }: NotificationsScreenProps) => {
  const { t } = useTranslation();
  const [readAll, setReadAll] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground flex-1">{t('notifications.title')}</h1>
          <button onClick={() => setReadAll(true)} className="text-brand-blue text-[13px] font-medium">{t('notifications.markAllRead')}</button>
        </div>
        {notifications.map((group, gi) => (
          <div key={gi} className="mb-5">
            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t(group.groupKey)}</h3>
            <div className="space-y-2">
              {group.items.map((n, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => n.nav && onNavigate?.(n.nav)}
                  className="w-full bg-card rounded-2xl p-4 border border-border-light flex gap-3 items-start text-left"
                >
                  <div className={`w-10 h-10 rounded-2xl ${n.bg} flex items-center justify-center text-lg flex-shrink-0`}>{n.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground">{n.title}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{n.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{n.time}</p>
                  </div>
                  {n.unread && !readAll && <div className="w-2 h-2 rounded-full bg-brand-blue flex-shrink-0 mt-1.5" />}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};