import { type ChangeEvent, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, ChevronDown, ChevronRight, Calendar as CalendarIcon, FolderOpen } from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, YouTubeLogo, LinkedInLogo, GoogleLogo, PinterestLogo, ThreadsLogo } from '../components/PlatformLogos';
import { toast } from 'sonner';
import { useFreeTier, UpgradePrompt, ContentLockedBanner } from '../components/FreeTier';
import { CalendarTab } from '../components/CalendarTab';
import { MediaLibrary } from '../components/MediaLibrary';
import { PostVariations } from '../components/PostVariations';
import { PostTranslation } from '../components/PostTranslation';
import { HashtagToolbar } from '../components/HashtagToolbar';
import { LinkShortener } from '../components/LinkShortener';
import { ImageResizeNotice } from '../components/ImageResizeNotice';
import { CaptionEditor } from '../components/CaptionEditor';
import { CaptionTemplateEngine } from '../components/CaptionTemplateEngine';
import { IndustryHashtags } from '../components/IndustryHashtags';
import { useSocialAccounts } from '../hooks/useSocialAccounts';
import { useTokens } from '../hooks/useTokens';
import { useCreatePost, type CreatePostInput, type Post } from '../hooks/usePosts';
import type { SocialAccount } from '@/services/social.service';
import type { CalendarPost } from '@/components/CalendarData';
import { getAccessToken } from '@/lib/api-client';

const platforms = [
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

const contentTypes = ['Feed Post', 'Reel', 'Story', 'Carousel'];

const templates = [
  { icon: '⭐', title: 'Product Showcase', desc: 'Highlight a menu item', type: 'Feed Post', prompt: 'Showcase our [menu item] with mouth-watering visuals and a compelling caption' },
  { icon: '⏰', title: 'Limited Offer', desc: 'Time-sensitive promo', type: 'Story', prompt: 'Create urgency around our [offer] — limited time only, drive immediate action' },
  { icon: '🎬', title: 'Behind the Scenes', desc: 'Show your kitchen', type: 'Reel', prompt: 'Take followers behind the scenes of our kitchen — show the passion and process' },
  { icon: '📣', title: 'Announcement', desc: 'New item or event', type: 'Feed Post', prompt: 'Announce our new [item/event] — build excitement and encourage sharing' },
  { icon: '⭐', title: 'Customer Review', desc: 'Share a 5-star review', type: 'Carousel', prompt: 'Feature a glowing customer review with their testimonial and our best dish photos' },
  { icon: '🌙', title: 'Ramadan Special', desc: 'Iftar & Suhoor content', type: 'Reel', prompt: 'Create Ramadan-themed content for our Iftar specials — warm, inviting, family-focused' },
];

const menuTemplates = [
  { icon: '🍗', title: 'Promote: Chicken Shawarma', desc: 'SAR 25', type: 'Feed Post', prompt: 'Create a post promoting our Chicken Shawarma — grilled chicken wrapped with garlic sauce and fresh vegetables, SAR 25' },
  { icon: '🍔', title: 'Promote: Smash Burger', desc: 'SAR 35', type: 'Reel', prompt: 'Create a post promoting our Smash Burger — double beef patties with cheddar cheese and special sauce, SAR 35' },
  { icon: '🍮', title: 'Promote: Kunafa Dessert', desc: 'SAR 18', type: 'Story', prompt: 'Create a post promoting our Kunafa Dessert — traditional kunafa with cream cheese and pistachio, SAR 18' },
];

const tones = ['Professional', 'Casual', 'Fun', 'Urgent', 'Inspirational', 'Bold'];
const goals = ['Brand Awareness', 'Engagement', 'Conversions', 'Promotion', 'Event'];
const durations = ['3 days', '1 week', '2 weeks', '1 month'];

const langOptions = [
  { id: 'saudi', label: 'Saudi 🇸🇦' },
  { id: 'arabic', label: 'Arabic العربية' },
  { id: 'english', label: 'English 🇬🇧' },
  { id: 'other', label: 'Other' },
];

const strategyCalendar = [
  { day: 'Monday', items: [{ platform: 'instagram', type: 'Feed Post' }, { platform: 'tiktok', type: 'Reel' }] },
  { day: 'Tuesday', items: [{ platform: 'instagram', type: 'Story' }, { platform: 'snapchat', type: 'Story' }] },
  { day: 'Wednesday', items: [{ platform: 'tiktok', type: 'Video' }] },
  { day: 'Thursday', items: [{ platform: 'instagram', type: 'Carousel' }, { platform: 'tiktok', type: 'Reel' }] },
  { day: 'Friday', items: [{ platform: 'instagram', type: 'Reel' }, { platform: 'snapchat', type: 'Story' }, { platform: 'facebook', type: 'Post' }] },
  { day: 'Saturday', items: [{ platform: 'instagram', type: 'Story' }] },
  { day: 'Sunday', items: [{ platform: 'tiktok', type: 'Reel' }, { platform: 'instagram', type: 'Feed Post' }] },
];

const PlatformIcon = ({ id, size = 16 }: { id: string; size?: number }) => {
  const p = platforms.find(pl => pl.id === id);
  return p ? <p.Logo size={size} /> : null;
};

function parseMediaUrls(mediaUrls: unknown): string[] {
  if (!mediaUrls) return [];
  if (Array.isArray(mediaUrls)) {
    return mediaUrls.filter((url): url is string => typeof url === 'string' && url.length > 0);
  }
  if (typeof mediaUrls === 'string') {
    try {
      const parsed = JSON.parse(mediaUrls);
      if (Array.isArray(parsed)) {
        return parsed.filter((url): url is string => typeof url === 'string' && url.length > 0);
      }
    } catch {
      return [];
    }
  }
  return [];
}

const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`rounded-3xl px-5 py-[9px] text-[13px] font-semibold transition-all duration-200 whitespace-nowrap ${
    active ? 'bg-brand-blue text-primary-foreground' : 'bg-card text-muted-foreground border border-border'
  }`}>{label}</button>
);

// ── Language selector with max 2 ──
const LangSelector = ({ selected, setSelected }: { selected: string[]; setSelected: (v: string[]) => void }) => {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      if (selected.length <= 1) return;
      setSelected(selected.filter(s => s !== id));
    } else {
      if (selected.length >= 2) { toast('Maximum 2 languages. Deselect one first.'); return; }
      setSelected([...selected, id]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {langOptions.map(l => (
        <Chip key={l.id} label={l.label} active={selected.includes(l.id)} onClick={() => toggle(l.id)} />
      ))}
    </div>
  );
};

function parseMediaUrls(mediaUrls: unknown): string[] {
  if (!mediaUrls) return [];
  if (Array.isArray(mediaUrls)) {
    return mediaUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
  }
  if (typeof mediaUrls === 'string') {
    const trimmedMediaUrls = mediaUrls.trim();
    if (!trimmedMediaUrls) return [];
    try {
      const parsedMediaUrls = JSON.parse(trimmedMediaUrls);
      if (Array.isArray(parsedMediaUrls)) {
        return parsedMediaUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
      }
    } catch {
      return [trimmedMediaUrls];
    }
  }
  return [];
}

function getSafeMediaSrc(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('blob:')) return url;
  if (url.startsWith('/api/media?id=')) return url;
  return null;
}

function revokeObjectUrl(url?: string): void {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

interface UploadedMedia {
  id?: string;
  name: string;
  size: string;
  url?: string;
  localPreview?: string;
}

// ── Media upload area with Library access ──
const MediaUpload = ({ files, add, remove, onOpenLibrary }: { files: UploadedMedia[]; add: () => void; remove: (i: number) => void; onOpenLibrary?: () => void }) => (
  <div className="mt-2">
    {files.length === 0 ? (
      <div className="flex gap-2">
        <button onClick={add} className="flex-1 border-2 border-dashed border-brand-blue/25 rounded-2xl h-[80px] flex flex-col items-center justify-center gap-1 hover:bg-muted/30 transition-colors">
          <Camera size={20} className="text-brand-blue" />
          <span className="text-[12px] font-bold text-brand-blue">📎 Upload</span>
        </button>
        <button onClick={onOpenLibrary} className="flex-1 border-2 border-dashed border-border rounded-2xl h-[80px] flex flex-col items-center justify-center gap-1 hover:bg-muted/30 transition-colors">
          <FolderOpen size={20} className="text-muted-foreground" />
          <span className="text-[12px] font-bold text-muted-foreground">📂 Library</span>
        </button>
      </div>
    ) : (
      <div className="bg-card rounded-2xl p-3 border border-border-light">
        <div className="flex gap-2 overflow-x-auto">
          {files.map((file, i) => {
            const mediaSrc = getSafeMediaSrc(file.localPreview || file.url);
            return (
              <div key={i} className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-xl gradient-hero flex items-center justify-center overflow-hidden">
                  {mediaSrc ? (
                    <img
                      src={mediaSrc}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">📷</span>
                  )}
                </div>
                <button onClick={() => remove(i)} className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-red-accent text-primary-foreground flex items-center justify-center"><X size={10} /></button>
              </div>
            );
          })}
          {files.length < 4 && (
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={add} className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                <span className="text-[20px] text-muted-foreground">+</span>
              </button>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

// ═══════════════════════════════════════
//  QUICK POST MODE
// ═══════════════════════════════════════
interface QuickPostModeProps {
  scheduledDate?: string;
  scheduledTime?: string;
  onScheduled?: () => void;
  onPublish?: (data: CreatePostInput) => Promise<unknown>;
  onUploadMedia?: (file: File) => Promise<{ id: string; url: string }>;
  connectedPlatforms?: SocialAccount[];
  isPublishing?: boolean;
}

const QuickPostMode = ({ scheduledDate, scheduledTime, onScheduled, onPublish, onUploadMedia, connectedPlatforms, isPublishing: externalPublishing }: QuickPostModeProps) => {
  const { t } = useTranslation();
  const { data: socialAccounts } = useSocialAccounts();
  const { data: tokensData } = useTokens();
  const createPost = useCreatePost();

  const availablePlatforms = connectedPlatforms ?? (socialAccounts?.filter(a => a.connected) ?? []);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const [type, setType] = useState('Feed Post');
  const [langs, setLangs] = useState<string[]>(['saudi']);
  const [desc, setDesc] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [mediaFiles, setMediaFiles] = useState<UploadedMedia[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>(scheduledDate ? 'later' : 'now');
  const [schedDate, setSchedDate] = useState(scheduledDate || '');
  const [schedTime, setSchedTime] = useState(scheduledTime || '');
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [showTemplateEngine, setShowTemplateEngine] = useState(false);
  const [currentHashtags, setCurrentHashtags] = useState<string[]>(['#FoodLovers', '#Riyadh', '#SaudiFood', '#ChickenShawarma']);
  const [generatedCaption, setGeneratedCaption] = useState('Discover our signature Chicken Shawarma — marinated for 24 hours, grilled to perfection, and wrapped with fresh vegetables and our secret garlic sauce. 🔥\n\nVisit us today and get 20% off your first order! 🎉');
  const [localIsPublishing, setLocalIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPublishing = externalPublishing ?? localIsPublishing;

  const addMedia = () => {
    if (mediaFiles.length >= 4) return;
    fileInputRef.current?.click();
  };
  const uploadMediaFile = async (file: File): Promise<{ id: string; url: string }> => {
    if (onUploadMedia) {
      return onUploadMedia(file);
    }

    const token = getAccessToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/media', {
      method: 'POST',
      credentials: 'same-origin',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Failed to upload media (HTTP ${response.status})` }));
      throw new Error(error.error ?? 'Upload failed');
    }

    return response.json() as Promise<{ id: string; url: string }>;
  };
  const appendLibraryMedia = (items: { id: string; name: string; size: string }[]) => {
    setMediaFiles(prev => {
      const slots = Math.max(0, 4 - prev.length);
      if (slots === 0) return prev;
      const next = items.slice(0, slots).map(item => ({
        id: item.id,
        name: item.name,
        size: item.size,
        url: `/api/media?id=${item.id}`,
      }));
      return [...prev, ...next];
    });
  };
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const slots = Math.max(0, 4 - mediaFiles.length);
    if (slots === 0) return;
    const selected = files.slice(0, slots);

    for (const file of selected) {
      const tempId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const localPreview = URL.createObjectURL(file);
      const nextMediaItem: UploadedMedia = {
        id: tempId,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        localPreview,
      };
      setMediaFiles(prev => [...prev, nextMediaItem]);

      try {
        const uploaded = await uploadMediaFile(file);
        setMediaFiles(prev => prev.map(item => {
          if (item.id !== tempId) return item;
          revokeObjectUrl(item.localPreview);
          return { ...item, id: uploaded.id, url: uploaded.url, localPreview: undefined };
        }));
      } catch (err: unknown) {
        setMediaFiles(prev => {
          const failedItem = prev.find(item => item.id === tempId);
          revokeObjectUrl(failedItem?.localPreview);
          return prev.filter(item => item.id !== tempId);
        });
        toast.error(err instanceof Error ? err.message : 'Failed to upload media');
      }
    }
    event.target.value = '';
  };
  const removeMedia = (i: number) => {
    setMediaFiles(prev => {
      const item = prev[i];
      revokeObjectUrl(item?.localPreview);
      return prev.filter((_, idx) => idx !== i);
    });
  };
  const { isFree } = useFreeTier();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const handleGenerate = () => {
    if (isFree) { setShowUpgrade(true); return; }
    setLoading(true); setTimeout(() => { setLoading(false); setGenerated(true); setShowVariations(false); }, 2000);
  };
  const selectTemplate = (i: number) => {
    setSelectedTemplate(i);
    const tpl = templates[i];
    setDesc(tpl.prompt);
    const matchedType = contentTypes.find(ct => ct === tpl.type);
    if (matchedType) setType(matchedType);
  };

  const handleSchedulePost = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }
    if (!generatedCaption.trim()) {
      toast.error('No caption to publish');
      return;
    }
    if (externalPublishing === undefined) {
      setLocalIsPublishing(true);
    }
    try {
      const scheduledAt = scheduleMode === 'later' && schedDate
        ? new Date(`${schedDate}T${schedTime || '12:00'}`).toISOString()
        : undefined;
      const uploadedMediaUrls = mediaFiles.map(file => file.url).filter((url): url is string => Boolean(url));
      const payload: CreatePostInput = {
        platform: selectedPlatforms.join(','),
        caption: generatedCaption.trim(),
        hashtags: currentHashtags.join(' ') || undefined,
        mediaUrls: uploadedMediaUrls,
        scheduledAt,
        status: scheduleMode === 'now' ? 'Published' : 'Scheduled',
      };
      const skippedMediaCount = mediaFiles.length - uploadedMediaUrls.length;
      if (skippedMediaCount > 0) {
        toast.warning(`${skippedMediaCount} media item(s) were not uploaded and will be skipped.`);
      }
      if (onPublish) {
        await onPublish(payload);
      } else {
        await createPost.mutateAsync(payload);
      }
      const timeLabel = scheduleMode === 'later' && schedDate ? `${schedDate} ${schedTime || ''}`.trim() : 'now';
      toast.success(`Post scheduled ${scheduleMode === 'now' ? 'for immediate publish' : `for ${timeLabel}`} ✓`, { duration: 2000 });
      setTimeout(() => onScheduled?.(), 500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      if (externalPublishing === undefined) {
        setLocalIsPublishing(false);
      }
    }
  };

  const selectedPlatform = platforms.find(p => selectedPlatforms.includes(p.id)) ?? platforms[0];

  return (
    <>
      {isFree && <ContentLockedBanner />}

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
                  {schedDate ? `📅 ${schedDate} · ${schedTime || 'Pick time'}` : '📅 Pick date & time'}
                </span>
                <button onClick={() => setScheduleMode('now')} className="text-[12px] text-muted-foreground font-medium ml-auto">Publish now</button>
              </div>
              <div className="flex gap-2">
                <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                  className="flex-1 rounded-xl bg-background border border-border px-3 py-2 text-[13px] focus:border-primary focus:outline-none" />
                <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                  className="w-[120px] rounded-xl bg-background border border-border px-3 py-2 text-[13px] focus:border-primary focus:outline-none" />
              </div>
              {/* Smart scheduling recommendation */}
              <button onClick={() => { setSchedTime('20:00'); }}
                className="flex items-center gap-1.5 text-[11px] text-green-accent font-semibold bg-green-soft px-3 py-1.5 rounded-lg w-fit">
                ✦ Recommended by AI: Thursday at 8:00 PM
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* Platform */}
      <Section label="Platform">
        {availablePlatforms.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No platforms connected. Go to Settings to connect your social media accounts.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {availablePlatforms.map(account => {
              const p = platforms.find(pl => pl.id === account.platform);
              if (!p) return null;
              const isSelected = selectedPlatforms.includes(account.platform);
              return (
                <button key={account.platform} onClick={() => togglePlatform(account.platform)}
                  className={`flex items-center gap-2 rounded-3xl px-4 py-2 text-[13px] font-semibold whitespace-nowrap transition-all ${
                    isSelected ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
                  }`}>
                  <p.Logo size={16} />{p.name}
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

      {/* Templates */}
      <Section label="Templates">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {templates.map((tpl, i) => (
            <button key={i} onClick={() => selectTemplate(i)}
              className={`min-w-[150px] bg-card rounded-2xl p-4 text-left flex-shrink-0 transition-all card-tap ${
                selectedTemplate === i ? 'border-2 border-brand-blue shadow-md' : 'border border-border-light'
              }`}>
              <span className="text-2xl">{tpl.icon}</span>
              <h4 className="text-[13px] font-bold text-foreground mt-2">{tpl.title}</h4>
              <p className="text-[11px] text-muted-foreground mt-1">{tpl.desc}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* From Your Menu */}
      <Section label="From Your Menu 🍽️">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {menuTemplates.map((tpl, i) => (
            <button key={`menu-${i}`} onClick={() => { setDesc(tpl.prompt); const matchedType = contentTypes.find(ct => ct === tpl.type); if (matchedType) setType(matchedType); }}
              className="min-w-[150px] bg-card rounded-2xl p-4 text-left flex-shrink-0 transition-all card-tap border border-border-light hover:border-brand-blue">
              <span className="text-2xl">{tpl.icon}</span>
              <h4 className="text-[13px] font-bold text-foreground mt-2">{tpl.title}</h4>
              <p className="text-[11px] text-brand-blue font-semibold mt-1">{tpl.desc}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Media with Library access */}
      <Section label="Upload Media">
        <MediaUpload files={mediaFiles} add={addMedia} remove={removeMedia} onOpenLibrary={() => setShowMediaLibrary(true)} />
        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileUpload} />
        {/* Image resize notice */}
        <ImageResizeNotice selectedPlatforms={selectedPlatforms} hasImage={mediaFiles.length > 0} />
      </Section>

      {/* Description */}
      <Section label="What&apos;s this post about?">
        <div className="flex gap-2 items-center mb-2">
          <button onClick={() => setShowTemplateEngine(true)} className="text-[12px] font-bold text-brand-blue bg-brand-blue/10 px-3 py-1.5 rounded-lg">✦ Help Me Write</button>
        </div>
        <textarea value={desc} onChange={e => setDesc(e.target.value)}
          className="w-full min-h-[80px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none"
          placeholder="e.g., Promote our weekend Shawarma special with 20% off..." />
        <p className="text-[11px] text-muted-foreground mt-1">✦ Uses 3 {t('common.tokens')} · {tokensData?.balance ?? 142} remaining</p>
        {/* Link detection */}
        <LinkShortener caption={desc} />
      </Section>

      {/* Language */}
      <Section label="Language">
        <LangSelector selected={langs} setSelected={setLangs} />
        <p className="text-[11px] text-muted-foreground mt-1.5">Select 1-2 languages for your content</p>
      </Section>

      {/* Generate — also opens template engine */}
      <button onClick={() => setShowTemplateEngine(true)}
        className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press mt-5">
        ✦ AI Write
      </button>

      {/* Template Engine Modal */}
      <CaptionTemplateEngine
        open={showTemplateEngine}
        onClose={() => setShowTemplateEngine(false)}
        onUseCaption={(caption) => {
          setDesc(caption);
          setGenerated(false);
          setGeneratedCaption(caption);
          setTimeout(() => setGenerated(true), 300);
        }}
      />

      {/* Generated Output */}
      <AnimatePresence>
        {generated && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <h2 className="text-[18px] font-bold text-foreground">Generated Content</h2>

            {mediaFiles.length > 0 && (
              <div className="bg-purple-soft rounded-2xl p-3 mt-2 mb-3">
                <p className="text-[13px] text-purple font-medium">✦ I&apos;ve analyzed your photo and created content optimized for {selectedPlatform?.name} {type} format.</p>
              </div>
            )}

            <div className="bg-card rounded-3xl p-5 shadow-card border border-border-light mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedPlatform && <selectedPlatform.Logo size={20} />}
                  <span className="text-[13px] font-semibold text-foreground">{selectedPlatform?.name} · {type}</span>
                </div>
                <span className="text-[11px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">Brand Match 94%</span>
              </div>

              {mediaFiles.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {mediaFiles.map((file, i) => {
                    const mediaSrc = getSafeMediaSrc(file.localPreview || file.url);
                    return (
                      <div key={i} className="w-16 h-16 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {mediaSrc ? (
                          <img
                            src={mediaSrc}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">📷</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <CaptionEditor caption={generatedCaption} onUpdate={setGeneratedCaption} />

              {/* Hashtag toolbar */}
              <HashtagToolbar hashtags={currentHashtags} onUpdate={setCurrentHashtags} />
              <IndustryHashtags industry="restaurant" existingTags={currentHashtags} onAdd={(tag) => setCurrentHashtags(prev => [...prev, tag])} />

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <button onClick={handleSchedulePost} disabled={isPublishing || selectedPlatforms.length === 0} className="flex-1 h-12 rounded-2xl gradient-btn text-primary-foreground text-[14px] font-bold btn-press disabled:opacity-50">
                  {isPublishing ? 'Publishing...' : 'Schedule Post'}
                </button>
                <button onClick={() => { setGenerated(false); setTimeout(() => { setGenerated(true); }, 100); }}
                  className="h-12 px-5 rounded-2xl border border-border text-muted-foreground text-[14px] font-medium btn-press">Regenerate</button>
              </div>

              {/* New: Variations + Translation buttons */}
              <div className="flex gap-2 mt-2">
                <button onClick={() => setShowVariations(true)}
                  className="flex-1 h-10 rounded-xl border border-brand-blue/30 text-brand-blue text-[13px] font-medium btn-press">
                  ✦ Generate Variations
                </button>
                <PostTranslation currentLang="en" onUseTranslation={(caption, hashtags) => {
                  setGeneratedCaption(caption);
                  setCurrentHashtags(hashtags.split(' '));
                  toast.success('Translation applied ✓');
                }} />
              </div>
            </div>

            {/* Variations */}
            {showVariations && (
              <PostVariations onSelectVariation={(caption, hashtags) => {
                setGeneratedCaption(caption);
                setCurrentHashtags(hashtags.split(' '));
                toast.success('Variation selected ✓');
              }} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Library Modal */}
      <AnimatePresence>
        {showMediaLibrary && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMediaLibrary(false)} className="fixed inset-0 bg-foreground/30 z-50" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl max-h-[85vh] overflow-y-auto p-5">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
              <MediaLibrary mode="picker" multiSelect onSelect={(items) => {
                appendLibraryMedia(items.map(item => ({ id: item.id, name: item.name, size: item.size })));
                setShowMediaLibrary(false);
                toast.success(`${items.length} media added`);
              }} onClose={() => setShowMediaLibrary(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <UpgradePrompt feature="AI Content Generation" benefit="generate unlimited AI content" open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
};

// ═══════════════════════════════════════
//  STRATEGY MODE
// ═══════════════════════════════════════
const contentPillars = ['Product Showcase', 'Behind the Scenes', 'Customer Stories', 'Promotions & Deals', 'Educational Tips', 'Seasonal Content', 'Team & Culture', 'User-Generated Content'];
const successIndicators = ['Reach', 'Engagement Rate', 'Follower Growth', 'Website Clicks', 'Orders', 'Revenue', 'Brand Awareness'];

const StrategyMode = ({ onPreviewInCalendar }: { onPreviewInCalendar?: () => void }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('Brand Awareness');
  const [duration, setDuration] = useState('1 week');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'tiktok', 'snapchat']);
  const [tone, setTone] = useState('Professional');
  const [langs, setLangs] = useState<string[]>(['saudi']);
  const [desc, setDesc] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [mediaFiles, setMediaFiles] = useState<{ name: string; size: string }[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedPillars, setSelectedPillars] = useState<string[]>(['Product Showcase']);
  const [targetAudience, setTargetAudience] = useState('Families in Riyadh, young professionals 22-35');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['Reach', 'Engagement Rate']);

  const togglePillar = (p: string) => {
    if (selectedPillars.includes(p)) setSelectedPillars(ps => ps.filter(x => x !== p));
    else if (selectedPillars.length < 4) setSelectedPillars(ps => [...ps, p]);
  };
  const toggleIndicator = (ind: string) => {
    if (selectedIndicators.includes(ind)) setSelectedIndicators(is => is.filter(x => x !== ind));
    else if (selectedIndicators.length < 3) setSelectedIndicators(is => [...is, ind]);
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };
  const addMedia = () => { if (mediaFiles.length < 4) setMediaFiles(p => [...p, { name: `photo_${p.length + 1}.jpg`, size: '2.4 MB' }]); };
  const removeMedia = (i: number) => setMediaFiles(p => p.filter((_, idx) => idx !== i));
  const { isFree: isFreeStrategy } = useFreeTier();
  const [showUpgradeStrategy, setShowUpgradeStrategy] = useState(false);
  const handleGenerate = () => {
    if (isFreeStrategy) { setShowUpgradeStrategy(true); return; }
    setLoading(true); setTimeout(() => { setLoading(false); setGenerated(true); }, 2500);
  };
  const selectTemplate = (i: number) => {
    setSelectedTemplate(i);
    setDesc(templates[i].prompt.replace('our [menu item]', 'our best menu items'));
  };

  const totalPosts = strategyCalendar.reduce((sum, d) => sum + d.items.length, 0);

  return (
    <>
      {/* Strategy Name */}
      <Section label="Strategy Name">
        <input value={name} onChange={e => setName(e.target.value)}
          className="w-full rounded-2xl bg-card border border-border px-4 py-3 text-[14px] focus:border-primary focus:outline-none"
          placeholder="e.g., Ramadan Content Plan, Weekend Brunch Push" />
      </Section>

      {/* Goal */}
      <Section label="Goal">
        <div className="flex flex-wrap gap-2">
          {goals.map(g => <Chip key={g} label={g} active={goal === g} onClick={() => setGoal(g)} />)}
        </div>
      </Section>

      {/* Content Pillars */}
      <Section label="Content Pillars">
        <div className="flex flex-wrap gap-2">
          {contentPillars.map(p => <Chip key={p} label={p} active={selectedPillars.includes(p)} onClick={() => togglePillar(p)} />)}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">Select 1-4 themes for your content</p>
      </Section>

      {/* Target Audience */}
      <Section label="Target Audience">
        <input value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
          className="w-full rounded-2xl bg-card border border-border px-4 py-3 text-[14px] focus:border-primary focus:outline-none"
          placeholder="e.g., Families in Riyadh, young professionals 22-35" />
        <p className="text-[11px] text-muted-foreground mt-1">Pre-filled from your profile</p>
      </Section>

      {/* Success Indicators */}
      <Section label="How will you measure success?">
        <div className="flex flex-wrap gap-2">
          {successIndicators.map(ind => <Chip key={ind} label={ind} active={selectedIndicators.includes(ind)} onClick={() => toggleIndicator(ind)} />)}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">Select 1-3 indicators</p>
      </Section>

      {/* Duration */}
      <Section label="Duration">
        <div className="flex flex-wrap gap-2">
          {durations.map(d => <Chip key={d} label={d} active={duration === d} onClick={() => setDuration(d)} />)}
        </div>
      </Section>

      {/* Platforms (multi-select) */}
      <Section label="Platforms">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {platforms.map(p => (
            <button key={p.id} onClick={() => togglePlatform(p.id)}
              className={`flex items-center gap-2 rounded-3xl px-4 py-2 text-[13px] font-semibold whitespace-nowrap transition-all ${
                selectedPlatforms.includes(p.id) ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}>
              <p.Logo size={16} />{p.name}
            </button>
          ))}
        </div>
      </Section>

      {/* Templates */}
      <Section label="Templates">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {templates.map((tpl, i) => (
            <button key={i} onClick={() => selectTemplate(i)}
              className={`min-w-[150px] bg-card rounded-2xl p-4 text-left flex-shrink-0 transition-all card-tap ${
                selectedTemplate === i ? 'border-2 border-brand-blue shadow-md' : 'border border-border-light'
              }`}>
              <span className="text-2xl">{tpl.icon}</span>
              <h4 className="text-[13px] font-bold text-foreground mt-2">{tpl.title}</h4>
              <p className="text-[11px] text-muted-foreground mt-1">{tpl.desc}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Tone */}
      <Section label="Tone">
        <div className="flex flex-wrap gap-2">
          {tones.map(to => <Chip key={to} label={to} active={tone === to} onClick={() => setTone(to)} />)}
        </div>
      </Section>

      {/* Language */}
      <Section label="Language">
        <LangSelector selected={langs} setSelected={setLangs} />
        <p className="text-[11px] text-muted-foreground mt-1.5">Select 1-2 languages for your content</p>
      </Section>

      {/* Media (optional) */}
      <Section label="Upload Media (optional)">
        <MediaUpload files={mediaFiles} add={addMedia} remove={removeMedia} />
      </Section>

      {/* Description */}
      <Section label="Describe your strategy goal">
        <textarea value={desc} onChange={e => setDesc(e.target.value)}
          className="w-full min-h-[80px] rounded-2xl bg-card border border-border p-4 text-[14px] focus:border-primary focus:outline-none resize-none"
          placeholder="e.g., Generate buzz around our new Iftar menu..." />
      </Section>

      {/* Generate Strategy */}
      <button onClick={handleGenerate} disabled={loading}
        className={`w-full h-[60px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[16px] shadow-btn btn-press mt-5 ${loading ? 'opacity-80' : ''}`}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>✦</motion.span>
            Building your strategy...
          </span>
        ) : '✦ Generate Full Strategy'}
      </button>

      {/* Generated Strategy */}
      <AnimatePresence>
        {generated && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            {/* Summary */}
            <div className="bg-card rounded-3xl p-5 shadow-card border border-border-light">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">✦ Strategy Ready</span>
              </div>
              <h3 className="text-[16px] font-bold text-foreground">{duration} strategy · {selectedPlatforms.length} platforms · {totalPosts} posts total</h3>
              <p className="text-[13px] text-muted-foreground mt-1">Est. reach: 45K · Est. engagement: 2,800</p>
              {selectedPillars.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedPillars.map(p => <span key={p} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-soft text-purple">{p}</span>)}
                </div>
              )}
              {selectedIndicators.length > 0 && (
                <p className="text-[12px] text-muted-foreground mt-2">Success Indicators: {selectedIndicators.join(', ')}</p>
              )}
            </div>

            {/* Calendar */}
            <div>
              <h3 className="text-[16px] font-bold text-foreground mb-3">Content Calendar</h3>
              <div className="space-y-2">
                {strategyCalendar.map(day => (
                  <div key={day.day} className="bg-card rounded-2xl border border-border-light overflow-hidden">
                    <button onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                      className="w-full flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-bold text-foreground w-24">{day.day}</span>
                        <div className="flex items-center gap-1.5">
                          {day.items.map((item, i) => <PlatformIcon key={i} id={item.platform} size={18} />)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-muted-foreground">{day.items.length} post{day.items.length > 1 ? 's' : ''}</span>
                        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${expandedDay === day.day ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedDay === day.day && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border-light">
                          {day.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border-light last:border-0">
                              <PlatformIcon id={item.platform} size={20} />
                              <div className="flex-1">
                                <span className="text-[13px] font-semibold text-foreground">{platforms.find(p => p.id === item.platform)?.name} — {item.type}</span>
                                <p className="text-[12px] text-muted-foreground mt-0.5">AI-generated content ready for review</p>
                              </div>
                              <ChevronRight size={14} className="text-muted-foreground" />
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button className="w-full h-[56px] rounded-2xl gradient-btn text-primary-foreground font-bold text-[15px] shadow-btn btn-press">
                Approve All & Schedule
              </button>
              {/* Preview in Calendar */}
              <button onClick={onPreviewInCalendar}
                className="w-full h-[48px] rounded-2xl border border-brand-blue text-brand-blue text-[14px] font-bold btn-press flex items-center justify-center gap-2">
                <CalendarIcon size={16} /> Preview in Calendar
              </button>
              <button className="w-full h-[48px] rounded-2xl border border-border text-foreground text-[14px] font-medium btn-press">
                Edit Plan
              </button>
              <button onClick={() => { setGenerated(false); setTimeout(() => setGenerated(true), 100); }}
                className="w-full text-center text-[13px] text-muted-foreground font-medium py-2">
                Regenerate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <UpgradePrompt feature="AI Strategy Planning" benefit="generate unlimited AI content strategies" open={showUpgradeStrategy} onClose={() => setShowUpgradeStrategy(false)} />
    </>
  );
};

// ── Section helper ──
const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mt-5">
    <label className="text-[16px] font-bold text-foreground">{label}</label>
    <div className="mt-2">{children}</div>
  </div>
);

// ═══════════════════════════════════════
//  MAIN CREATE SCREEN
// ═══════════════════════════════════════
interface CreateScreenProps {
  posts?: Post[];
  postsLoading?: boolean;
  onPublish?: (data: CreatePostInput) => Promise<unknown>;
  onUploadMedia?: (file: File) => Promise<{ id: string; url: string }>;
  connectedPlatforms?: SocialAccount[];
  onDeletePost?: (postId: string) => Promise<void>;
  isPublishing?: boolean;
}

function mapPostToCalendarPost(post: Post): (CalendarPost & { day?: number }) | null {
  const date = post.scheduledAt ? new Date(post.scheduledAt) : new Date(post.createdAt);
  if (Number.isNaN(date.getTime())) return null;
  const mediaUrls = parseMediaUrls(post.mediaUrls);

  const status = post.status.toLowerCase();
  const normalizedStatus = status === 'scheduled' || status === 'draft' || status === 'published' || status === 'failed'
    ? status
    : 'draft';

  return {
    id: post.id,
    day: date.getDate(),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    platform: post.platform.split(',')[0]?.trim() || 'instagram',
    title: post.caption.slice(0, 40) || 'Post',
    type: 'Post',
    status: normalizedStatus,
    caption: post.caption,
    hashtags: post.hashtags ?? undefined,
    mediaUrls,
  };
}

export const CreateScreen = ({ posts, postsLoading, onPublish, onUploadMedia, connectedPlatforms, onDeletePost, isPublishing }: CreateScreenProps = {}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'calendar' | 'quick' | 'strategy' | 'media'>('calendar');
  const [quickPostDate, setQuickPostDate] = useState<string | undefined>();
  const [quickPostTime, setQuickPostTime] = useState<string | undefined>();

  const handleCreatePost = (date?: string, time?: string) => {
    setQuickPostDate(date);
    setQuickPostTime(time);
    setMode('quick');
  };

  const handleCreateStrategy = () => {
    setMode('strategy');
  };

  const handlePreviewInCalendar = () => {
    setMode('calendar');
  };

  const handlePostScheduled = () => {
    setMode('calendar');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">{t('create.title')}</h1>
        <p className="text-[14px] text-muted-foreground mt-1">{t('create.subtitle')}</p>

        {/* Segmented Control — 4 tabs */}
        <div className="mt-5 bg-card rounded-2xl p-1 flex border border-border-light">
          {([
            { key: 'calendar' as const, label: '📅 Calendar' },
            { key: 'quick' as const, label: 'Quick Post' },
            { key: 'strategy' as const, label: 'Strategy' },
            { key: 'media' as const, label: '📁 Media' },
          ]).map(m => (
            <button key={m.key} onClick={() => setMode(m.key)}
              className={`flex-1 py-3 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                mode === m.key ? 'bg-brand-blue text-primary-foreground shadow-sm' : 'text-muted-foreground'
              }`}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Mode Content */}
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: mode === 'calendar' ? -20 : mode === 'quick' ? 0 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="mt-4">
            {mode === 'calendar' && (
              <CalendarTab
                onCreatePost={handleCreatePost}
                onCreateStrategy={handleCreateStrategy}
                strategyPosts={posts?.map(mapPostToCalendarPost).filter((post): post is CalendarPost & { day?: number } => post !== null)}
                postsLoading={postsLoading}
                onDeletePost={onDeletePost ? (post) => onDeletePost(post.id) : undefined}
              />
            )}
            {mode === 'quick' && (
              <QuickPostMode
                scheduledDate={quickPostDate}
                scheduledTime={quickPostTime}
                onScheduled={handlePostScheduled}
                onPublish={onPublish}
                onUploadMedia={onUploadMedia}
                connectedPlatforms={connectedPlatforms}
                isPublishing={isPublishing}
              />
            )}
            {mode === 'strategy' && (
              <StrategyMode onPreviewInCalendar={handlePreviewInCalendar} />
            )}
            {mode === 'media' && (
              <MediaLibrary mode="tab" onSelect={(items) => {
                setMode('quick');
                toast.success(`${items.length} media selected — opening Quick Post`);
              }} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
