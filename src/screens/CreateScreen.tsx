import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Calendar as CalendarIcon, FolderOpen, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo, GoogleLogo, PinterestLogo, ThreadsLogo } from '../components/PlatformLogos';
import { toast } from 'sonner';
import { useSocialAccounts } from '../hooks/useSocialAccounts';
import { useTokens } from '../hooks/useTokens';
import { useCreatePost, usePosts, Post } from '../hooks/usePosts';
import { ImageResizeNotice } from '../components/ImageResizeNotice';

// Platform logo lookup
const PLATFORM_LOGOS: Record<string, React.ComponentType<{ size?: number }>> = {
  instagram: InstagramLogo,
  tiktok: TikTokLogo,
  snapchat: SnapchatLogo,
  facebook: FacebookLogo,
  x: XLogo,
  youtube: YouTubeLogo,
  linkedin: LinkedInLogo,
  googlebusiness: GoogleLogo,
  pinterest: PinterestLogo,
  threads: ThreadsLogo,
};

const contentTypes = ['Feed Post', 'Reel', 'Story', 'Carousel'];

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mt-5">
    <label className="text-[16px] font-bold text-foreground">{label}</label>
    <div className="mt-2">{children}</div>
  </div>
);

const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`rounded-3xl px-5 py-[9px] text-[13px] font-semibold transition-all duration-200 whitespace-nowrap ${
    active ? 'bg-brand-blue text-primary-foreground' : 'bg-card text-muted-foreground border border-border'
  }`}>{label}</button>
);

// ── Status badge ──
const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Draft: 'bg-muted text-muted-foreground',
    Scheduled: 'bg-green-soft text-green-accent',
    Published: 'bg-brand-blue/10 text-brand-blue',
    Failed: 'bg-red-accent/10 text-red-accent',
  };
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${colors[status] ?? colors.Draft}`}>{status}</span>;
};

// ═══════════════════════════════════════
//  QUICK POST MODE
// ═══════════════════════════════════════
const QuickPostMode = () => {
  const { data: socialAccounts } = useSocialAccounts();
  const { data: tokensData } = useTokens();
  const createPost = useCreatePost();

  const connectedPlatforms = socialAccounts?.filter(a => a.connected) ?? [];

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [type, setType] = useState('Feed Post');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }
    if (!caption.trim()) {
      toast.error('Write a caption first');
      return;
    }

    setIsPublishing(true);
    try {
      const scheduledAt = scheduleMode === 'later' && schedDate
        ? new Date(`${schedDate}T${schedTime || '12:00'}`).toISOString()
        : undefined;

      await createPost.mutateAsync({
        platform: selectedPlatforms.join(','),
        caption: caption.trim(),
        hashtags: hashtags.trim() || undefined,
        scheduledAt,
        status: scheduleMode === 'now' ? 'Published' : 'Scheduled',
      });

      toast.success(scheduleMode === 'now' ? 'Post published!' : `Post scheduled for ${schedDate} ${schedTime}`);
      // Reset form
      setCaption('');
      setHashtags('');
      setSelectedPlatforms([]);
      setScheduleMode('now');
      setSchedDate('');
      setSchedTime('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      {/* Schedule For */}
      <Section label="Schedule for">
        <div className="bg-card rounded-2xl border border-border-light p-3">
          {scheduleMode === 'now' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-brand-blue" />
                <span className="text-[14px] font-medium text-foreground">Now (publish immediately)</span>
              </div>
              <button onClick={() => setScheduleMode('later')} className="text-[12px] text-brand-blue font-semibold">Schedule for later</button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-brand-blue" />
                <span className="text-[14px] font-medium text-foreground">
                  {schedDate ? `${schedDate} · ${schedTime || 'Pick time'}` : 'Pick date & time'}
                </span>
                <button onClick={() => setScheduleMode('now')} className="text-[12px] text-muted-foreground font-medium ml-auto">Publish now</button>
              </div>
              <div className="flex gap-2">
                <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                  className="flex-1 rounded-xl bg-background border border-border px-3 py-2 text-[13px] focus:border-primary focus:outline-none" />
                <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                  className="w-[120px] rounded-xl bg-background border border-border px-3 py-2 text-[13px] focus:border-primary focus:outline-none" />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Platforms — only connected ones */}
      <Section label="Platforms">
        {connectedPlatforms.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No platforms connected. Go to Settings to connect your social media accounts.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {connectedPlatforms.map(account => {
              const Logo = PLATFORM_LOGOS[account.platform];
              if (!Logo) return null;
              const isSelected = selectedPlatforms.includes(account.platform);
              return (
                <button key={account.platform} onClick={() => togglePlatform(account.platform)}
                  className={`flex items-center gap-2 rounded-3xl px-4 py-2 text-[13px] font-semibold whitespace-nowrap transition-all ${
                    isSelected ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
                  }`}>
                  <Logo size={16} />
                  {account.platform}
                  {account.username && <span className="text-[11px] opacity-70">@{account.username}</span>}
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {/* Content Type */}
      <Section label="Content Type">
        <div className="flex flex-wrap gap-2">
          {contentTypes.map(ct => <Chip key={ct} label={ct} active={type === ct} onClick={() => setType(ct)} />)}
        </div>
      </Section>

      {/* Caption */}
      <Section label="Caption">
        <textarea value={caption} onChange={e => setCaption(e.target.value)}
          className="w-full min-h-[120px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none"
          placeholder="Write your caption..." />
        <p className="text-[11px] text-muted-foreground mt-1">{caption.length} / 4000 characters</p>
      </Section>

      {/* Hashtags */}
      <Section label="Hashtags">
        <input value={hashtags} onChange={e => setHashtags(e.target.value)}
          className="w-full rounded-2xl bg-card border border-border px-4 py-3 text-[14px] focus:border-primary focus:outline-none"
          placeholder="#hashtag1 #hashtag2 #hashtag3" />
      </Section>

      {/* Image resize notice */}
      <ImageResizeNotice selectedPlatforms={selectedPlatforms} hasImage={false} />

      {/* Publish button */}
      <button onClick={handlePublish} disabled={isPublishing || selectedPlatforms.length === 0 || !caption.trim()}
        className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-5 disabled:opacity-50">
        {isPublishing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {scheduleMode === 'now' ? 'Publishing...' : 'Scheduling...'}
          </span>
        ) : scheduleMode === 'now' ? 'Publish Now' : 'Schedule Post'}
      </button>
    </>
  );
};

// ═══════════════════════════════════════
//  POSTS LIST (replaces Calendar)
// ═══════════════════════════════════════
const PostsList = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, isLoading } = usePosts({ status: statusFilter, page: 1 });

  const statuses = ['All', 'Draft', 'Scheduled', 'Published', 'Failed'];

  return (
    <div>
      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statuses.map(s => (
          <Chip key={s} label={s} active={s === 'All' ? !statusFilter : statusFilter === s}
            onClick={() => setStatusFilter(s === 'All' ? undefined : s)} />
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.posts?.length ? (
        <div className="text-center py-12">
          <p className="text-[48px]">📝</p>
          <p className="text-[16px] font-bold text-foreground mt-3">No posts yet</p>
          <p className="text-[13px] text-muted-foreground mt-1">Create your first post using Quick Post</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {data.posts.map((post: Post) => {
            const platforms = post.platform.split(',').map(p => p.trim());
            return (
              <div key={post.id} className="bg-card rounded-2xl p-4 border border-border-light">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {platforms.map(p => {
                      const Logo = PLATFORM_LOGOS[p];
                      return Logo ? <Logo key={p} size={16} /> : null;
                    })}
                  </div>
                  <StatusBadge status={post.status} />
                </div>
                <p className="text-[13px] text-foreground mt-2 line-clamp-2">{post.caption}</p>
                {post.hashtags && (
                  <p className="text-[11px] text-brand-blue mt-1">{post.hashtags}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-muted-foreground">
                    {post.scheduledAt
                      ? `Scheduled: ${new Date(post.scheduledAt).toLocaleDateString()} ${new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : new Date(post.createdAt).toLocaleDateString()
                    }
                  </span>
                  {post.ayrshareId && (
                    <span className="text-[10px] text-green-accent font-medium">Synced</span>
                  )}
                </div>
              </div>
            );
          })}
          {data.pagination.pages > 1 && (
            <p className="text-center text-[12px] text-muted-foreground mt-3">
              Showing {data.posts.length} of {data.pagination.total} posts
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
//  MAIN CREATE SCREEN
// ═══════════════════════════════════════
export const CreateScreen = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'posts' | 'quick'>('quick');

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">{t('create.title')}</h1>
        <p className="text-[14px] text-muted-foreground mt-1">{t('create.subtitle')}</p>

        {/* Tabs: Quick Post + My Posts */}
        <div className="mt-5 bg-card rounded-2xl p-1 flex border border-border-light">
          {([
            { key: 'quick' as const, label: 'Quick Post' },
            { key: 'posts' as const, label: 'My Posts' },
          ]).map(m => (
            <button key={m.key} onClick={() => setMode(m.key)}
              className={`flex-1 py-3 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                mode === m.key ? 'bg-brand-blue text-primary-foreground shadow-sm' : 'text-muted-foreground'
              }`}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Mode Content */}
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: mode === 'quick' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="mt-4">
            {mode === 'quick' && <QuickPostMode />}
            {mode === 'posts' && <PostsList />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
