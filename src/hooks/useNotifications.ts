import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationItem {
  id:      string;
  icon:    string;
  bg:      string;
  title:   string;
  text:    string;
  time:    string;
  unread:  boolean;
  nav?:    string;
}

export interface NotificationGroup {
  groupKey: string;
  items:    NotificationItem[];
}

// ─── Fallback (moved from screen) ────────────────────────────────────────────

const NOTIFICATIONS_FALLBACK: NotificationGroup[] = [
  { groupKey: 'notifications.today', items: [
    { id: 'f1', icon: '📢', bg: 'bg-green-soft',  title: 'Campaign Milestone',    text: 'Your Ramadan campaign reached 15K people today',                         time: '10m ago',  unread: true,  nav: 'campaigns' },
    { id: 'f2', icon: '✦',  bg: 'bg-purple-soft', title: 'AI Content Ready',      text: '3 new posts generated for your approval',                                 time: '1h ago',   unread: true,  nav: 'create' },
    { id: 'f3', icon: '⭐', bg: 'bg-orange-soft', title: 'New Reviews',           text: 'You received 4 new Google reviews',                                       time: '2h ago',   unread: true,  nav: 'chat-engagement-reviews' },
    { id: 'f4', icon: '⚠️', bg: 'bg-red-soft',    title: 'Budget Alert',          text: 'Instagram ad budget 80% consumed',                                        time: '3h ago',   unread: false, nav: 'campaigns' },
    { id: 'f5', icon: '📡', bg: 'bg-purple-soft', title: 'RSS Auto-Post',         text: 'New article "Perfect Shawarma Tips" published to Instagram & Facebook',  time: '4h ago',   unread: false, nav: 'create' },
    { id: 'f6', icon: '🔗', bg: 'bg-green-soft',  title: 'Webhook: Post Published', text: 'Your scheduled post went live on Instagram successfully',              time: '4h ago',   unread: false, nav: 'create' },
  ]},
  { groupKey: 'notifications.yesterday', items: [
    { id: 'f7', icon: '📊', bg: 'bg-purple-soft', title: 'Weekly Report',         text: 'Your weekly analytics report is ready',               time: 'Yesterday', unread: false, nav: 'weeklyReport' },
    { id: 'f8', icon: '💜', bg: 'bg-green-soft',  title: 'Engagement Milestone',  text: 'You hit 10K total followers across platforms',        time: 'Yesterday', unread: false, nav: 'analytics' },
    { id: 'f9', icon: '🔴', bg: 'bg-red-soft',    title: 'Platform Disconnected', text: 'X (Twitter) connection lost — tap to reconnect',      time: 'Yesterday', unread: false, nav: 'social' },
  ]},
  { groupKey: 'notifications.earlier', items: [
    { id: 'f10', icon: '✅', bg: 'bg-green-soft',  title: 'Campaign Completed',   text: 'Weekend Special campaign ended with 2.3x ROI',        time: '2 days ago', unread: false, nav: 'campaigns' },
    { id: 'f11', icon: '🔗', bg: 'bg-orange-soft', title: 'Webhook: Post Failed', text: 'TikTok post failed — media format error',             time: '3 days ago', unread: false, nav: 'postHistory' },
  ]},
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn:  async () => {
      try {
        // Attempt to fetch from a notifications endpoint when it exists
        const res = await apiFetch<{ groups: NotificationGroup[] }>('/notifications');
        return res.groups;
      } catch {
        return NOTIFICATIONS_FALLBACK;
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useInvalidateNotifications() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['notifications'] });
}
