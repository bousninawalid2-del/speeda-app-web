import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, Send, Paperclip, ArrowLeft, Sparkles, Settings, Bot, Clock, Star, Smile, X } from 'lucide-react';
import { InstagramLogo, GoogleLogo, WhatsAppLogo, FacebookLogo, TikTokLogo } from '../components/PlatformLogos';
import { useFreeTier, BlurredLock } from '../components/FreeTier';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../hooks/use-mobile';
import { toast } from 'sonner';
import { getSmartReplies, detectMessageType } from '../components/SmartReplyEngine';

// ─── Data ───────────────────────────────────────────────────────

const messages = [
  { id: 'c1', name: 'Ahmed K.', emoji: '👍', Logo: InstagramLogo, platform: 'Instagram', type: 'Comment', filter: 'Comments', time: '5m ago', msg: 'This looks amazing! What time do you close?', rating: 0 },
  { id: 'c2', name: 'Sara M.', emoji: '🌟', Logo: GoogleLogo, platform: 'Google', type: 'Review', filter: 'Reviews', time: '15m ago', msg: 'Food was cold when delivered. Very disappointed with the service.', rating: 2, existingReply: null },
  { id: 'c3', name: 'Noura H.', emoji: '👍', Logo: InstagramLogo, platform: 'Instagram', type: 'Comment', filter: 'Comments', time: '3h ago', msg: 'How much is the family meal deal?', rating: 0 },
  { id: 'c4', name: 'Khalid S.', emoji: '⭐', Logo: GoogleLogo, platform: 'Google', type: 'Review', filter: 'Reviews', time: '2h ago', msg: 'Best shawarma in Riyadh! 5 stars!', rating: 5, existingReply: null },
  { id: 'c5', name: 'Reem A.', emoji: '💬', Logo: FacebookLogo, platform: 'Facebook', type: 'Review', filter: 'Reviews', time: '1d ago', msg: 'Great atmosphere and friendly staff. Will come back!', rating: 4, existingReply: 'Thank you Reem! We look forward to seeing you again! 🤩' },
  { id: 'c6', name: 'Ali M.', emoji: '🔥', Logo: TikTokLogo, platform: 'TikTok', type: 'Comment', filter: 'Comments', time: '1h ago', msg: 'يجنن والله! 🔥❤️', rating: 0 },
];

const dmConversations = [
  {
    id: 'dm1', name: 'Mohammed A.', Logo: InstagramLogo, platform: 'Instagram',
    avatar: '😊', unread: true, lastMsg: 'Do you have any vegan options on the menu?', time: '30m ago',
    thread: [
      { from: 'them', text: 'Hi! I love your restaurant 😍', time: '1h ago' },
      { from: 'them', text: 'Do you have any vegan options on the menu?', time: '30m ago' },
    ],
  },
  {
    id: 'dm2', name: 'Fatima R.', Logo: WhatsAppLogo, platform: 'WhatsApp',
    avatar: '👩', unread: true, lastMsg: 'I want to place a catering order for 50 people next Friday', time: '1h ago',
    thread: [
      { from: 'them', text: "Hello, is this Malek's Kitchen?", time: '2h ago' },
      { from: 'us', text: 'Yes it is! How can we help? 🍽️', time: '1h 30m ago' },
      { from: 'them', text: 'I want to place a catering order for 50 people next Friday', time: '1h ago' },
    ],
  },
  {
    id: 'dm3', name: 'Layla B.', Logo: FacebookLogo, platform: 'Facebook',
    avatar: '💬', unread: false, lastMsg: 'Thanks for the info!', time: '3h ago',
    thread: [
      { from: 'them', text: 'What are your opening hours?', time: '5h ago' },
      { from: 'us', text: "We're open Sunday to Thursday, 9 AM to 11 PM!", time: '4h ago' },
      { from: 'them', text: 'Thanks for the info!', time: '3h ago' },
    ],
  },
  {
    id: 'dm4', name: 'Omar T.', Logo: InstagramLogo, platform: 'Instagram',
    avatar: '🧔', unread: true, lastMsg: 'Can I book a table for tonight?', time: '45m ago',
    thread: [
      { from: 'them', text: 'Can I book a table for tonight?', time: '45m ago' },
    ],
  },
];

const defaultAutoResponses = [
  { id: '1', trigger: 'opening hours', response: "We're open Sunday to Thursday, 9 AM to 11 PM, and Friday-Saturday 12 PM to 12 AM! 🕐", enabled: true },
  { id: '2', trigger: 'menu', response: "Check out our full menu here: [link]. Our bestsellers are the Chicken Shawarma and Smash Burger! 🍽️", enabled: true },
  { id: '3', trigger: 'location', response: "We're located in Al-Malqa district, Riyadh. Here's our Google Maps link: [link] 📍", enabled: true },
  { id: '4', trigger: 'delivery', response: "Yes, we deliver! Order through our app. Delivery within 30-45 min 🚗", enabled: false },
];

const filters = ['All', 'Comments', 'DMs', 'Reviews'];

const CHAR_LIMITS: Record<string, number> = {
  Instagram: 2200,
  TikTok: 150,
  Facebook: 8000,
  Google: 4000,
  WhatsApp: 4096,
  X: 280,
  default: 2000,
};

// ─── Inline Composer Component ──────────────────────────────

interface InlineComposerProps {
  platform: string;
  Logo: React.ComponentType<{ size: number }>;
  isReview?: boolean;
  messageText: string;
  contextType: 'comment' | 'dm_first' | 'dm_followup' | 'review_positive' | 'review_negative';
  onSend: (text: string) => void;
  onCancel: () => void;
  initialValue?: string;
}

const InlineComposer = ({ platform, Logo, isReview, messageText, contextType, onSend, onCancel, initialValue }: InlineComposerProps) => {
  const { t, i18n } = useTranslation();
  const [value, setValue] = useState(initialValue || '');
  const [sending, setSending] = useState(false);
  const [showShimmer, setShowShimmer] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLen = CHAR_LIMITS[platform] || CHAR_LIMITS.default;

  const suggestions = getSmartReplies(contextType, messageText, i18n.language);

  useEffect(() => {
    const timer = setTimeout(() => setShowShimmer(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const maxH = 6 * 24; // 6 rows max
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, maxH) + 'px';
    }
  }, [value]);

  const handleSend = () => {
    if (!value.trim()) return;
    setSending(true);
    setTimeout(() => {
      onSend(value);
      setSending(false);
      toast.success(t('engagement.replySent', 'Reply sent ✓'));
    }, 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2">
      {/* Smart Replies */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-brand-blue" />
          <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wider">
            {t('engagement.smartReplies', '✦ Smart Replies')}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {showShimmer ? (
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-7 rounded-full bg-muted animate-pulse" style={{ width: 80 + i * 30 }} />
              ))}
            </>
          ) : (
            suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setValue(s)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-brand-blue/10 text-brand-blue font-medium hover:bg-brand-blue/20 transition-colors text-left leading-snug"
              >
                ✦ {s.length > 50 ? s.slice(0, 50) + '…' : s}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { if (e.target.value.length <= maxLen) setValue(e.target.value); }}
          rows={3}
          placeholder={t('engagement.composerPlaceholder', '✦ AI can help — pick a suggestion above or write your own')}
          className="w-full rounded-xl bg-muted border border-border-light p-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-blue resize-none leading-relaxed"
          autoFocus
        />
        <div className="flex items-center justify-between mt-1 px-1">
          <div className="flex items-center gap-1.5">
            <Logo size={14} />
            <span className="text-[10px] text-muted-foreground font-medium">{platform}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{value.length}/{maxLen}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button onClick={onCancel} className="h-9 px-4 rounded-xl border border-border text-muted-foreground text-[12px] font-medium btn-press">
          {t('common.cancel')}
        </button>
        <button
          onClick={handleSend}
          disabled={!value.trim() || sending}
          className="flex-1 h-9 rounded-xl gradient-btn text-primary-foreground text-[12px] font-bold btn-press disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>{isReview ? t('engagement.sendResponse', 'Send Response') : t('common.send')} ✦</>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// ─── Emoji Picker (simple) ──────────────────────────────────

const QUICK_EMOJIS = ['😊', '❤️', '🔥', '👏', '🙏', '😍', '💯', '✨', '👍', '🎉', '😂', '🤩'];

const EmojiPicker = ({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
    className="absolute bottom-full mb-2 left-0 bg-card border border-border-light rounded-xl p-2 shadow-lg z-20 grid grid-cols-6 gap-1">
    {QUICK_EMOJIS.map(e => (
      <button key={e} onClick={() => { onSelect(e); onClose(); }} className="w-8 h-8 flex items-center justify-center text-[18px] hover:bg-muted rounded-lg">{e}</button>
    ))}
  </motion.div>
);

// ─── Main Component ─────────────────────────────────────────

export const EngagementScreen = ({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (screen: string) => void }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [dmInput, setDmInput] = useState('');
  const [dmSearch, setDmSearch] = useState('');
  const [localThreads, setLocalThreads] = useState<Record<string, typeof dmConversations[0]['thread']>>({});
  const [showAutoResponses, setShowAutoResponses] = useState(false);
  const [autoResponses, setAutoResponses] = useState(defaultAutoResponses);
  const [openComposer, setOpenComposer] = useState<string | null>(null);
  const [sentReplies, setSentReplies] = useState<Record<string, string>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showEmoji, setShowEmoji] = useState<string | null>(null);
  const { isFree } = useFreeTier();
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();

  const filtered = activeFilter === 'All'
    ? messages
    : activeFilter === 'DMs'
      ? []
      : messages.filter(m => m.filter === activeFilter);

  const filteredDMs = dmConversations.filter(dm =>
    dm.name.toLowerCase().includes(dmSearch.toLowerCase())
  );

  const activeDM = dmConversations.find(dm => dm.id === selectedDM);
  const activeThread = activeDM ? (localThreads[activeDM.id] || activeDM.thread) : [];
  const unreadCount = dmConversations.filter(dm => dm.unread).length;

  const handleSendDM = () => {
    if (!dmInput.trim() || !activeDM) return;
    const newThread = [...activeThread, { from: 'us', text: dmInput, time: 'Just now' }];
    setLocalThreads(prev => ({ ...prev, [activeDM.id]: newThread }));
    setDmInput('');
    toast.success(t('engagement.replySent', 'Reply sent ✓'));
  };

  const toggleAutoResponse = (id: string) => {
    setAutoResponses(prev => prev.map(ar => ar.id === id ? { ...ar, enabled: !ar.enabled } : ar));
  };

  const handleCommentReply = (messageId: string, text: string) => {
    setSentReplies(prev => ({ ...prev, [messageId]: text }));
    setOpenComposer(null);
  };

  const handleCommentBarSend = (messageId: string) => {
    const text = commentInputs[messageId];
    if (!text?.trim()) return;
    setSentReplies(prev => ({ ...prev, [`bar_${messageId}`]: text }));
    setCommentInputs(prev => ({ ...prev, [messageId]: '' }));
    toast.success(t('engagement.replySent', 'Reply sent ✓'));
  };

  // ─── Auto-Response Panel ────────────────────────────────

  const AutoResponsePanel = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-[16px] font-bold text-foreground flex items-center gap-2"><Bot size={18} className="text-brand-blue" /> {t('engagement.autoResponses', 'Auto-Responses')}</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">{t('engagement.autoResponsesDesc', 'Automatically reply to common questions')}</p>
        </div>
        <button onClick={() => setShowAutoResponses(false)} className="text-[12px] text-brand-blue font-semibold">{t('engagement.backToDms', 'Back to DMs')}</button>
      </div>
      {autoResponses.map(ar => (
        <div key={ar.id} className="bg-card rounded-2xl p-4 border border-border-light">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-lg">{t('engagement.trigger', 'Trigger')}: "{ar.trigger}"</span>
            <button onClick={() => toggleAutoResponse(ar.id)} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${ar.enabled ? 'bg-green-accent' : 'bg-border'}`}>
              <div className={`w-4 h-4 rounded-full bg-card shadow transition-transform ${ar.enabled ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
            </button>
          </div>
          <p className="text-[13px] text-foreground leading-relaxed">{ar.response}</p>
          <div className="flex items-center gap-2 mt-2">
            <Clock size={12} className="text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{t('engagement.respondsWithin', 'Responds within 30 seconds')}</span>
          </div>
        </div>
      ))}
      <button className="w-full h-10 rounded-xl border-2 border-dashed border-brand-blue/25 text-brand-blue text-[13px] font-semibold">
        + {t('engagement.addAutoResponse', 'Add Auto-Response Template')}
      </button>
    </motion.div>
  );

  // ─── DM Chat View ──────────────────────────────────────

  const DMChatView = () => {
    if (!activeDM) return null;

    const isFirstReply = !activeThread.some(m => m.from === 'us');
    const contextType = isFirstReply ? 'dm_first' as const : 'dm_followup' as const;
    const lastTheirMsg = [...activeThread].reverse().find(m => m.from === 'them')?.text || '';
    const suggestions = getSmartReplies(contextType, lastTheirMsg, i18n.language);
    const matchedAuto = autoResponses.find(ar => ar.enabled && (activeDM as any).triggerMatch === ar.trigger);

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light bg-card">
          <button onClick={() => setSelectedDM(null)}><ArrowLeft size={20} className="text-foreground" /></button>
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-[18px]">{activeDM.avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-foreground truncate">{activeDM.name}</span>
              <activeDM.Logo size={14} />
            </div>
            <span className="text-[11px] text-muted-foreground">{activeDM.platform}</span>
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
          {activeThread.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === 'us' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                msg.from === 'us'
                  ? 'bg-brand-blue text-primary-foreground rounded-br-md'
                  : 'bg-card border border-border-light text-foreground rounded-bl-md'
              }`}>
                <p className="text-[14px] leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 flex items-center gap-1 ${msg.from === 'us' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {msg.time}
                  {msg.from === 'us' && <span>✓</span>}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Auto-response match indicator */}
        {matchedAuto && (
          <div className="px-4 py-2 bg-green-accent/10 border-t border-green-accent/20">
            <div className="flex items-center gap-2">
              <Bot size={14} className="text-green-accent" />
              <span className="text-[11px] font-semibold text-green-accent">{t('engagement.autoResponseMatched', 'Auto-response matched')}: "{matchedAuto.trigger}"</span>
            </div>
          </div>
        )}

        {/* Smart Suggestions for DMs */}
        <div className="px-4 py-2 bg-card border-t border-border-light">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={11} className="text-brand-blue" />
            <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">{t('engagement.smartReplies', '✦ Smart Replies')}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setDmInput(s)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-brand-blue/10 text-brand-blue font-medium hover:bg-brand-blue/20 transition-colors text-left leading-snug">
                ✦ {s.length > 40 ? s.slice(0, 40) + '…' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="px-4 py-3 bg-card border-t border-border-light flex items-center gap-2">
          <button className="p-2 text-muted-foreground"><Paperclip size={18} /></button>
          <input
            value={dmInput}
            onChange={e => setDmInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendDM()}
            placeholder={t('engagement.typeMessage', 'Type a message...')}
            className="flex-1 h-10 rounded-xl bg-muted px-4 text-[14px] text-foreground placeholder:text-muted-foreground border-0 outline-none"
          />
          <button onClick={handleSendDM} disabled={!dmInput.trim()} className="p-2 text-brand-blue disabled:opacity-40"><Send size={18} /></button>
        </div>
      </motion.div>
    );
  };

  // ─── DM List View ──────────────────────────────────────

  const DMListView = () => (
    <div className="space-y-0">
      <div className="px-1 mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={dmSearch}
            onChange={e => setDmSearch(e.target.value)}
            placeholder={t('engagement.searchMessages', 'Search messages...')}
            className="w-full h-10 rounded-xl bg-card border border-border-light pl-9 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <button onClick={() => setShowAutoResponses(true)} className="h-10 w-10 rounded-xl bg-card border border-border-light flex items-center justify-center">
          <Bot size={16} className="text-brand-blue" />
        </button>
      </div>

      {autoResponses.filter(ar => ar.enabled).length > 0 && (
        <div className="px-1 mb-3">
          <div className="bg-green-accent/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <Bot size={14} className="text-green-accent" />
            <span className="text-[11px] text-green-accent font-semibold">{autoResponses.filter(ar => ar.enabled).length} {t('engagement.autoResponsesActive', 'auto-responses active')}</span>
          </div>
        </div>
      )}

      {filteredDMs.map(dm => (
        <button key={dm.id} onClick={() => setSelectedDM(dm.id)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-card transition-colors text-left">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-[20px]">{dm.avatar}</div>
            <div className="absolute -bottom-0.5 -right-0.5"><dm.Logo size={16} /></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-foreground">{dm.name}</span>
              <span className="text-[11px] text-muted-foreground">{dm.time}</span>
            </div>
            <p className="text-[13px] text-muted-foreground truncate mt-0.5">{dm.lastMsg}</p>
          </div>
          {dm.unread && <div className="w-2.5 h-2.5 rounded-full bg-brand-blue shrink-0" />}
        </button>
      ))}
    </div>
  );

  // ─── Desktop DM Split View ─────────────────────────────

  const DesktopDMView = () => (
    <div className="flex gap-0 bg-card rounded-2xl border border-border-light overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
      <div className="w-[320px] border-r border-border-light p-4 overflow-y-auto">
        {showAutoResponses ? <AutoResponsePanel /> : <DMListView />}
      </div>
      <div className="flex-1 flex flex-col">
        {selectedDM ? <DMChatView /> : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-[14px]">
            {t('engagement.selectConversation', 'Select a conversation')}
          </div>
        )}
      </div>
    </div>
  );

  // ─── Star Rating ────────────────────────────────────────

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={12} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'} />
      ))}
    </div>
  );

  // ─── Comment/Review Card ────────────────────────────────

  const MessageCard = ({ m, i }: { m: typeof messages[0]; i: number }) => {
    const isReview = m.type === 'Review';
    const composerOpen = openComposer === m.id;
    const existingReply = sentReplies[m.id] || (m as any).existingReply;
    const barReply = sentReplies[`bar_${m.id}`];
    const commentInput = commentInputs[m.id] || '';

    const getContextType = (): 'comment' | 'review_positive' | 'review_negative' => {
      if (isReview) {
        return m.rating >= 4 ? 'review_positive' : 'review_negative';
      }
      return 'comment';
    };

    return (
      <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
        className="bg-card rounded-[20px] p-5 shadow-card border border-border-light">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span>{m.emoji}</span>
          <span className="text-[15px] font-bold text-foreground">{m.name}</span>
          <m.Logo size={16} />
          <span className="text-[11px] text-muted-foreground">{m.platform}</span>
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{m.type}</span>
          <span className="text-[11px] text-muted-foreground ml-auto">{m.time}</span>
        </div>

        {/* Rating for reviews */}
        {isReview && m.rating > 0 && (
          <div className="mt-2"><StarRating rating={m.rating} /></div>
        )}

        {/* Message */}
        <div className="bg-card-alt rounded-2xl p-3 mt-3">
          <p className="text-[14px] text-foreground">{m.msg}</p>
        </div>

        {/* Existing reply */}
        {existingReply && (
          <div className="mt-3 bg-brand-blue/5 rounded-xl p-3 border border-brand-blue/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-brand-blue uppercase">{isReview ? t('engagement.yourResponse', 'Your Response') : t('common.you', 'You')}</span>
              <span className="text-[10px] text-muted-foreground">Just now</span>
            </div>
            <p className="text-[13px] text-foreground leading-relaxed">{existingReply}</p>
            <button onClick={() => { setOpenComposer(m.id); }} className="text-[11px] text-brand-blue font-semibold mt-1.5">
              {t('engagement.editResponse', 'Edit Response')}
            </button>
          </div>
        )}

        {/* Bar reply (from comment compose bar) */}
        {barReply && (
          <div className="mt-2 bg-brand-blue/5 rounded-xl p-3 border border-brand-blue/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-brand-blue bg-brand-blue/10 px-1.5 py-0.5 rounded">{t('common.you', 'You')}</span>
              <span className="text-[10px] text-muted-foreground">Just now</span>
            </div>
            <p className="text-[13px] text-foreground">{barReply}</p>
          </div>
        )}

        {/* Reply/Edit button */}
        {!composerOpen && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setOpenComposer(m.id)}
              className="flex-1 h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press"
            >
              {existingReply ? t('engagement.editResponse', 'Edit Response') : (isReview ? t('engagement.reply', 'Reply') : t('engagement.reply', 'Reply'))} ✦
            </button>
          </div>
        )}

        {/* Inline Composer */}
        <AnimatePresence>
          {composerOpen && (
            <InlineComposer
              platform={m.platform}
              Logo={m.Logo}
              isReview={isReview}
              messageText={m.msg}
              contextType={getContextType()}
              initialValue={existingReply || ''}
              onSend={(text) => handleCommentReply(m.id, text)}
              onCancel={() => setOpenComposer(null)}
            />
          )}
        </AnimatePresence>

        {/* Permanent Comment Compose Bar (for comments only) */}
        {!isReview && !composerOpen && (
          <div className="mt-3 pt-3 border-t border-border-light">
            <div className="flex items-center gap-2 relative">
              <div className="w-7 h-7 rounded-full bg-brand-blue/20 flex items-center justify-center text-[12px]">👤</div>
              <div className="flex-1 relative">
                <input
                  value={commentInput}
                  onChange={e => setCommentInputs(prev => ({ ...prev, [m.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleCommentBarSend(m.id)}
                  placeholder={t('engagement.writeReply', 'Write your reply...')}
                  className="w-full h-9 rounded-xl bg-muted px-3 pr-16 text-[12px] text-foreground placeholder:text-muted-foreground border-0 outline-none"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button onClick={() => setShowEmoji(showEmoji === m.id ? null : m.id)} className="p-1 text-muted-foreground hover:text-foreground">
                    <Smile size={14} />
                  </button>
                  <button onClick={() => handleCommentBarSend(m.id)} disabled={!commentInput.trim()}
                    className="px-2 py-1 rounded-lg gradient-btn text-primary-foreground text-[10px] font-bold disabled:opacity-40">
                    {t('engagement.reply', 'Reply')} ✦
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {showEmoji === m.id && (
                  <EmojiPicker
                    onSelect={(e) => setCommentInputs(prev => ({ ...prev, [m.id]: (prev[m.id] || '') + e }))}
                    onClose={() => setShowEmoji(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // ─── DMs filter ─────────────────────────────────────────

  if (activeFilter === 'DMs') {
    if (isMobile && showAutoResponses) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-background min-h-screen pb-24">
          <div className="px-5 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setShowAutoResponses(false)}><ChevronLeft size={24} className="text-foreground" /></button>
              <h1 className="text-[20px] font-extrabold text-foreground">{t('engagement.autoResponses', 'Auto-Responses')}</h1>
            </div>
            <AutoResponsePanel />
          </div>
        </motion.div>
      );
    }

    if (isMobile && selectedDM) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-background min-h-screen flex flex-col" style={{ height: '100vh' }}>
          <DMChatView />
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
        <div className="px-5 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
            <h1 className="text-[20px] font-extrabold text-foreground">{t('engagement.title')}</h1>
            <span className="w-6 h-6 rounded-full bg-brand-blue text-primary-foreground text-[11px] font-bold flex items-center justify-center">{messages.length + unreadCount}</span>
          </div>
          <div className="flex gap-2 mb-4">
            {filters.map(f => (
              <button key={f} onClick={() => { setActiveFilter(f); setSelectedDM(null); setShowAutoResponses(false); }}
                className={`rounded-3xl px-4 py-2 text-[12px] font-semibold transition-all ${
                  activeFilter === f ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
                }`}>
                {t(`engagement.${f.toLowerCase()}`, f)}
                {f === 'DMs' && unreadCount > 0 && (
                  <span className="ml-1.5 w-4 h-4 rounded-full bg-red-accent text-primary-foreground text-[9px] font-bold inline-flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
          {isMobile ? (showAutoResponses ? <AutoResponsePanel /> : <DMListView />) : <DesktopDMView />}
        </div>
      </motion.div>
    );
  }

  // ─── Default: Comments / Reviews / All ──────────────────

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-background min-h-screen pb-24">
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack}><ChevronLeft size={24} className="text-foreground" /></button>
          <h1 className="text-[20px] font-extrabold text-foreground">{t('engagement.title')}</h1>
          <span className="w-6 h-6 rounded-full bg-brand-blue text-primary-foreground text-[11px] font-bold flex items-center justify-center">{messages.length + unreadCount}</span>
        </div>
        <div className="flex gap-2 mb-4">
          {filters.map(f => (
            <button key={f} onClick={() => { setActiveFilter(f); setSelectedDM(null); setShowAutoResponses(false); }}
              className={`rounded-3xl px-4 py-2 text-[12px] font-semibold transition-all ${
                activeFilter === f ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}>
              {t(`engagement.${f.toLowerCase()}`, f)}
              {f === 'DMs' && unreadCount > 0 && (
                <span className="ml-1.5 w-4 h-4 rounded-full bg-red-accent text-primary-foreground text-[9px] font-bold inline-flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {filtered.map((m, i) => (
            <MessageCard key={m.id} m={m} i={i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
