import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CalendarPost, AISuggestion, getPostsForDay, getSuggestionsForDay, demoCampaigns, demoEvents, platformDotColors, TODAY, isSameDay, getWeekDates } from './CalendarData';
import { platformLogoMap } from './PlatformLogos';
import { PostDetailPanel } from './PostDetailPanel';
import { useIsMobile } from '../hooks/use-mobile';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusBadge = (status: string) => {
  switch (status) {
    case 'scheduled': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-soft text-green-accent">Scheduled ✅</span>;
    case 'draft': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-soft text-orange-accent">Draft 📝</span>;
    case 'ai-generated': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-soft text-purple">AI Generated ✦</span>;
    case 'published': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">Published</span>;
    case 'boosted': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md gradient-hero text-primary-foreground">🚀 Boosted</span>;
    default: return null;
  }
};

const statusBadgeSmall = (status: string) => {
  switch (status) {
    case 'scheduled': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-soft text-green-accent">Scheduled</span>;
    case 'draft': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-soft text-orange-accent">Draft</span>;
    case 'ai-generated': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-soft text-purple">✦ AI</span>;
    case 'published': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Published</span>;
    default: return null;
  }
};

// Platform dots row with +N overflow
const PlatformDots = ({ platformIds, size = 4 }: { platformIds: string[]; size?: number }) => {
  const maxShow = 3;
  const overflow = platformIds.length - maxShow;
  return (
    <div className="flex items-center gap-0.5">
      {platformIds.slice(0, maxShow).map((pid, j) => (
        <div key={j} className="rounded-full" style={{ width: size, height: size, backgroundColor: platformDotColors[pid] || '#999' }} />
      ))}
      {overflow > 0 && <span className="text-[8px] text-muted-foreground font-bold ml-0.5">+{overflow}</span>}
    </div>
  );
};

// Empty day dashed circle indicator
const EmptyDayIndicator = () => (
  <div className="w-4 h-4 rounded-full border-2 border-dashed border-muted-foreground/30" />
);

interface CalendarTabProps {
  onCreatePost?: (date?: string, time?: string) => void;
  onCreateStrategy?: () => void;
  strategyPosts?: (CalendarPost & { day?: number })[];
  onEditPost?: (post: CalendarPost) => void;
  onDeletePost?: (post: CalendarPost) => Promise<void> | void;
  postsLoading?: boolean;
}

export const CalendarTab = ({ onCreatePost, onCreateStrategy, strategyPosts, onEditPost, onDeletePost, postsLoading = false }: CalendarTabProps) => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [weekStart, setWeekStart] = useState(new Date(2026, 2, 17));
  const [selectedDay, setSelectedDay] = useState(17);
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [monthYear, setMonthYear] = useState({ month: 2, year: 2026 });
  const isMobile = useIsMobile();

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const navigateWeek = (dir: number) => {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + dir * 7);
    setWeekStart(next);
    setSelectedDay(next.getDate());
  };

  const weekLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()} — ${end.getDate()}, ${weekStart.getFullYear()}`;
  }, [weekStart]);

  const hasExternalPosts = strategyPosts !== undefined;
  const getPostsForCalendarDay = (day: number) => {
    if (hasExternalPosts) {
      return (strategyPosts ?? []).filter(post => post.day === day);
    }
    return getPostsForDay(day);
  };

  const dayPosts = getPostsForCalendarDay(selectedDay);
  const daySuggestions = getSuggestionsForDay(selectedDay);

  const timelineItems = useMemo(() => {
    const items: { time: string; type: 'post' | 'suggestion'; data: CalendarPost | AISuggestion }[] = [];
    dayPosts.forEach(p => items.push({ time: p.time, type: 'post', data: p }));
    daySuggestions.forEach(s => items.push({ time: s.time, type: 'suggestion', data: s }));
    items.sort((a, b) => {
      const toMin = (t: string) => { const [h, rest] = t.split(':'); const [m, ampm] = rest.split(' '); let hr = parseInt(h); if (ampm === 'PM' && hr !== 12) hr += 12; if (ampm === 'AM' && hr === 12) hr = 0; return hr * 60 + parseInt(m); };
      return toMin(a.time) - toMin(b.time);
    });
    return items;
  }, [dayPosts, daySuggestions]);

  const uniquePlatforms = [...new Set(dayPosts.map(p => p.platform))];
  const peakHoursCovered = daySuggestions.length === 0 ? dayPosts.length >= 3 ? 3 : dayPosts.length : Math.max(0, dayPosts.length - daySuggestions.length);

  // ─── WEEK STRIP (shared) ───
  const WeekStrip = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      const selectedIdx = weekDates.findIndex(d => d.getDate() === selectedDay);
      if (selectedIdx > 0) {
        el.scrollTo({ left: selectedIdx * 56, behavior: 'smooth' });
      }
    }, [selectedDay]);

    return (
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth pb-1" style={{ scrollSnapType: 'x mandatory' }}>
        {weekDates.map((date, i) => {
          const day = date.getDate();
          const isToday = isSameDay(date, TODAY);
          const isSelected = day === selectedDay;
          const posts = getPostsForCalendarDay(day);
          const platformIds = [...new Set(posts.map(p => p.platform))];

          return (
            <motion.button
              key={i}
              onClick={() => setSelectedDay(day)}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center justify-between shrink-0 rounded-[14px] transition-all ${
                isToday ? 'gradient-hero text-primary-foreground shadow-lg' :
                isSelected ? 'bg-card border-2 border-brand-blue' :
                'bg-card border border-border-light'
              }`}
              style={{ width: 48, height: 72, scrollSnapAlign: 'center', padding: '6px 4px' }}
            >
              <span className={`text-[11px] ${isToday ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{DAY_NAMES[i]}</span>
              <span className={`text-[18px] font-bold ${isToday ? 'text-primary-foreground' : isSelected ? 'text-brand-blue' : 'text-foreground'}`}>{day}</span>
              {posts.length > 0 ? (
                <PlatformDots platformIds={platformIds} size={4} />
              ) : (
                <EmptyDayIndicator />
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  // ─── TIMELINE POST CARD ───
  const TimelinePostCard = ({ post, index }: { post: CalendarPost; index: number }) => {
    const Logo = platformLogoMap[post.platform];
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex gap-0"
      >
        {/* Time label on left */}
        <div className="w-[60px] shrink-0 pt-3 text-right pr-3">
          <span className="text-[12px] font-bold text-brand-blue">{post.time}</span>
        </div>

        {/* Timeline node */}
        <div className="flex flex-col items-center shrink-0 relative" style={{ width: 16 }}>
          <div className="w-2 h-2 rounded-full gradient-hero mt-4 z-10 shrink-0" />
        </div>

        {/* Card */}
        <motion.button
          onClick={() => setSelectedPost(post)}
          whileTap={{ scale: 0.98 }}
          className="flex-1 bg-card rounded-2xl p-3.5 border border-border-light ml-2 mb-2 text-left transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-2 flex-wrap">
            {Logo && <Logo size={24} />}
            <span className="text-[14px] font-bold text-foreground">{post.title}</span>
            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-medium">{post.type}</span>
            <div className="ml-auto">{statusBadge(post.status)}</div>
          </div>
          {post.caption && (
            <p className="text-[12px] text-muted-foreground mt-1.5 truncate">{post.caption}</p>
          )}
        </motion.button>
      </motion.div>
    );
  };

  // ─── TIMELINE SUGGESTION CARD ───
  const TimelineSuggestionCard = ({ suggestion, index }: { suggestion: AISuggestion; index: number }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex gap-0"
      >
        <div className="w-[60px] shrink-0 pt-3 text-right pr-3">
          <span className="text-[12px] font-bold text-brand-blue">{suggestion.time}</span>
        </div>
        <div className="flex flex-col items-center shrink-0 relative" style={{ width: 16 }}>
          <div className="w-2 h-2 rounded-full border-2 border-dashed border-brand-blue/40 mt-4 z-10 shrink-0" />
        </div>
        <div className="flex-1 border-2 border-dashed border-brand-blue/20 rounded-2xl p-3.5 ml-2 mb-2">
          <span className="text-[13px] font-semibold text-brand-blue">✦ {suggestion.time} — Best time for a {suggestion.platform.charAt(0).toUpperCase() + suggestion.platform.slice(1)} Story</span>
          <p className="text-[11px] text-muted-foreground mt-1">{suggestion.reason}</p>
          <button onClick={() => onCreatePost?.(String(selectedDay), suggestion.time)} className="mt-2 text-[12px] font-bold text-brand-blue btn-press">
            + Create
          </button>
        </div>
      </motion.div>
    );
  };

  // ─── TIMELINE WITH GRADIENT LINE ───
  const Timeline = () => {
    const lineRef = useRef<HTMLDivElement>(null);

    return (
      <div className="relative mt-4">
        {/* Gradient line */}
        {timelineItems.length > 0 && (
          <motion.div
            ref={lineRef}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute z-0"
            style={{
              left: 67, // 60px time + 8px center of node
              top: 16,
              bottom: 16,
              width: 2,
              background: 'linear-gradient(to bottom, hsl(233,100%,42%), hsl(193,100%,48%))',
              transformOrigin: 'top',
            }}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div key={selectedDay} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            {timelineItems.map((item, i) => (
              item.type === 'post'
                ? <TimelinePostCard key={i} post={item.data as CalendarPost} index={i} />
                : <TimelineSuggestionCard key={i} suggestion={item.data as AISuggestion} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {timelineItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[14px] text-muted-foreground">No posts scheduled for this day</p>
            <button onClick={() => onCreatePost?.(String(selectedDay))} className="mt-3 h-10 px-5 rounded-xl border border-brand-blue text-brand-blue text-[13px] font-bold btn-press">
              + Create Post
            </button>
          </div>
        )}
      </div>
    );
  };

  // ─── DAY SUMMARY BAR ───
  const DaySummary = () => (
    dayPosts.length > 0 ? (
      <div className="mt-4 bg-purple-soft rounded-xl p-3 flex items-center justify-center gap-2">
        <span className="text-[12px] font-medium text-foreground">
          {dayPosts.length} post{dayPosts.length > 1 ? 's' : ''} · {uniquePlatforms.length} platform{uniquePlatforms.length > 1 ? 's' : ''} · {peakHoursCovered} peak hour{peakHoursCovered !== 1 ? 's' : ''} covered
        </span>
      </div>
    ) : null
  );

  // ─── WEEK VIEW ───
  const WeekView = () => (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateWeek(-1)} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center btn-press hover:bg-muted transition-colors">
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
          <h2 className={`font-bold text-foreground ${isMobile ? 'text-[14px]' : 'text-[16px]'}`}>{weekLabel}</h2>
          <button onClick={() => navigateWeek(1)} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center btn-press hover:bg-muted transition-colors">
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex gap-1">
          {(['week', 'month'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                view === v ? 'bg-brand-blue text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-muted'
              }`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Week strip */}
      <WeekStrip />

      {/* Today's Schedule header */}
      <h3 className={`font-bold text-foreground ${isMobile ? 'text-[16px]' : 'text-[18px]'}`}>
        {isSameDay(weekDates.find(d => d.getDate() === selectedDay) || TODAY, TODAY) ? "Today's Schedule" : `${DAY_NAMES[weekDates.findIndex(d => d.getDate() === selectedDay)]}'s Schedule`}
      </h3>

      {/* Timeline */}
      <Timeline />

      {/* Day summary */}
      <DaySummary />
    </div>
  );

  // ─── MONTH VIEW ───
  const MonthView = () => {
    const { month, year } = monthYear;
    const firstDay = new Date(year, month, 1);
    const startDow = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const navigateMonth = (dir: number) => {
      let m = month + dir;
      let y = year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      setMonthYear({ month: m, year: y });
    };

    // Ramadan indicator (March 29 - April 28, 2026)
    const isRamadanDay = (day: number) => {
      if (month === 2 && day >= 29) return true;
      if (month === 3 && day <= 28) return true;
      return false;
    };

    const isWeekend = (dayNum: number) => {
      const d = new Date(year, month, dayNum);
      const dow = d.getDay();
      return dow === 5 || dow === 6; // Friday + Saturday
    };

    const isPast = (dayNum: number) => {
      const d = new Date(year, month, dayNum);
      return d < TODAY;
    };

    return (
      <div className="space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigateMonth(-1)} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center btn-press hover:bg-muted transition-colors">
              <ChevronLeft size={16} className="text-muted-foreground" />
            </button>
            <h2 className="text-[18px] font-bold text-foreground">{MONTH_NAMES[month]} {year}</h2>
            <button onClick={() => navigateMonth(1)} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center btn-press hover:bg-muted transition-colors">
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </div>
          <div className="flex gap-1">
            {(['week', 'month'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  view === v ? 'bg-brand-blue text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-muted'
                }`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Events banner */}
        {demoEvents.map((evt, i) => (
          <div key={i} className="rounded-xl px-3 py-2 bg-brand-teal/10 flex items-center gap-2">
            <span className="text-[12px] font-semibold text-foreground">{evt.emoji} {evt.name}</span>
            <span className="text-[11px] text-muted-foreground">
              {evt.startDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })} — {evt.endDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}

        {/* Grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {/* Headers */}
          {DAY_NAMES.map(d => (
            <div key={d} className="bg-muted/50 py-2 text-center">
              <span className="text-[11px] font-semibold text-muted-foreground">{d}</span>
            </div>
          ))}
          {/* Cells */}
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="bg-card min-h-[72px] md:min-h-[100px]" />;
            const posts = getPostsForCalendarDay(day);
            const isToday = month === 2 && day === 17;
            const isEmpty = posts.length === 0;
            const platformIds = [...new Set(posts.map(p => p.platform))];
            const past = isPast(day);
            const weekend = isWeekend(day);
            const selected = day === selectedDay && month === 2;

            return (
              <motion.button
                key={i}
                whileHover={!isMobile ? { scale: 1.02 } : undefined}
                onClick={() => {
                  setSelectedDay(day);
                  const dow = (new Date(year, month, day).getDay() + 6) % 7;
                  setWeekStart(new Date(year, month, day - dow));
                  setView('week');
                }}
                className={`text-left p-1.5 md:p-2 min-h-[72px] md:min-h-[100px] transition-all ${
                  isToday ? 'ring-2 ring-brand-blue ring-inset' : ''
                } ${selected ? 'bg-purple-soft' : isEmpty ? 'bg-[#fff8f0]' : weekend ? 'bg-muted/20' : 'bg-card'
                } ${past ? 'opacity-60' : ''}`}
              >
                <span className={`text-[13px] font-bold ${isToday ? 'text-brand-blue' : 'text-foreground'}`}>{day}</span>
                {/* Platform dots */}
                {platformIds.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {platformIds.slice(0, 5).map((pid, j) => (
                      <div key={j} className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor: platformDotColors[pid] || '#999' }} />
                    ))}
                  </div>
                )}
                {posts.length > 0 && (
                  <span className="text-[9px] text-muted-foreground mt-0.5 block">{posts.length} post{posts.length > 1 ? 's' : ''}</span>
                )}
                {/* Desktop: mini post previews */}
                {!isMobile && posts.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {posts.slice(0, 2).map((p, j) => {
                      const Logo = platformLogoMap[p.platform];
                      return (
                        <div key={j} className="flex items-center gap-1">
                          {Logo && <Logo size={10} />}
                          <span className="text-[8px] text-foreground truncate">{p.title}</span>
                        </div>
                      );
                    })}
                    {posts.length > 2 && <span className="text-[8px] text-brand-blue">+{posts.length - 2} more</span>}
                  </div>
                )}
                {/* Ramadan indicator */}
                {isRamadanDay(day) && (
                  <span className="text-[8px] text-brand-teal font-medium mt-0.5 block">🌙</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Post detail panels */}
      <AnimatePresence mode="wait">
        {selectedPost && !isMobile && (
          <div className="fixed inset-0 z-40 flex justify-end pointer-events-none">
            <div className="pointer-events-auto">
               <PostDetailPanel post={selectedPost} onClose={() => setSelectedPost(null)} onEditPost={onEditPost} onDeletePost={onDeletePost} />
            </div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedPost && isMobile && (
          <PostDetailPanel post={selectedPost} onClose={() => setSelectedPost(null)} onEditPost={onEditPost} onDeletePost={onDeletePost} />
        )}
      </AnimatePresence>

      {view === 'month' ? <MonthView /> : <WeekView />}

      {postsLoading && (
        <p className="mt-3 text-[12px] text-muted-foreground text-center">Loading posts...</p>
      )}

      {/* Schedule Post button */}
      <motion.button
        onClick={() => onCreatePost?.(String(selectedDay))}
        whileTap={{ scale: 0.97 }}
        className="w-full mt-5 h-12 rounded-2xl gradient-btn text-primary-foreground text-[14px] font-bold flex items-center justify-center gap-2 shadow-btn btn-press"
      >
        <Plus size={18} />
        Schedule Post
      </motion.button>

      {/* Mobile FAB removed — replaced by bottom button */}
    </div>
  );
};
