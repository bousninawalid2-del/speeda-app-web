'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Target, CheckCircle2, Clock, ImageIcon, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DraftPost {
  id: string;
  platform: string | null;
  caption: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  postDate: string | null;
  postTime: string | null;
  status: string;
}

interface WeeklyPlanning {
  id: string;
  weekNumber: number;
  weekStartDate: string | null;
  weekEndDate: string | null;
  postsCount: number;
  weeklyGoal: string | null;
  status: string;
  draftPosts: DraftPost[];
}

interface Strategy {
  id: string;
  name: string | null;
  status: string;
  periodStartDate: string | null;
  periodEndDate: string | null;
  weekCount: number;
  goal: string | null;
  platforms: string | null;
  createdAt: string;
  weeklyPlannings: WeeklyPlanning[];
}

const statusColors: Record<string, string> = {
  active: 'bg-green-accent/20 text-green-accent',
  completed: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-red-500/20 text-red-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  draft: 'bg-gray-500/20 text-gray-400',
  approved: 'bg-green-accent/20 text-green-accent',
  published: 'bg-purple-500/20 text-purple-400',
};

export default function StrategyPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('speeda_access_token');
    fetch('/api/strategies', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => setStrategies(data.strategies ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeStrategy = strategies.find(s => s.status === 'active');
  const pastStrategies = strategies.filter(s => s.status !== 'active');

  const totalPosts = activeStrategy?.weeklyPlannings.reduce(
    (sum, w) => sum + w.draftPosts.length, 0
  ) ?? 0;
  const publishedPosts = activeStrategy?.weeklyPlannings.reduce(
    (sum, w) => sum + w.draftPosts.filter(p => p.status === 'published').length, 0
  ) ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background min-h-screen pb-24"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-3 pb-3 flex items-center gap-3 bg-background z-30 border-b border-border-light">
        <button onClick={() => router.push('/dashboard')}
          className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft size={16} className="text-muted-foreground" />
        </button>
        <h2 className="text-[15px] font-bold text-foreground">AI Strategy</h2>
      </div>

      <div className="px-5 py-4 space-y-5">
        {loading && <p className="text-muted-foreground text-center py-8">Loading...</p>}

        {!loading && !activeStrategy && (
          <div className="text-center py-12 space-y-3">
            <Target size={48} className="mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No active strategy yet.</p>
            <p className="text-[13px] text-muted-foreground">Start a conversation in the chat to create your 8-week social media strategy.</p>
            <button onClick={() => router.push('/dashboard/chat')}
              className="mt-4 px-6 py-2.5 rounded-xl gradient-hero text-primary-foreground text-[14px] font-medium">
              Start in Chat
            </button>
          </div>
        )}

        {activeStrategy && (
          <>
            {/* Strategy overview card */}
            <div className="bg-card rounded-2xl border border-border-light p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-foreground">{activeStrategy.name ?? 'My Strategy'}</h3>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${statusColors[activeStrategy.status]}`}>
                  {activeStrategy.status}
                </span>
              </div>
              {activeStrategy.goal && (
                <p className="text-[13px] text-muted-foreground">{activeStrategy.goal}</p>
              )}
              <div className="flex gap-4 text-[12px]">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar size={12} /> {activeStrategy.weekCount} weeks
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <FileText size={12} /> {totalPosts} posts
                </span>
                <span className="flex items-center gap-1 text-green-accent">
                  <CheckCircle2 size={12} /> {publishedPosts} published
                </span>
              </div>
              {activeStrategy.platforms && (
                <div className="flex gap-2 flex-wrap">
                  {activeStrategy.platforms.split(',').map(p => (
                    <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {p.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly plannings */}
            {activeStrategy.weeklyPlannings.map(week => (
              <div key={week.id} className="bg-card rounded-2xl border border-border-light overflow-hidden">
                <button
                  onClick={() => setExpandedWeek(expandedWeek === week.id ? null : week.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                      <span className="text-primary-foreground text-[13px] font-bold">{week.weekNumber}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-[14px] font-semibold text-foreground">Week {week.weekNumber}</p>
                      {week.weeklyGoal && (
                        <p className="text-[12px] text-muted-foreground truncate max-w-[200px]">{week.weeklyGoal}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[week.status]}`}>
                      {week.draftPosts.length} posts
                    </span>
                  </div>
                </button>

                {expandedWeek === week.id && (
                  <div className="border-t border-border-light px-5 py-3 space-y-3">
                    {week.draftPosts.length === 0 && (
                      <p className="text-[13px] text-muted-foreground py-2">No posts yet for this week.</p>
                    )}
                    {week.draftPosts.map(post => (
                      <div key={post.id} className="flex gap-3 py-2 border-b border-border-light last:border-0">
                        {post.mediaUrl ? (
                          <img src={post.mediaUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <ImageIcon size={16} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {post.platform && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{post.platform}</span>
                            )}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[post.status]}`}>
                              {post.status}
                            </span>
                          </div>
                          {post.caption && (
                            <p className="text-[12px] text-foreground mt-1 line-clamp-2">{post.caption}</p>
                          )}
                          {post.postDate && (
                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(post.postDate).toLocaleDateString()}
                              {post.postTime && ` at ${post.postTime}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Past strategies */}
        {pastStrategies.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[14px] font-semibold text-muted-foreground">Past Strategies</h3>
            {pastStrategies.map(s => (
              <div key={s.id} className="bg-card rounded-xl border border-border-light p-4 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-foreground">{s.name ?? 'Strategy'}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()} — {s.weekCount} weeks
                  </p>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${statusColors[s.status]}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
