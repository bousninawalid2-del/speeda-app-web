import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronRight, ChevronLeft, Search, MessageSquare, Globe, TrendingUp, BarChart3, Sparkles, Zap, PenSquare, Bell, Settings, Globe2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MosScoreRing } from '../components/MosScoreRing';
import { InstagramLogo, TikTokLogo, SnapchatLogo, FacebookLogo, XLogo, GoogleLogo } from '../components/PlatformLogos';
import { useIsMobile } from '../hooks/use-mobile';
import { FreePlanBadge, TrialBanner } from '../components/FreeTier';
import { SalesAgent } from '../components/SalesAgent';
import { ContentSuggestions } from '../components/ContentSuggestions';
import { useAuth } from '../contexts/AuthContext';
import { useTokens } from '../hooks/useTokens';
import { useAnalytics } from '../hooks/useAnalytics';
import { useSocialAccounts } from '../hooks/useSocialAccounts';
import { useSubscription } from '../hooks/useSubscription';
import { usePosts } from '../hooks/usePosts';

const MOS_TOOLTIP_KEY = 'speeda_mos_tooltip_shown';

const TappableMosRing = ({ size, score, onTap }: { size: number; score: number; onTap: () => void }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(MOS_TOOLTIP_KEY)) return;
    const showTimer = setTimeout(() => setShowTooltip(true), 1000);
    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
      localStorage.setItem(MOS_TOOLTIP_KEY, '1');
    }, 4000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  const handleTap = () => {
    setShowTooltip(false);
    localStorage.setItem(MOS_TOOLTIP_KEY, '1');
    onTap();
  };

  return (
    <div className="relative">
      <motion.button
        onClick={handleTap}
        className="relative cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MosScoreRing score={score} size={size} />
      </motion.button>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 whitespace-nowrap"
          >
            <div className="bg-[#1a1a2e] text-primary-foreground text-[12px] px-3 py-1.5 rounded-lg relative">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a2e] rotate-45" />
              Tap to see your score details ›
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Strategy card type
interface StrategyCard {
  id: number;
  priority: string;
  color: string;
  title: string;
  desc: string;
  impact: string;
  impactIcon: string;
  nav: string;
}

// Completion card shown when all cards are dismissed
const CompletionCard = ({ doneCount, totalCount }: { doneCount: number; totalCount: number }) => {
  const allDone = doneCount === totalCount;
  const allSkipped = doneCount === 0;

  if (allDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="gradient-hero rounded-3xl p-6 relative overflow-hidden"
      >
        {/* Sparkles */}
        {['top-3 left-6', 'top-5 right-8', 'bottom-4 left-10', 'bottom-3 right-12'].map((pos, i) => (
          <motion.span
            key={i}
            className={`absolute ${pos} text-primary-foreground/60 text-[14px]`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
            transition={{ duration: 1.5, delay: i * 0.2, repeat: 1 }}
          >✦</motion.span>
        ))}
        <p className="text-[16px] font-bold text-primary-foreground text-center relative z-10">✦ All actions completed! Great job today.</p>
        <div className="flex justify-center mt-3 relative z-10">
          <span className="bg-primary-foreground/20 text-primary-foreground text-[12px] font-bold px-3 py-1 rounded-lg">🔥 Streak +1</span>
        </div>
      </motion.div>
    );
  }

  if (allSkipped) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-muted rounded-3xl p-6"
      >
        <p className="text-[14px] text-muted-foreground text-center">No actions for today. Your AI will prepare new recommendations tomorrow.</p>
      </motion.div>
    );
  }

  // Mix
  const pct = (doneCount / totalCount) * 100;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-purple-soft rounded-3xl p-6"
    >
      <p className="text-[15px] font-bold text-foreground text-center">✦ You completed {doneCount} out of {totalCount} actions today. Nice work!</p>
      <div className="h-2.5 rounded-full bg-border mt-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className="h-full gradient-btn rounded-full"
        />
      </div>
    </motion.div>
  );
};

// Desktop horizontal scrollable strategy cards with arrow buttons
const DesktopStrategyScroller = ({ cards, onDismiss, onDoAction, pendingDoneId, t }: {
  cards: StrategyCard[];
  onDismiss: (id: number, action: 'do' | 'skip') => void;
  onDoAction: (card: StrategyCard) => void;
  pendingDoneId: number | null;
  t: any;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [flashingId, setFlashingId] = useState<number | null>(null);
  const [checkId, setCheckId] = useState<number | null>(null);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => { updateArrows(); }, [cards]);

  // Trigger success animation when pendingDoneId matches a card
  useEffect(() => {
    if (pendingDoneId === null) return;
    const card = cards.find(c => c.id === pendingDoneId);
    if (!card) return;
    setFlashingId(card.id);
    setTimeout(() => {
      setFlashingId(null);
      setCheckId(card.id);
      setTimeout(() => {
        setCheckId(null);
        onDismiss(card.id, 'do');
      }, 400);
    }, 200);
  }, [pendingDoneId]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <div className="relative mt-3 group">
      {showLeft && (
        <button onClick={() => scroll(-1)} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card border border-border-light shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronLeft size={18} className="text-foreground" />
        </button>
      )}
      {showRight && (
        <button onClick={() => scroll(1)} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card border border-border-light shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight size={18} className="text-foreground" />
        </button>
      )}
      <div ref={scrollRef} onScroll={updateArrows} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
        <AnimatePresence mode="popLayout">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60, transition: { duration: 0.3 } }}
              transition={{ layout: { duration: 0.2 } }}
              className="bg-card rounded-3xl p-6 shadow-card border border-border-light desktop-hover shrink-0 relative overflow-hidden"
              style={{ width: 320, scrollSnapAlign: 'start' }}
            >
              {/* Green flash overlay */}
              <AnimatePresence>
                {flashingId === card.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-green-accent z-10 rounded-3xl"
                  />
                )}
              </AnimatePresence>
              {/* Checkmark */}
              <AnimatePresence>
                {checkId === card.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="absolute inset-0 flex items-center justify-center z-20"
                  >
                    <span className="text-[48px] text-green-accent">✓</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <span className={`text-[10px] font-bold uppercase tracking-[0.05em] text-primary-foreground px-3 py-1 rounded-lg ${card.color}`}>{card.priority}</span>
              <h3 className="text-[16px] font-bold text-foreground mt-3">{card.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-[1.5] mt-2">{card.desc}</p>
              <p className="text-[12px] font-semibold text-green-accent mt-3">{card.impactIcon} Est. impact: {card.impact}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => onDoAction(card)} className="flex-1 h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press hover:brightness-105 transition-all">✓ Do It</button>
                <button onClick={() => onDismiss(card.id, 'skip')} className="h-10 px-3 rounded-xl border border-border text-muted-foreground text-[12px] font-medium btn-press hover:bg-muted transition-colors">✗ Skip</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Mobile horizontal swipeable strategy cards with peek + nudge + swipe dismiss
const MobileStrategyCards = ({ cards, onDismiss, onDoAction, pendingDoneId, t }: {
  cards: StrategyCard[];
  onDismiss: (id: number, action: 'do' | 'skip') => void;
  onDoAction: (card: StrategyCard) => void;
  pendingDoneId: number | null;
  t: any;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [nudged, setNudged] = useState(false);
  const [flashingId, setFlashingId] = useState<number | null>(null);
  const [checkId, setCheckId] = useState<number | null>(null);

  useEffect(() => {
    if (nudged || cards.length === 0) return;
    const timer = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ left: 30, behavior: 'smooth' });
      setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 300);
      setNudged(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [nudged, cards.length]);

  // Trigger success animation when pendingDoneId matches a card
  useEffect(() => {
    if (pendingDoneId === null) return;
    const card = cards.find(c => c.id === pendingDoneId);
    if (!card) return;
    setFlashingId(card.id);
    setTimeout(() => {
      setFlashingId(null);
      setCheckId(card.id);
      setTimeout(() => {
        setCheckId(null);
        onDismiss(card.id, 'do');
      }, 400);
    }, 200);
  }, [pendingDoneId]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth || 280;
    const idx = Math.round(el.scrollLeft / (cardWidth + 12));
    setActiveIdx(Math.min(idx, cards.length - 1));
  };

  const handleSwipeEnd = (card: StrategyCard, info: PanInfo) => {
    if (info.offset.x < -80) {
      onDismiss(card.id, 'skip');
    } else if (info.offset.x > 80) {
      onDoAction(card);
    }
  };

  return (
    <div className="mt-3">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth -mx-5 px-5"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        <AnimatePresence mode="popLayout">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              layout
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => handleSwipeEnd(card, info)}
              initial={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -200, transition: { duration: 0.3 } }}
              transition={{ layout: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className="bg-card rounded-3xl p-5 shadow-card border border-border-light shrink-0 relative overflow-hidden touch-pan-y"
              style={{ width: 'calc(85vw - 40px)', maxWidth: 340, scrollSnapAlign: 'start' }}
            >
              {/* Green flash overlay */}
              <AnimatePresence>
                {flashingId === card.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-green-accent z-10 rounded-3xl"
                  />
                )}
              </AnimatePresence>
              {/* Checkmark */}
              <AnimatePresence>
                {checkId === card.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="absolute inset-0 flex items-center justify-center z-20"
                  >
                    <span className="text-[48px] text-green-accent">✓</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <span className={`text-[10px] font-bold uppercase tracking-[0.05em] text-primary-foreground px-3 py-1 rounded-lg ${card.color}`}>{card.priority}</span>
              <h3 className="text-[17px] font-bold text-foreground mt-3">{card.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-[1.5] mt-1.5">{card.desc}</p>
              <p className="text-[12px] font-semibold text-green-accent mt-2">{card.impactIcon} Est. impact: {card.impact}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => onDoAction(card)} className="flex-1 h-11 rounded-2xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">✓ Do It</button>
                <button onClick={() => onDismiss(card.id, 'skip')} className="h-11 px-4 rounded-2xl border border-border text-muted-foreground text-[13px] font-medium btn-press">✗ Skip</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {cards.length > 0 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {cards.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIdx ? 'bg-brand-blue' : 'bg-border'}`} />
          ))}
        </div>
      )}
    </div>
  );
};

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  pendingActionCardId?: number | null;
  onClearPendingAction?: () => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatFollowerCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export const HomeScreen = ({ onNavigate, pendingActionCardId, onClearPendingAction }: HomeScreenProps) => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: tokensData } = useTokens();
  const { data: analyticsData } = useAnalytics();
  const { data: socialAccounts } = useSocialAccounts();
  const { data: subData } = useSubscription();
  const { data: postsData } = usePosts();

  const [briefingDismissed, setBriefingDismissed] = useState(false);

  // Dynamic data from APIs
  const displayName = user?.name?.split(' ')[0] ?? 'there';
  const tokenCount = tokensData?.balance ?? 0;
  const tokenLow = tokenCount < 50;
  const mosScore = analyticsData?.mosScore ?? 0;
  const totalFollowers = socialAccounts?.reduce((sum, a) => sum + (a.followers ?? 0), 0) ?? 0;
  const connectedPlatforms = socialAccounts?.filter(a => a.connected) ?? [];
  const connectedCount = connectedPlatforms.length;
  const disconnectedAccounts = socialAccounts?.filter(a => !a.connected) ?? [];

  // Posts stats
  const scheduledPosts = postsData?.posts?.filter(p => p.status === 'Scheduled').length ?? 0;
  const currentPlan = subData?.subscription?.plan?.name?.toLowerCase() ?? (subData?.trial?.active ? 'trial' : 'free');
  const tokensUsed = tokensData?.used ?? 0;
  const tokensTotal = tokensData?.total ?? 500;

  // Build strategy cards dynamically based on real state
  const initialCards: StrategyCard[] = [];
  let cardId = 1;

  // If platforms disconnected — critical action
  if (disconnectedAccounts.length > 0) {
    initialCards.push({
      id: cardId++, priority: t('strategy.critical'), color: 'bg-red-accent',
      title: `Reconnect ${disconnectedAccounts[0].platform}`,
      desc: `Your ${disconnectedAccounts[0].platform} account is disconnected. Reconnect to keep publishing.`,
      impact: 'Restore publishing', impactIcon: '🔗', nav: 'social',
    });
  }

  // If no posts scheduled — suggest creating one
  if (scheduledPosts === 0) {
    initialCards.push({
      id: cardId++, priority: t('strategy.high'), color: 'bg-orange-accent',
      title: t('strategy.postPeak'), desc: t('strategy.postPeakDesc'),
      impact: '+40% reach', impactIcon: '📈', nav: 'create',
    });
  }

  // If tokens low — suggest buying more
  if (tokenLow) {
    initialCards.push({
      id: cardId++, priority: t('strategy.high'), color: 'bg-orange-accent',
      title: 'Top up your AI tokens',
      desc: `You have ${tokenCount} tokens left. Buy more to keep creating content.`,
      impact: 'Uninterrupted AI', impactIcon: '✦', nav: 'tokens-packs',
    });
  }

  // If no platforms connected — connect some
  if (connectedCount === 0) {
    initialCards.push({
      id: cardId++, priority: t('strategy.critical'), color: 'bg-red-accent',
      title: 'Connect your social media',
      desc: 'Connect at least one platform to start publishing content and tracking analytics.',
      impact: 'Enable publishing', impactIcon: '🔗', nav: 'social',
    });
  }

  // Always suggest content creation
  initialCards.push({
    id: cardId++, priority: t('strategy.recommended'), color: 'bg-brand-blue',
    title: t('strategy.postPeak'), desc: t('strategy.postPeakDesc'),
    impact: '+40% reach', impactIcon: '📈', nav: 'create',
  });

  // Cap at 5 cards
  const cappedCards = initialCards.slice(0, 5);

  const [activeCards, setActiveCards] = useState<StrategyCard[]>(cappedCards);
  const [doneCount, setDoneCount] = useState(0);
  const [pendingDoneId, setPendingDoneId] = useState<number | null>(null);
  const totalCount = cappedCards.length;

  const handleDismiss = useCallback((id: number, action: 'do' | 'skip') => {
    if (action === 'do') setDoneCount(c => c + 1);
    setActiveCards(prev => prev.filter(c => c.id !== id));
    setPendingDoneId(null);
    onClearPendingAction?.();
  }, [onClearPendingAction]);

  const handleDoAction = useCallback((card: StrategyCard) => {
    onNavigate(`__doaction__${card.id}__${card.nav}`);
  }, [onNavigate]);

  // When user returns to Home after a "Do It" navigation, trigger success animation after 2s
  useEffect(() => {
    if (pendingActionCardId == null) return;
    const timer = setTimeout(() => {
      setPendingDoneId(pendingActionCardId);
      onClearPendingAction?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [pendingActionCardId, onClearPendingAction]);

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang);
    setLangMenuOpen(false);
  };


  // Desktop layout
  if (!isMobile) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="bg-background min-h-full pb-8">
        <div className="px-8 pt-6">
          {/* Disconnected Platform Warning */}
          {disconnectedAccounts.length > 0 && (
            <div className="mb-4 bg-red-accent/10 border border-red-accent/30 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-accent/20 flex items-center justify-center text-lg flex-shrink-0">🔴</div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-foreground">Platform Disconnected</p>
                <p className="text-[12px] text-muted-foreground">{disconnectedAccounts.map(a => a.platform).join(', ')} needs to be reconnected</p>
              </div>
              <button onClick={() => onNavigate('social')} className="text-[12px] font-bold text-brand-blue bg-brand-blue/10 px-3 py-1.5 rounded-lg whitespace-nowrap">Reconnect Now</button>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card rounded-2xl border border-border-light p-4 flex flex-col items-center">
              <MosScoreRing score={mosScore} size={64} />
              <p className="text-[11px] text-muted-foreground font-medium mt-2">MOS Score</p>
            </div>
            <div className="bg-card rounded-2xl border border-border-light p-4 flex flex-col justify-center">
              <p className="text-[22px] font-extrabold text-foreground">{tokenCount}</p>
              <p className="text-[11px] text-muted-foreground">Tokens left</p>
            </div>
            <div className="bg-card rounded-2xl border border-border-light p-4 flex flex-col justify-center">
              <p className="text-[22px] font-extrabold text-foreground">{connectedCount}</p>
              <p className="text-[11px] text-muted-foreground">Platforms</p>
            </div>
            <div className="bg-card rounded-2xl border border-border-light p-4 flex flex-col justify-center">
              <p className="text-[22px] font-extrabold text-foreground">{scheduledPosts}</p>
              <p className="text-[11px] text-muted-foreground">Queued posts</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <h2 className="text-[18px] font-bold text-foreground">{t('home.quickActions')}</h2>
            <div className="grid grid-cols-4 gap-3 mt-3">
              {[
                { icon: PenSquare, label: t('home.createPost'), color: 'bg-purple-soft', textColor: 'text-purple', nav: 'create' },
                { icon: Zap, label: t('home.campaign'), color: 'bg-green-soft', textColor: 'text-brand-teal', nav: 'campaigns' },
                { icon: BarChart3, label: t('home.analytics'), color: 'bg-green-soft', textColor: 'text-green-accent', nav: 'analytics' },
                { icon: MessageSquare, label: t('home.aiChat'), color: 'bg-purple-soft', textColor: 'text-purple', nav: 'chat' },
              ].map((item, i) => (
                <button key={i} onClick={() => onNavigate(item.nav)} className="flex flex-col items-center gap-2 bg-card rounded-2xl p-5 border border-border-light desktop-hover">
                  <div className={`w-[64px] h-[64px] rounded-2xl ${item.color} flex items-center justify-center`}>
                    <item.icon size={24} className={item.textColor} />
                  </div>
                  <span className="text-[12px] font-semibold text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Social Media + Engagement */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            {/* Social Media */}
            <button onClick={() => onNavigate('social')} className="w-full bg-card rounded-2xl p-5 border border-border-light shadow-card flex flex-col justify-between desktop-hover text-start">
              <div>
                <Globe size={20} className="text-brand-blue" />
                <h3 className="text-[15px] font-bold text-foreground mt-2">{t('home.socialMedia')}</h3>
                <p className="text-[12px] text-muted-foreground mt-1">{connectedCount} platforms · {formatFollowerCount(totalFollowers)} followers</p>
              </div>
              <div className="flex gap-1 mt-2">
                {connectedPlatforms.slice(0, 5).map((a) => {
                  const logos: Record<string, React.ComponentType<{ size?: number }>> = { instagram: InstagramLogo, tiktok: TikTokLogo, snapchat: SnapchatLogo, facebook: FacebookLogo, x: XLogo };
                  const L = logos[a.platform];
                  return L ? <L key={a.platform} size={14} /> : null;
                })}
              </div>
            </button>

            {/* Engagement */}
            <button onClick={() => onNavigate('chat-engagement')} className="w-full bg-card rounded-2xl p-5 border border-border-light shadow-card flex flex-col justify-between desktop-hover text-start">
              <div>
                <MessageSquare size={20} className="text-purple" />
                <h3 className="text-[15px] font-bold text-foreground mt-2">{t('home.engagement')}</h3>
                <p className="text-[12px] text-muted-foreground mt-1">Manage comments &amp; DMs</p>
              </div>
            </button>
          </div>

          {/* Referral Card — full width banner */}
          <button onClick={() => onNavigate('referral')} className="w-full mt-6 bg-card rounded-2xl p-5 border border-brand-teal/30 desktop-hover text-start">
            <p className="text-[15px] font-bold text-foreground">{t('home.inviteTitle')}</p>
            <p className="text-[12px] text-muted-foreground mt-1">{t('home.inviteDesc')}</p>
            <span className="inline-block mt-2 px-4 py-2 rounded-xl gradient-btn text-primary-foreground text-[12px] font-bold">{t('home.shareInviteLink')}</span>
          </button>
        </div>
      </motion.div>
    );
  }

  // ============================
  // MOBILE LAYOUT (unchanged)
  // ============================
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-background min-h-screen pb-24">
      <TrialBanner onNavigate={onNavigate} />
      <div className="px-5 pt-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[14px] text-muted-foreground">{getGreeting()},</p>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-foreground">{displayName}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-accent animate-pulse-dot" />
              <span className="text-[12px] text-green-accent font-medium">Marketing OS · Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="w-8 h-8 rounded-lg bg-card border border-border-light flex items-center justify-center">
                <Globe2 size={14} className="text-muted-foreground" />
              </button>
              {langMenuOpen && (
                <div className="absolute top-10 end-0 bg-card rounded-2xl border border-border-light shadow-xl z-50 overflow-hidden w-44">
                  {[
                    { code: 'en', flag: '🇬🇧', label: 'English' },
                    { code: 'ar', flag: '🇸🇦', label: 'العربية' },
                    { code: 'fr', flag: '🇫🇷', label: 'Français' },
                  ].map(l => (
                    <button key={l.code} onClick={() => switchLang(l.code)} className={`w-full flex items-center gap-2 px-4 py-3 text-start text-[14px] font-medium transition-colors ${i18n.language === l.code ? 'bg-purple-soft text-brand-blue' : 'text-foreground hover:bg-muted'}`}>
                      <span>{l.flag}</span>
                      <span className="flex-1">{l.label}</span>
                      {i18n.language === l.code && <span className="text-brand-blue font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <FreePlanBadge />
            <button onClick={() => onNavigate('tokens')} className={`px-3 py-1 rounded-2xl text-[12px] font-bold border ${tokenLow ? 'bg-red-soft text-red-accent border-red-accent/20' : 'bg-card text-brand-blue border-border-light'}`}>
              {t('home.tokensRemaining', { count: tokenCount })}
            </button>
          </div>
        </div>

        {/* Disconnected Platform Warning */}
        {disconnectedAccounts.length > 0 && (
          <div className="mt-4 bg-red-accent/10 border border-red-accent/30 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-accent/20 flex items-center justify-center text-lg flex-shrink-0">🔴</div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-foreground">Platform Disconnected</p>
              <p className="text-[12px] text-muted-foreground">{disconnectedAccounts.map(a => a.platform).join(', ')} needs to be reconnected</p>
            </div>
            <button onClick={() => onNavigate('social')} className="text-[12px] font-bold text-brand-blue bg-brand-blue/10 px-3 py-1.5 rounded-lg whitespace-nowrap">Reconnect Now</button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="bg-card rounded-xl border border-border-light p-3 flex flex-col items-center">
            <MosScoreRing score={mosScore} size={40} />
            <p className="text-[9px] text-muted-foreground mt-1">MOS</p>
          </div>
          <div className="bg-card rounded-xl border border-border-light p-3 text-center">
            <p className="text-[18px] font-extrabold text-foreground">{tokenCount}</p>
            <p className="text-[9px] text-muted-foreground">Tokens</p>
          </div>
          <div className="bg-card rounded-xl border border-border-light p-3 text-center">
            <p className="text-[18px] font-extrabold text-foreground">{connectedCount}</p>
            <p className="text-[9px] text-muted-foreground">Platforms</p>
          </div>
          <div className="bg-card rounded-xl border border-border-light p-3 text-center">
            <p className="text-[18px] font-extrabold text-foreground">{scheduledPosts}</p>
            <p className="text-[9px] text-muted-foreground">Queued</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h2 className="text-[18px] font-bold text-foreground">{t('home.quickActions')}</h2>
          <div className="grid grid-cols-4 gap-3 mt-3">
            {[
              { icon: PenSquare, label: t('home.createPost'), color: 'bg-purple-soft', textColor: 'text-purple', nav: 'create' },
              { icon: Zap, label: t('home.campaign'), color: 'bg-green-soft', textColor: 'text-brand-teal', nav: 'campaigns' },
              { icon: BarChart3, label: t('home.analytics'), color: 'bg-green-soft', textColor: 'text-green-accent', nav: 'analytics' },
              { icon: MessageSquare, label: t('home.aiChat'), color: 'bg-purple-soft', textColor: 'text-purple', nav: 'chat' },
            ].map((item, i) => (
              <button key={i} onClick={() => onNavigate(item.nav)} className="flex flex-col items-center gap-2 bg-card rounded-2xl p-4 border border-border-light card-tap">
                <div className={`w-[52px] h-[52px] rounded-2xl ${item.color} flex items-center justify-center`}>
                  <item.icon size={22} className={item.textColor} />
                </div>
                <span className="text-[11px] font-semibold text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Referral Card */}
        <button onClick={() => onNavigate('referral')} className="w-full mt-5 bg-card rounded-2xl p-4 border border-brand-teal/30 card-tap text-start">
          <p className="text-[15px] font-bold text-foreground">{t('home.inviteTitle')}</p>
          <p className="text-[12px] text-muted-foreground mt-1">{t('home.inviteDesc')}</p>
          <span className="inline-block mt-2 px-4 py-2 rounded-xl gradient-btn text-primary-foreground text-[12px] font-bold">{t('home.shareInviteLink')}</span>
        </button>

        {/* More Tools */}
        <div className="mt-6">
          <h2 className="text-[18px] font-bold text-foreground">{t('home.moreTools')}</h2>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button onClick={() => onNavigate('social')} className="bg-card rounded-2xl p-5 border border-border-light shadow-card min-h-[130px] flex flex-col justify-between card-tap text-start">
              <div>
                <Globe size={20} className="text-brand-blue" />
                <h3 className="text-[15px] font-bold text-foreground mt-2">{t('home.socialMedia')}</h3>
                <p className="text-[12px] text-muted-foreground mt-1">{connectedCount} platforms · {formatFollowerCount(totalFollowers)} followers</p>
              </div>
              <div className="flex gap-1 mt-2">
                {connectedPlatforms.slice(0, 5).map((a) => {
                  const logos: Record<string, React.ComponentType<{ size?: number }>> = { instagram: InstagramLogo, tiktok: TikTokLogo, snapchat: SnapchatLogo, facebook: FacebookLogo, x: XLogo };
                  const L = logos[a.platform];
                  return L ? <L key={a.platform} size={14} /> : null;
                })}
              </div>
            </button>
            <button onClick={() => onNavigate('chat-engagement')} className="bg-card rounded-2xl p-5 border border-border-light shadow-card min-h-[130px] flex flex-col justify-between card-tap text-start">
              <div>
                <MessageSquare size={20} className="text-purple" />
                <h3 className="text-[15px] font-bold text-foreground mt-2">{t('home.engagement')}</h3>
                <p className="text-[12px] text-muted-foreground mt-1">Manage comments & DMs</p>
              </div>
            </button>
          </div>
        </div>
      </div>
      <SalesAgent onNavigate={onNavigate} currentPlan={currentPlan} tokensUsed={tokensUsed} tokensLimit={tokensTotal} postsThisMonth={postsData?.pagination?.total ?? 0} />
    </motion.div>
  );
};
