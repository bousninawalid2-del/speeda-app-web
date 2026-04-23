import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationsScreenProps {
  onBack:      () => void;
  onNavigate?: (screen: string) => void;
}

export const NotificationsScreen = ({ onBack, onNavigate }: NotificationsScreenProps) => {
  const { t } = useTranslation();
  const [readAll, setReadAll] = useState(false);

  const { data: groups, isLoading } = useNotifications();

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground rtl:rotate-180" /></button>
          <h1 className="text-[20px] font-bold text-foreground flex-1">{t('notifications.title')}</h1>
          <button onClick={() => setReadAll(true)} className="text-brand-blue text-[13px] font-medium">{t('notifications.markAllRead')}</button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-brand-blue animate-spin" />
          </div>
        ) : !groups || groups.every(g => g.items.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl">🔔</span>
            <p className="text-[15px] font-semibold text-foreground mt-3">{t('notificationsEmpty.title')}</p>
            <p className="text-[13px] text-muted-foreground mt-1">{t('notificationsEmpty.desc')}</p>
          </div>
        ) : (
          groups.map((group, gi) => (
            <div key={gi} className="mb-5">
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t(group.groupKey)}</h3>
              <div className="space-y-2">
                {group.items.map((n, i) => (
                  <motion.button
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => n.nav && onNavigate?.(n.nav)}
                    className="w-full bg-card rounded-2xl p-4 border border-border-light flex gap-3 items-start text-start"
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
          ))
        )}
      </div>
    </motion.div>
  );
};
