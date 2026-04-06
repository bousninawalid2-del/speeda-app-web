import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, ArrowUpDown, RefreshCw, Loader2 } from 'lucide-react';
import { InstagramLogo, TikTokLogo, FacebookLogo, GoogleLogo, XLogo, YouTubeLogo } from '../components/PlatformLogos';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Post } from '@/hooks/usePosts';

// ── Platform logo map ────────────────────────────────────────────────────────
const PLATFORM_LOGOS: Record<string, React.FC<{ size?: number }>> = {
  instagram: InstagramLogo,
  tiktok: TikTokLogo,
  facebook: FacebookLogo,
  x: XLogo,
  youtube: YouTubeLogo,
  googlebusiness: GoogleLogo,
};

function getPlatformLogo(platform: string): React.FC<{ size?: number }> {
  return PLATFORM_LOGOS[platform.toLowerCase()] ?? InstagramLogo;
}

// ── Type normalisation ───────────────────────────────────────────────────────
interface DisplayPost {
  id:         string;
  title:      string;
  platform:   string;
  Logo:       React.FC<{ size?: number }>;
  type:       string;
  status:     'published' | 'failed' | 'pending';
  date:       string;
  reach:      string;
  likes:      string;
  comments:   string;
  fromRss:    boolean;
  failReason?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function apiPostToDisplay(p: Post): DisplayPost {
  const platform = p.platform.split(',')[0].trim();
  const statusMap: Record<string, DisplayPost['status']> = {
    Published: 'published', Failed: 'failed', Draft: 'pending', Scheduled: 'pending',
  };
  return {
    id:         p.id,
    title:      p.caption.slice(0, 60),
    platform:   platform.charAt(0).toUpperCase() + platform.slice(1),
    Logo:       getPlatformLogo(platform),
    type:       'Post',
    status:     statusMap[p.status] ?? 'pending',
    date:       p.scheduledAt ? formatDate(p.scheduledAt) : formatDate(p.createdAt),
    reach:      '—',
    likes:      '—',
    comments:   '—',
    fromRss:    false,
  };
}

// ── Fallback demo posts ──────────────────────────────────────────────────────
const DEMO_POSTS: DisplayPost[] = [
  { id: '1', title: 'Ramadan Special Shawarma', platform: 'Instagram', Logo: InstagramLogo, type: 'Reel', status: 'published', date: 'Mar 22, 8:00 PM', reach: '12.4K', likes: '340', comments: '28', fromRss: false },
  { id: '2', title: 'Weekend Brunch Menu', platform: 'Facebook', Logo: FacebookLogo, type: 'Post', status: 'published', date: 'Mar 21, 12:00 PM', reach: '5.6K', likes: '89', comments: '12', fromRss: false },
  { id: '3', title: 'Behind the Kitchen', platform: 'TikTok', Logo: TikTokLogo, type: 'Video', status: 'published', date: 'Mar 20, 7:00 PM', reach: '28.1K', likes: '1.2K', comments: '45', fromRss: false },
  { id: '4', title: 'New Menu Announcement', platform: 'X', Logo: XLogo, type: 'Thread', status: 'failed', date: 'Mar 17, 9:00 AM', reach: '—', likes: '—', comments: '—', fromRss: false, failReason: 'API rate limit exceeded — X returned error 429' },
];

// ── Component ────────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  published: 'bg-green-accent text-primary-foreground',
  failed: 'bg-red-accent text-primary-foreground',
  pending: 'bg-orange-accent text-primary-foreground',
};

type SortKey = 'date' | 'reach' | 'engagement';
const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'date', label: 'Newest First' },
  { key: 'reach', label: 'Top Reach' },
  { key: 'engagement', label: 'Most Engagement' },
];

interface PostHistoryScreenProps {
  onBack:     () => void;
  onNavigate?: (screen: string) => void;
  /** Live posts from API. Falls back to demo data when undefined. */
  posts?:     Post[];
  isLoading?: boolean;
  onRetry?:   (postId: string) => Promise<void>;
}

export const PostHistoryScreen = ({
  onBack,
  onNavigate,
  posts: livePosts,
  isLoading,
  onRetry,
}: PostHistoryScreenProps) => {
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'published' | 'failed'>('All');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [retryingIds, setRetryingIds] = useState<string[]>([]);
  const [retriedIds, setRetriedIds] = useState<string[]>([]);
  const { t } = useTranslation();

  const displayPosts: DisplayPost[] = livePosts
    ? livePosts.map(apiPostToDisplay)
    : DEMO_POSTS;

  const platforms = ['All', ...Array.from(new Set(displayPosts.map(p => p.platform)))];
  const statusFilters = [
    { key: 'All' as const, label: 'All Status' },
    { key: 'published' as const, label: '✓ Published' },
    { key: 'failed' as const, label: '✕ Failed' },
  ];

  const filtered = displayPosts
    .filter(p => filterPlatform === 'All' || p.platform === filterPlatform)
    .filter(p => filterStatus === 'All' || p.status === filterStatus)
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  const failedCount = displayPosts.filter(p => p.status === 'failed').length;

  const handleRetry = async (postId: string) => {
    setRetryingIds(prev => [...prev, postId]);
    toast.loading('Retrying post...', { id: `retry-${postId}` });
    try {
      if (onRetry) {
        await onRetry(postId);
        setRetriedIds(prev => [...prev, postId]);
        toast.success('Post scheduled for retry ✓', { id: `retry-${postId}` });
      } else {
        // Demo mode
        await new Promise(r => setTimeout(r, 2000));
        const success = Math.random() > 0.3;
        if (success) {
          setRetriedIds(prev => [...prev, postId]);
          toast.success('Post published successfully ✓', { id: `retry-${postId}` });
        } else {
          toast.error('Retry failed — try again or edit the post', { id: `retry-${postId}` });
        }
      }
    } catch {
      toast.error('Retry failed — try again or edit the post', { id: `retry-${postId}` });
    } finally {
      setRetryingIds(prev => prev.filter(id => id !== postId));
    }
  };

  const handleRetryAll = () => {
    const failedPosts = displayPosts.filter(p => p.status === 'failed' && !retriedIds.includes(p.id));
    failedPosts.forEach((post, i) => {
      setTimeout(() => handleRetry(post.id), i * 800);
    });
  };

  const totalReach = displayPosts
    .filter(p => p.reach !== '—')
    .reduce((acc, p) => {
      const n = parseFloat(p.reach.replace('K', '')) * (p.reach.includes('K') ? 1000 : 1);
      return acc + (isNaN(n) ? 0 : n);
    }, 0);

  const formatReach = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
          <h1 className="text-[20px] font-extrabold text-foreground">{t('postHistory.title', 'Post History')}</h1>
          <span className="text-[13px] text-muted-foreground ml-auto">{displayPosts.length} posts</span>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('postHistory.search', 'Search posts...')}
              className="w-full h-10 rounded-xl bg-card border border-border-light pl-9 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground outline-none" />
          </div>
          <div className="relative">
            <button onClick={() => setShowSortMenu(!showSortMenu)} className="h-10 px-3 rounded-xl bg-card border border-border-light flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
              <ArrowUpDown size={14} /> Sort
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="absolute top-12 right-0 z-40 bg-card rounded-xl border border-border shadow-xl p-1 min-w-[160px]">
                  {sortOptions.map(opt => (
                    <button key={opt.key} onClick={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                        sortBy === opt.key ? 'bg-brand-blue/10 text-brand-blue' : 'text-foreground hover:bg-muted'
                      }`}>{opt.label}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Platform filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
          {platforms.map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)}
              className={`rounded-3xl px-4 py-2 text-[12px] font-semibold whitespace-nowrap transition-all ${
                filterPlatform === p ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}>{p}</button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-4">
          {statusFilters.map(sf => (
            <button key={sf.key} onClick={() => setFilterStatus(sf.key)}
              className={`rounded-3xl px-3 py-1.5 text-[11px] font-semibold transition-all ${
                filterStatus === sf.key ? 'gradient-btn text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}>{sf.label}</button>
          ))}
        </div>

        {/* Failed posts banner */}
        {failedCount > 0 && filterStatus !== 'published' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-accent/10 rounded-2xl p-4 mb-4 border border-red-accent/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-red-accent">{failedCount} failed post{failedCount > 1 ? 's' : ''}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Retry all or fix individually</p>
              </div>
              <button onClick={handleRetryAll} className="h-9 px-4 rounded-xl bg-red-accent text-primary-foreground text-[12px] font-bold flex items-center gap-1.5 btn-press">
                <RefreshCw size={14} /> Retry All
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: t('postHistory.totalPosts', 'Total Posts'), value: String(displayPosts.length), icon: '📝' },
            { label: t('postHistory.totalReach', 'Total Reach'), value: formatReach(totalReach) || '—', icon: '👁️' },
            { label: t('postHistory.avgEngagement', 'Avg. Engagement'), value: '—', icon: '📈' },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-2xl p-3 border border-border-light text-center">
              <span className="text-[18px]">{s.icon}</span>
              <p className="text-[16px] font-extrabold text-foreground mt-1">{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-brand-blue animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[15px] font-semibold text-foreground mb-1">No posts found</p>
            <p className="text-[13px] text-muted-foreground">Try changing your filters or create your first post.</p>
          </div>
        ) : (
          /* Post list */
          <div className="space-y-3">
            {filtered.map((post, i) => {
              const isRetrying = retryingIds.includes(post.id);
              const wasRetried = retriedIds.includes(post.id);
              const effectiveStatus = wasRetried ? 'published' : post.status;

              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-card rounded-2xl p-4 border border-border-light">
                  <div className="flex items-center gap-2 mb-2">
                    <post.Logo size={18} />
                    <span className="text-[14px] font-bold text-foreground flex-1 truncate">{post.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusColors[effectiveStatus] || 'bg-muted text-muted-foreground'}`}>
                      {effectiveStatus === 'published' ? '✓ Published' : effectiveStatus === 'failed' ? '✕ Failed' : effectiveStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded-md">{post.type}</span>
                    <span>{post.date}</span>
                    {post.fromRss && <span className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-md font-semibold">📡 RSS</span>}
                  </div>
                  {effectiveStatus === 'published' && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[
                        { l: t('postHistory.reach', 'Reach'), v: wasRetried ? '—' : post.reach },
                        { l: t('postHistory.likes', 'Likes'), v: wasRetried ? '—' : post.likes },
                        { l: t('postHistory.commentCount', 'Comments'), v: wasRetried ? '—' : post.comments },
                      ].map((m, j) => (
                        <div key={j}>
                          <span className="text-[9px] uppercase text-muted-foreground font-semibold">{m.l}</span>
                          <p className="text-[13px] font-bold text-foreground">{m.v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {effectiveStatus === 'failed' && !isRetrying && (
                    <div className="mt-2 bg-red-accent/10 rounded-xl p-3">
                      <p className="text-[12px] text-red-accent font-medium">⚠️ {post.failReason || t('postHistory.failedReason', 'API error — retry or edit post')}</p>
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => handleRetry(post.id)} className="h-8 px-4 rounded-lg bg-red-accent text-primary-foreground text-[12px] font-bold flex items-center gap-1.5 btn-press">
                          <RefreshCw size={12} /> {t('postHistory.retry', 'Retry')}
                        </button>
                        <button onClick={() => onNavigate?.('postEdit')} className="text-muted-foreground text-[12px] font-semibold flex items-center gap-1">✏️ {t('common.edit', 'Edit')}</button>
                      </div>
                    </div>
                  )}
                  {isRetrying && (
                    <div className="mt-2 bg-brand-blue/10 rounded-xl p-3 flex items-center gap-3">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <RefreshCw size={16} className="text-brand-blue" />
                      </motion.div>
                      <span className="text-[13px] text-brand-blue font-semibold">Retrying post...</span>
                    </div>
                  )}
                  {wasRetried && effectiveStatus === 'published' && (
                    <p className="text-[11px] text-green-accent font-semibold mt-2">✓ Successfully retried</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
