import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, Camera, Scissors, Trash2, Plus, Sparkles, Undo2, Ban, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { platformLogoMap } from '../components/PlatformLogos';
import { InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo, GoogleLogo, PinterestLogo, ThreadsLogo } from '../components/PlatformLogos';
import { useIsMobile } from '../hooks/use-mobile';

interface PostEditData {
  platform: string;
  type: string;
  caption: string;
  hashtags: string[];
  imageUrl?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  status: 'draft' | 'scheduled' | 'ai-generated' | 'published';
}

interface PostEditScreenProps {
  post: PostEditData;
  onBack: () => void;
  onSave: (post: PostEditData) => void;
}

const platformCharLimits: Record<string, number> = {
  instagram: 2200, tiktok: 2200, snapchat: 250, facebook: 63206,
  x: 280, youtube: 5000, linkedin: 3000, google: 1500,
  pinterest: 500, threads: 500,
};



const allPlatforms = [
  { id: 'instagram', name: 'Instagram', Logo: InstagramLogo },
  { id: 'tiktok', name: 'TikTok', Logo: TikTokLogo },
  { id: 'snapchat', name: 'Snapchat', Logo: SnapchatLogo, note: 'Stories only' },
  { id: 'facebook', name: 'Facebook', Logo: FacebookLogo },
  { id: 'x', name: 'X', Logo: XLogo },
  { id: 'youtube', name: 'YouTube', Logo: YouTubeLogo },
  { id: 'linkedin', name: 'LinkedIn', Logo: LinkedInLogo },
  { id: 'google', name: 'Google Biz', Logo: GoogleLogo },
  { id: 'pinterest', name: 'Pinterest', Logo: PinterestLogo },
  { id: 'threads', name: 'Threads', Logo: ThreadsLogo },
];

export const PostEditScreen = ({ post, onBack, onSave }: PostEditScreenProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [caption, setCaption] = useState(post.caption);
  const [hashtags, setHashtags] = useState<string[]>(post.hashtags);
  const [newHashtag, setNewHashtag] = useState('');
  const [hasImage, setHasImage] = useState(!!post.imageUrl);
  const [schedDate, setSchedDate] = useState(post.scheduledDate || 'Thursday, March 20');
  const [schedTime, setSchedTime] = useState(post.scheduledTime || '8:00 PM');
  const [platforms, setPlatforms] = useState<string[]>([post.platform]);
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [previousCaption, setPreviousCaption] = useState('');
  const [showUndo, setShowUndo] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [checkingBanned, setCheckingBanned] = useState(false);
  const [bannedTags, setBannedTags] = useState<string[]>([]);

  const isPublished = post.status === 'published';
  const charLimit = platformCharLimits[post.platform] || 2200;

  useEffect(() => {
    if (caption !== post.caption || JSON.stringify(hashtags) !== JSON.stringify(post.hashtags)) {
      setHasChanges(true);
    }
  }, [caption, hashtags]);

  const handleBack = () => {
    if (hasChanges) {
      setShowDiscardDialog(true);
    } else {
      onBack();
    }
  };

  const handleSave = () => {
    onSave({ ...post, caption, hashtags, scheduledDate: schedDate, scheduledTime: schedTime });
    toast.success(t('postEdit.saved', '✅ Post updated'));
    onBack();
  };

  const handleAIRewrite = async () => {
    setPreviousCaption(caption);
    setRewriting(true);
    setTimeout(() => {
      setCaption(prev => {
        const lines = prev.split('\n');
        return lines.map(l => l.startsWith('#') ? l : l.length > 0 ? `✦ ${l}` : l).join('\n');
      });
      setRewriting(false);
      setShowUndo(true);
      setTimeout(() => setShowUndo(false), 5000);
    }, 1500);
  };

  const handleUndo = () => {
    setCaption(previousCaption);
    setShowUndo(false);
    toast.success('Caption restored');
  };

  const handleSuggestHashtags = () => {
    setSuggesting(true);
    setTimeout(() => {
      const suggestions = ['#SaudiFood', '#Riyadh', '#FoodLovers', '#Halal', '#مطاعم'];
      const newTags = suggestions.filter(s => !hashtags.includes(s)).slice(0, 5);
      setHashtags(prev => [...prev, ...newTags]);
      setSuggesting(false);
      toast.success(`Added ${newTags.length} hashtags`);
    }, 1000);
  };

  const handleCheckBanned = () => {
    setCheckingBanned(true);
    setTimeout(() => {
      const banned = hashtags.filter(h => ['#FollowForFollow', '#Like4Like', '#InstaFood'].includes(h));
      setBannedTags(banned);
      setCheckingBanned(false);
      if (banned.length > 0) {
        toast.error(`${banned.length} banned hashtag(s) found`);
      } else {
        toast.success('All hashtags are safe ✓');
      }
    }, 1000);
  };

  const addHashtag = () => {
    if (newHashtag.trim() && hashtags.length < 30) {
      const tag = newHashtag.startsWith('#') ? newHashtag.trim() : `#${newHashtag.trim()}`;
      if (!hashtags.includes(tag)) {
        setHashtags(prev => [...prev, tag]);
      }
      setNewHashtag('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(prev => prev.filter(h => h !== tag));
    setBannedTags(prev => prev.filter(h => h !== tag));
  };

  const togglePlatform = (id: string) => {
    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    setHasChanges(true);
  };

  const PlatformLogo = platformLogoMap[post.platform];

  return (
    <motion.div
      initial={{ opacity: 0, x: isMobile ? 30 : 0 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-background ${isMobile ? 'min-h-screen' : 'min-h-screen'} pb-24 flex flex-col`}
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-3 border-b border-border-light flex items-center gap-3">
        <button onClick={handleBack}>
          <ChevronLeft size={24} className="text-foreground rtl:rotate-180" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[18px] font-bold text-foreground">✏️ {t('postEdit.title', 'Edit Post')}</span>
          {PlatformLogo && <PlatformLogo size={20} />}
          <span className="text-[12px] text-muted-foreground">{post.platform}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{post.type}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Media Section */}
        <div>
          <label className="text-[13px] font-semibold text-foreground mb-2 block">{t('postEdit.media', 'Media')}</label>
          {hasImage ? (
            <div className="relative">
              <div className="w-full h-[200px] rounded-xl bg-muted overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-muted to-border flex items-center justify-center">
                  <span className="text-[40px]">🖼️</span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="flex-1 h-9 rounded-xl bg-card border border-border-light text-[12px] font-semibold text-foreground flex items-center justify-center gap-1.5">
                  <Camera size={14} /> {t('postEdit.replaceImage', 'Replace')}
                </button>
                <button className="flex-1 h-9 rounded-xl bg-card border border-border-light text-[12px] font-semibold text-foreground flex items-center justify-center gap-1.5">
                  <Scissors size={14} /> {t('postEdit.crop', 'Crop')}
                </button>
                <button onClick={() => { setHasImage(false); setHasChanges(true); }} className="flex-1 h-9 rounded-xl bg-card border border-border-light text-[12px] font-semibold text-red-accent flex items-center justify-center gap-1.5">
                  <Trash2 size={14} /> {t('postEdit.remove', 'Remove')}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setHasImage(true); setHasChanges(true); }} className="w-full h-[100px] rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground text-[13px] font-medium">
              <Plus size={16} /> {t('postEdit.addMedia', 'Add Image or Video')}
            </button>
          )}
        </div>

        {/* Caption Section */}
        <div>
          <label className="text-[13px] font-semibold text-foreground mb-2 block">{t('postEdit.caption', 'Caption')}</label>
          <div className="relative">
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className={`w-full min-h-[120px] rounded-xl bg-card border border-border-light p-4 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-y ${rewriting ? 'animate-pulse' : ''}`}
              placeholder={t('postEdit.captionPlaceholder', 'Write your caption...')}
            />
            <span className="absolute bottom-3 end-3 text-[11px] text-muted-foreground">
              {caption.length}/{charLimit}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={handleAIRewrite} disabled={rewriting} className="text-brand-blue text-[12px] font-semibold flex items-center gap-1">
              <Sparkles size={12} /> {rewriting ? t('postEdit.rewriting', 'Rewriting...') : t('postEdit.rewriteAI', '✦ Rewrite with AI')}
            </button>
            <AnimatePresence>
              {showUndo && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={handleUndo}
                  className="text-orange-accent text-[12px] font-semibold flex items-center gap-1"
                >
                  <Undo2 size={12} /> {t('postEdit.undo', '↩️ Undo')}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Hashtags Section */}
        <div>
          <label className="text-[13px] font-semibold text-foreground mb-2 block">{t('postEdit.hashtags', 'Hashtags')}</label>
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map(tag => (
              <span key={tag} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium ${bannedTags.includes(tag) ? 'bg-red-accent/10 text-red-accent border border-red-accent/30' : 'bg-muted text-brand-blue'}`}>
                {tag}
                {bannedTags.includes(tag) && <span className="text-[9px]">⚠️</span>}
                <button onClick={() => removeHashtag(tag)} className="text-muted-foreground hover:text-red-accent text-[10px]">✕</button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <input
                value={newHashtag}
                onChange={e => setNewHashtag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHashtag()}
                className="w-24 h-7 rounded-lg bg-muted px-2 text-[12px] text-foreground placeholder:text-muted-foreground border-0 outline-none"
                placeholder="+ Add"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={handleSuggestHashtags} disabled={suggesting} className="text-brand-blue text-[11px] font-semibold flex items-center gap-1">
              <Hash size={10} /> {suggesting ? 'Adding...' : t('postEdit.suggestHashtags', '✦ Suggest Hashtags')}
            </button>
            <button onClick={handleCheckBanned} disabled={checkingBanned} className="text-muted-foreground text-[11px] font-semibold flex items-center gap-1">
              <Ban size={10} /> {checkingBanned ? 'Checking...' : t('postEdit.checkBanned', '🚫 Check Banned')}
            </button>
            <span className="text-[11px] text-muted-foreground ms-auto">{hashtags.length}/30</span>
          </div>
        </div>

        {/* Scheduling Section */}
        <div>
          <label className="text-[13px] font-semibold text-foreground mb-2 block">{t('postEdit.schedule', 'Schedule')}</label>
          <div className="bg-card rounded-xl border border-border-light p-3 flex items-center justify-between">
            <span className="text-[13px] text-foreground">📅 {schedDate} · {schedTime}</span>
            <button className="text-brand-blue text-[12px] font-semibold">{t('postEdit.change', 'Change')}</button>
          </div>
        </div>

        {/* Platform Section */}
        <div>
          <label className="text-[13px] font-semibold text-foreground mb-2 block">{t('postEdit.platforms', 'Platforms')}</label>
          <div className="flex items-center gap-2 flex-wrap">
            {platforms.map(pid => {
              const PLogo = platformLogoMap[pid];
              return PLogo ? (
                <div key={pid} className="flex items-center gap-1.5 bg-muted rounded-lg px-3 py-1.5">
                  <PLogo size={16} />
                  <span className="text-[12px] font-medium text-foreground">{pid}</span>
                  <span className="text-[10px] text-green-accent">✅</span>
                </div>
              ) : null;
            })}
            <button onClick={() => setShowPlatformPicker(!showPlatformPicker)} className="h-8 px-3 rounded-lg border border-dashed border-border text-[12px] font-semibold text-brand-blue flex items-center gap-1">
              <Plus size={12} /> {t('postEdit.addPlatform', 'Add Platform')}
            </button>
          </div>
          <AnimatePresence>
            {showPlatformPicker && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 overflow-hidden">
                <div className="grid grid-cols-2 gap-2">
                  {allPlatforms.filter(p => !platforms.includes(p.id)).map(p => (
                    <button key={p.id} onClick={() => togglePlatform(p.id)} className="flex items-center gap-2 bg-card rounded-xl border border-border-light p-3">
                      <p.Logo size={20} />
                      <span className="text-[12px] font-medium text-foreground">{p.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview Toggle */}
        <div>
          <button onClick={() => setShowPreview(!showPreview)} className="text-brand-blue text-[13px] font-semibold">
            {showPreview ? t('postEdit.hidePreview', 'Hide Preview') : t('postEdit.showPreview', '👁️ Preview')}
          </button>
          <AnimatePresence>
            {showPreview && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 overflow-hidden">
                <div className="bg-card rounded-2xl border border-border-light p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {PlatformLogo && <PlatformLogo size={20} />}
                    <span className="text-[13px] font-bold text-foreground">@malekskitchen</span>
                  </div>
                  {hasImage && (
                    <div className="w-full h-[180px] rounded-xl bg-muted mb-3 flex items-center justify-center">
                      <span className="text-[32px]">🖼️</span>
                    </div>
                  )}
                  <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-line">{caption}</p>
                  <p className="text-[12px] text-brand-blue mt-2">{hashtags.join(' ')}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Published note */}
        {isPublished && (
          <p className="text-[11px] text-muted-foreground italic bg-muted rounded-xl p-3">
            {t('postEdit.publishedNote', 'Changes saved locally. Published posts cannot be edited on the platform.')}
          </p>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 start-0 end-0 bg-card border-t border-border-light px-5 py-4 flex items-center justify-between z-50" style={!isMobile ? { maxWidth: 600, margin: '0 auto' } : {}}>
        <button onClick={handleBack} className="text-muted-foreground text-[13px] font-medium">
          {t('common.cancel', 'Cancel')}
        </button>
        <button onClick={handleSave} className="h-11 px-8 rounded-xl gradient-btn text-primary-foreground text-[14px] font-bold btn-press shadow-btn">
          {isPublished ? t('postEdit.saveChanges', 'Save Changes') : t('postEdit.saveSchedule', 'Save & Schedule')}
        </button>
      </div>

      {/* Discard Dialog */}
      <AnimatePresence>
        {showDiscardDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center px-5">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowDiscardDialog(false)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative bg-card rounded-2xl p-6 max-w-[320px] w-full border border-border-light shadow-xl text-center z-10">
              <h3 className="text-[16px] font-bold text-foreground">{t('postEdit.discardTitle', 'Discard changes?')}</h3>
              <p className="text-[13px] text-muted-foreground mt-2">{t('postEdit.discardDesc', 'Your unsaved changes will be lost.')}</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowDiscardDialog(false)} className="flex-1 h-10 rounded-xl border border-border text-[13px] font-semibold text-foreground">
                  {t('postEdit.keepEditing', 'Keep Editing')}
                </button>
                <button onClick={onBack} className="flex-1 h-10 rounded-xl bg-red-accent text-primary-foreground text-[13px] font-bold">
                  {t('postEdit.discard', 'Discard')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
