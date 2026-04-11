import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Pencil, Trash2, BarChart3, RefreshCw, Rocket, Pause, DollarSign } from 'lucide-react';
import Image from 'next/image';
import { CalendarPost } from './CalendarData';
import { platformLogoMap } from './PlatformLogos';
import { BoostFlow } from './BoostFlow';
import { useIsMobile } from '../hooks/use-mobile';

const statusBadge = (status: string) => {
  switch (status) {
    case 'scheduled': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-soft text-green-accent">Scheduled ✅</span>;
    case 'draft': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-soft text-orange-accent">Draft 📝</span>;
    case 'ai-generated': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-soft text-purple">AI Generated ✦</span>;
    case 'published': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">Published ✓</span>;
    case 'failed': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600">Failed</span>;
    case 'boosted': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-primary-foreground gradient-hero">Boosted 🚀</span>;
    case 'pending-approval': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-soft text-purple border border-purple/30">✦ Pending Approval</span>;
    default: return null;
  }
};

interface PostDetailPanelProps {
  post: CalendarPost;
  onClose: () => void;
  onBoostComplete?: () => void;
  onEditPost?: (post: CalendarPost) => void;
  onDeletePost?: (post: CalendarPost) => Promise<void> | void;
}

export const PostDetailPanel = ({ post, onClose, onBoostComplete, onEditPost, onDeletePost }: PostDetailPanelProps) => {
  const [showBoost, setShowBoost] = useState(false);
  const [boosted, setBoosted] = useState(post.status === 'boosted');
  const [deleting, setDeleting] = useState(false);
  const isMobile = useIsMobile();
  const PlatformLogo = platformLogoMap[post.platform];

  const handleBoostComplete = () => {
    setBoosted(true);
    setShowBoost(false);
    onBoostComplete?.();
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {showBoost ? (
          <button onClick={() => setShowBoost(false)} className="text-[14px] font-semibold text-brand-blue">← Back</button>
        ) : (
          <div className="flex items-center gap-2">
            {PlatformLogo && <PlatformLogo size={28} />}
            <span className="text-[14px] font-bold text-foreground">{post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}</span>
            <span className="text-[12px] text-muted-foreground">{post.type}</span>
          </div>
        )}
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
          <X size={18} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="wait">
          {showBoost ? (
            <motion.div key="boost" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <BoostFlow post={post} onComplete={handleBoostComplete} onCancel={() => setShowBoost(false)} />
            </motion.div>
          ) : (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                {boosted ? statusBadge('boosted') : statusBadge(post.status)}
              </div>

              {/* Media thumbnail */}
              <div className="w-full h-[180px] rounded-xl overflow-hidden relative">
                {post.mediaUrls?.[0] ? (
                  <Image src={post.mediaUrls[0]} alt={post.title} fill className="object-cover" sizes="400px" />
                ) : (
                  <div className="w-full h-full gradient-hero flex items-center justify-center">
                    <span className="text-4xl">📷</span>
                  </div>
                )}
              </div>

              {/* Caption */}
              {post.caption && (
                <div>
                  <p className="text-[14px] text-foreground leading-[1.6] whitespace-pre-line">{post.caption}</p>
                  {post.hashtags && <p className="text-[13px] text-brand-blue mt-2">{post.hashtags}</p>}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[12px] text-muted-foreground">📅 {post.time}</span>
                {post.brandMatch && (
                  <span className="text-[11px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">Brand Match {post.brandMatch}%</span>
                )}
              </div>

              {/* Boost metrics */}
              {boosted && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-green-soft rounded-xl p-3">
                  <p className="text-[11px] font-semibold text-brand-teal">🚀 2.4K reach · 89 clicks · 2.1x ROAS</p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2">
                {post.status === 'ai-generated' && (
                  <button className="w-full h-[48px] rounded-2xl gradient-btn text-primary-foreground text-[14px] font-bold btn-press">
                    Approve & Publish
                  </button>
                )}

                {(post.status === 'scheduled' || post.status === 'ai-generated') && (
                  <>
                    <button onClick={() => onEditPost?.(post)} className="w-full h-[44px] rounded-2xl border border-border text-foreground text-[13px] font-medium btn-press flex items-center justify-center gap-2">
                      <Pencil size={14} /> Edit Post
                    </button>
                    <button className="w-full h-[44px] rounded-2xl border border-border text-foreground text-[13px] font-medium btn-press flex items-center justify-center gap-2">
                      <Calendar size={14} /> Reschedule
                    </button>
                    <button className="w-full h-[44px] rounded-2xl border border-border text-foreground text-[13px] font-medium btn-press flex items-center justify-center gap-2">
                      🌐 Translate & Repost
                    </button>
                    {!boosted && (
                      <button onClick={() => setShowBoost(true)} className="w-full h-[48px] rounded-2xl border-2 border-brand-blue/20 text-foreground text-[14px] font-bold btn-press flex items-center justify-center gap-2" style={{ borderLeft: '4px solid', borderImage: 'linear-gradient(to bottom, hsl(233,100%,42%), hsl(193,100%,48%)) 1' }}>
                        <Rocket size={16} className="text-brand-blue" /> Boost This Post
                      </button>
                    )}
                  </>
                )}

                {post.status === 'published' && (
                  <>
                    {!boosted && (
                      <button onClick={() => setShowBoost(true)} className="w-full h-[48px] rounded-2xl gradient-btn text-primary-foreground text-[14px] font-bold btn-press flex items-center justify-center gap-2">
                        <Rocket size={16} /> Boost This Post
                      </button>
                    )}
                    <button className="w-full h-[44px] rounded-2xl border border-border text-foreground text-[13px] font-medium btn-press flex items-center justify-center gap-2">
                      <BarChart3 size={14} /> View Full Analytics
                    </button>
                    <button className="w-full h-[44px] rounded-2xl border border-border text-foreground text-[13px] font-medium btn-press flex items-center justify-center gap-2">
                      <RefreshCw size={14} /> Repurpose
                    </button>
                  </>
                )}

                {post.status === 'draft' && (
                  <>
                    <button onClick={() => onEditPost?.(post)} className="w-full h-[48px] rounded-2xl gradient-btn text-primary-foreground text-[14px] font-bold btn-press">
                      ✏️ Continue Editing
                    </button>
                    <button className="w-full h-[44px] rounded-2xl border border-border text-foreground text-[13px] font-medium btn-press flex items-center justify-center gap-2">
                      <Calendar size={14} /> Schedule
                    </button>
                  </>
                )}

                {boosted && (
                  <>
                    <button className="w-full h-[44px] rounded-2xl border border-border text-foreground text-[13px] font-medium btn-press flex items-center justify-center gap-2">
                      <BarChart3 size={14} /> Boost Performance
                    </button>
                    <button className="w-full h-[44px] rounded-2xl border border-border text-foreground text-[13px] font-medium btn-press flex items-center justify-center gap-2">
                      <Pause size={14} /> Pause Boost
                    </button>
                    <button className="w-full h-[44px] rounded-2xl border border-border text-foreground text-[13px] font-medium btn-press flex items-center justify-center gap-2">
                      <DollarSign size={14} /> Increase Budget
                    </button>
                  </>
                )}

                {post.status === 'pending-approval' && (
                  <>
                    <button className="w-full h-[48px] rounded-2xl gradient-btn text-primary-foreground text-[14px] font-bold btn-press">
                      Approve & Schedule
                    </button>
                    <button onClick={() => onEditPost?.(post)} className="w-full h-[44px] rounded-2xl border border-border text-foreground text-[13px] font-medium btn-press flex items-center justify-center gap-2">
                      <Pencil size={14} /> Edit
                    </button>
                  </>
                )}

                <button
                  onClick={async () => {
                    if (!onDeletePost || deleting) return;
                    setDeleting(true);
                    try {
                      await onDeletePost(post);
                      onClose();
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={!onDeletePost || deleting}
                  className="w-full text-center text-[13px] text-red-accent font-medium py-2 flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl max-h-[85vh] flex flex-col"
        >
          <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-muted" />
          {content}
        </motion.div>
      </>
    );
  }

  // Desktop: side panel
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-[400px] border-l border-border bg-card h-full flex-shrink-0 overflow-hidden flex flex-col"
    >
      {content}
    </motion.div>
  );
};
