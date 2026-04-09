import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Plus, Clock, Paperclip, X, Camera, Image, Film, FileText, Sparkles, Smile } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InstagramLogo, GoogleLogo, WhatsAppLogo } from '../components/PlatformLogos';
import smashBurgerImg from '../assets/demo-smash-burger.jpg';
import { useFreeTier, AIMessageLimitBanner, AIMessageLimitReached, UpgradePrompt, BlurredLock } from '../components/FreeTier';
import { getSmartReplies, detectMessageType } from '../components/SmartReplyEngine';
import { toast } from 'sonner';

// Engagement data
const engagementMessages = [
  { name: 'Ahmed K.', emoji: '👍', Logo: InstagramLogo, platform: 'Instagram', type: 'Comment', filter: 'Comments', time: '5m ago', msg: 'This looks amazing! What time do you close?', ai: "Thank you Ahmed! We're open until 12 AM tonight. See you soon!" },
  { name: 'Sara M.', emoji: '🌟', Logo: GoogleLogo, platform: 'Google', type: 'Review', filter: 'Reviews', time: '15m ago', msg: 'Food was cold when delivered. Very disappointed with the service.', ai: "We sincerely apologize for this experience, Sara. We'd like to make it right. Please DM us your order number and we'll send a replacement.", isNegative: true },
  { name: 'Mohammed A.', emoji: '😊', Logo: InstagramLogo, platform: 'Instagram', type: 'DM', filter: 'DMs', time: '30m ago', msg: 'Do you have any vegan options on the menu?', ai: 'Yes Mohammed! We have 5 vegan dishes including our popular Falafel Bowl and Quinoa Salad. Would you like to see the full menu?' },
  { name: 'Noura H.', emoji: '👍', Logo: InstagramLogo, platform: 'Instagram', type: 'Comment', filter: 'Comments', time: '3h ago', msg: 'How much is the family meal deal?', ai: 'Hi Noura! Our Family Meal Deal is 149 SAR and serves 4-5 people. It includes 4 mains, 4 sides, and drinks. Order now on our app!' },
  { name: 'Fatima R.', emoji: '👍', Logo: WhatsAppLogo, platform: 'WhatsApp', type: 'Message', filter: 'DMs', time: '1h ago', msg: 'I want to place a catering order for 50 people next Friday', ai: "Hi Fatima! We'd love to help with your catering order. Our catering menu starts at 35 SAR per person. I'll have our catering team reach out shortly!" },
  { name: 'Khalid S.', emoji: '⭐', Logo: GoogleLogo, platform: 'Google', type: 'Review', filter: 'Reviews', time: '2h ago', msg: 'Best shawarma in Riyadh! 5 stars!', ai: "Thank you so much Khalid! We're thrilled you loved it. See you again soon! 🙏" },
];

const engagementFilters = ['All', 'Comments', 'DMs', 'Reviews'];

const chatHistory = [
  { preview: 'Create Instagram post for our new Shawarma special', date: 'Today, 2:30 PM', aiPreview: "I'll create an engaging post for your Shawarma special..." },
  { preview: 'Launch a weekend campaign on Instagram and Facebook', date: 'Today, 10:15 AM', aiPreview: "Let me set up a cross-platform campaign..." },
  { preview: "What's my best performing content this week?", date: 'Yesterday', aiPreview: 'Your top content this week is the Chicken Shawarma Reel...' },
  { preview: 'Generate a Ramadan content plan for 30 days', date: 'Yesterday', aiPreview: "Here's a comprehensive 30-day Ramadan content calendar..." },
  { preview: 'Help me respond to a negative Google review', date: 'Mar 17', aiPreview: "I've drafted a professional response that addresses..." },
  { preview: 'Create a TikTok video idea for behind the scenes', date: 'Mar 16', aiPreview: 'Here are 3 trending TikTok concepts for kitchen BTS...' },
  { preview: 'Analyze why my reach dropped last week', date: 'Mar 15', aiPreview: 'Your reach dipped 12% due to reduced posting frequency...' },
  { preview: 'Write an Arabic caption for my brunch photo', date: 'Mar 14', aiPreview: 'اكتشف برانش نهاية الأسبوع الخاص بنا...' },
];

const CHAR_LIMITS_CHAT: Record<string, number> = { Instagram: 2200, TikTok: 150, Facebook: 8000, Google: 4000, WhatsApp: 4096, default: 2000 };

const EngagementSubTab = ({ engFilter, setEngFilter, engagementFilters, filteredEngagement, isFree, onNavigate, t, i18n }: any) => {
  const [openComposer, setOpenComposer] = useState<number | null>(null);
  const [sentReplies, setSentReplies] = useState<Record<number, string>>({});
  const [composerValues, setComposerValues] = useState<Record<number, string>>({});
  const [sendingIdx, setSendingIdx] = useState<number | null>(null);
  const [shimmer, setShimmer] = useState<Record<number, boolean>>({});

  const handleOpenComposer = (idx: number) => {
    setOpenComposer(idx);
    setShimmer(prev => ({ ...prev, [idx]: true }));
    setTimeout(() => setShimmer(prev => ({ ...prev, [idx]: false })), 500);
  };

  const handleSend = (idx: number, m: any) => {
    const text = composerValues[idx];
    if (!text?.trim()) return;
    setSendingIdx(idx);
    setTimeout(() => {
      setSentReplies(prev => ({ ...prev, [idx]: text }));
      setOpenComposer(null);
      setComposerValues(prev => ({ ...prev, [idx]: '' }));
      setSendingIdx(null);
      toast.success(t('engagement.replySent', 'Reply sent ✓'));
    }, 2000);
  };

  return (
    <div className="flex-1 px-5 overflow-y-auto pb-24">
      <div className="flex gap-2 mb-4">
        {engagementFilters.map((f: string) => (
          <button key={f} onClick={() => setEngFilter(f)}
            className={`rounded-3xl px-4 py-2 text-[12px] font-semibold transition-all ${
              engFilter === f ? 'bg-brand-blue text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}>{f}</button>
        ))}
      </div>
      <div className="space-y-4">
        {filteredEngagement.map((m: any, i: number) => {
          const isReview = m.type === 'Review';
          const contextType = isReview ? (m.isNegative ? 'review_negative' : 'review_positive') : 'comment';
          const suggestions = getSmartReplies(contextType as any, m.msg, i18n.language);
          const composerOpen = openComposer === i;
          const reply = sentReplies[i];
          const maxLen = CHAR_LIMITS_CHAT[m.platform] || CHAR_LIMITS_CHAT.default;

          return (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-[20px] p-5 shadow-card border border-border-light">
              <div className="flex items-center gap-2 flex-wrap">
                <span>{m.emoji}</span>
                <span className="text-[15px] font-bold text-foreground">{m.name}</span>
                <m.Logo size={16} />
                <span className="text-[11px] text-muted-foreground">{m.platform}</span>
                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{m.type}</span>
                <span className="text-[11px] text-muted-foreground ms-auto">{m.time}</span>
              </div>
              <div className="bg-card-alt rounded-2xl p-3 mt-3">
                <p className="text-[14px] text-foreground">{m.msg}</p>
              </div>

              {/* Sent reply */}
              {reply && (
                <div className="mt-3 bg-brand-blue/5 rounded-xl p-3 border border-brand-blue/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-brand-blue uppercase">{t('common.you', 'You')}</span>
                    <span className="text-[10px] text-muted-foreground">Just now</span>
                  </div>
                  <p className="text-[13px] text-foreground leading-relaxed">{reply}</p>
                </div>
              )}

              {/* Reply button */}
              {!composerOpen && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleOpenComposer(i)}
                    className="flex-1 h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">
                    {reply ? t('engagement.editResponse', 'Edit Response') : t('engagement.reply', 'Reply')} ✦
                  </button>
                </div>
              )}

              {/* Inline Composer */}
              <AnimatePresence>
                {composerOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-brand-blue" />
                        <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wider">{t('engagement.smartReplies', '✦ Smart Replies')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {shimmer[i] ? (
                          [1, 2, 3].map(j => <div key={j} className="h-7 rounded-full bg-muted animate-pulse" style={{ width: 80 + j * 30 }} />)
                        ) : (
                          suggestions.map((s: string, si: number) => (
                            <button key={si} onClick={() => setComposerValues(prev => ({ ...prev, [i]: s }))}
                              className="text-[11px] px-3 py-1.5 rounded-full bg-brand-blue/10 text-brand-blue font-medium hover:bg-brand-blue/20 transition-colors text-left leading-snug">
                              ✦ {s.length > 50 ? s.slice(0, 50) + '…' : s}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <textarea
                        value={composerValues[i] || ''}
                        onChange={e => { if (e.target.value.length <= maxLen) setComposerValues(prev => ({ ...prev, [i]: e.target.value })); }}
                        rows={3}
                        placeholder={t('engagement.composerPlaceholder', '✦ AI can help — pick a suggestion above or write your own')}
                        className="w-full rounded-xl bg-muted border border-border-light p-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-blue resize-none leading-relaxed"
                        autoFocus
                      />
                      <div className="flex items-center justify-between mt-1 px-1">
                        <div className="flex items-center gap-1.5"><m.Logo size={14} /><span className="text-[10px] text-muted-foreground font-medium">{m.platform}</span></div>
                        <span className="text-[10px] text-muted-foreground">{(composerValues[i] || '').length}/{maxLen}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setOpenComposer(null)} className="h-9 px-4 rounded-xl border border-border text-muted-foreground text-[12px] font-medium btn-press">{t('common.cancel')}</button>
                      <button onClick={() => handleSend(i, m)} disabled={!(composerValues[i] || '').trim() || sendingIdx === i}
                        className="flex-1 h-9 rounded-xl gradient-btn text-primary-foreground text-[12px] font-bold btn-press disabled:opacity-50 flex items-center justify-center gap-1.5">
                        {sendingIdx === i ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>{t('common.send')} ✦</>}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

interface AIChatScreenProps {
  initialTab?: 'chat' | 'engagement';
  initialEngagementFilter?: string;
  initialInputValue?: string;
  onNavigate?: (screen: string) => void;
}

export const AIChatScreen = ({ initialTab = 'chat', initialEngagementFilter, initialInputValue, onNavigate }: AIChatScreenProps) => {
  const { t, i18n } = useTranslation();
  const { isFree, messagesUsed, maxMessages, useMessage } = useFreeTier();
  const [subTab, setSubTab] = useState<'chat' | 'engagement'>(initialTab);
  const welcomeMsg = { role: 'ai', text: "Good afternoon Malek! 👋 I've been analyzing your restaurant's performance. Your engagement is up 23% this week. What would you like to work on today?" };
  const [messages, setMessages] = useState<Array<{ role: string; text: string; hasCard?: boolean; cardType?: string }>>([welcomeMsg]);
  const [inputVal, setInputVal] = useState(initialInputValue || '');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(0);
  const [showChips, setShowChips] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; type: string } | null>(null);
  const [engFilter, setEngFilter] = useState(initialEngagementFilter || 'All');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Create Instagram post',
    'Launch campaign',
    'Analyze performance',
    'Reply to reviews',
    'Generate Ramadan plan',
  ];

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  };

  useEffect(() => { scrollToBottom(); }, []);

  const addAIMessage = (msg: { role: string; text: string; hasCard?: boolean; cardType?: string }, delay = 1500) => {
    setIsTyping(true);
    scrollToBottom();
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
        resolve();
      }, delay);
    });
  };

  const handleSend = async (text?: string) => {
    const msgText = (text || inputVal).trim();
    if (!msgText && !attachment) return;

    // Free tier check
    if (isFree && !useMessage()) {
      setLimitReached(true);
      return;
    }

    setMessages(prev => [...prev, { role: 'user', text: msgText || `[Attached: ${attachment?.name}]` }]);
    setInputVal('');
    setAttachment(null);
    setShowChips(false);
    scrollToBottom();

    const currentStep = step;
    setStep(prev => prev + 1);

    if (currentStep === 0) {
      await addAIMessage({ role: 'ai', text: "Great choice! What would you like to promote? I can see your Chicken Shawarma and your Smash Burger are your top sellers this week." });
    } else if (currentStep === 1) {
      await addAIMessage({ role: 'ai', text: "Perfect, I'll go with that! What vibe are you looking for — professional and clean, or casual and fun?" });
    } else if (currentStep === 2) {
      await addAIMessage({ role: 'ai', text: "Got it! Let me create something amazing for you. Generating your post now... ✦" });
      await addAIMessage({ role: 'ai', text: "Here's your post, ready to publish! 🔥", hasCard: true, cardType: 'burger' }, 2500);
    } else if (currentStep === 3) {
      await addAIMessage({ role: 'ai', text: "Want me to adapt this post for TikTok and Snapchat too? Or shall I schedule it for your peak hour tonight at 8 PM?" });
    } else if (currentStep === 4) {
      await addAIMessage({ role: 'ai', text: "Done! I've scheduled it for tonight at 8 PM and created versions for TikTok and Snapchat. They're in your Content Studio ready for review. Anything else I can help with?" });
    } else {
      await addAIMessage({ role: 'ai', text: "I'm here whenever you need me! You can ask me to create content, launch campaigns, check analytics, or respond to your reviews." });
    }
  };

  const filteredEngagement = engFilter === 'All' ? engagementMessages : engagementMessages.filter(m => m.filter === engFilter);

  const handleAttach = (type: string) => {
    setAttachment({ name: type === 'photo' ? 'food_photo.jpg' : type === 'video' ? 'kitchen_video.mp4' : 'menu.pdf', type });
    setAttachMenuOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background h-screen flex flex-col"
    >
      {/* Fixed Header */}
      <div className="flex-shrink-0 px-5 pt-3 pb-2 flex items-center justify-between bg-background z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center overflow-hidden">
            <img src="/speeda-logo-icon-white.svg" alt="Speeda AI" className="w-5 h-5 object-contain" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-foreground leading-tight">Speeda AI</h2>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-accent animate-pulse-dot" />
              <span className="text-[11px] text-green-accent">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {subTab === 'chat' && (
            <button onClick={() => setHistoryOpen(true)} className="w-10 h-10 rounded-xl border border-border flex items-center justify-center">
              <Clock size={16} className="text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => {
              if (subTab === 'engagement') {
                setSubTab('chat');
              }
              setMessages([welcomeMsg]);
              setInputVal('');
              setAttachment(null);
              setIsTyping(false);
              setStep(0);
              setShowChips(true);
            }}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center"
          >
            <Plus size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Fixed Sub-tabs */}
      <div className="flex-shrink-0 px-5 pb-3 bg-background z-30">
        <div className="bg-card rounded-2xl p-1 border border-border flex">
          {(['chat', 'engagement'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`flex-1 h-9 rounded-xl text-[13px] font-semibold transition-all ${
                subTab === tab ? 'bg-brand-blue text-primary-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {tab === 'chat' ? t('chat.chatTab', 'Chat') : t('chat.engagementTab', 'Engagement')}
              {tab === 'engagement' && <span className="ms-1.5 w-4 h-4 inline-flex items-center justify-center rounded-full bg-red-accent text-primary-foreground text-[9px] font-bold">6</span>}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'chat' ? (
        <>
          {/* Scrollable Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 space-y-4 pb-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={msg.role === 'user' ? 'flex justify-end' : ''}
              >
                {msg.role === 'ai' && (
                  <span className="text-[11px] font-semibold text-muted-foreground mb-1 block">✦ Speeda AI</span>
                )}
                <div className={`max-w-[85%] rounded-[20px] p-4 ${
                  msg.role === 'user'
                    ? 'gradient-hero rounded-br-[6px] shadow-sm'
                    : 'bg-card border border-border-light rounded-bl-[6px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                }`}>
                  <p className={`text-[14px] leading-[1.55] ${msg.role === 'user' ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {msg.text}
                  </p>
                </div>




                {msg.hasCard && msg.cardType === 'burger' && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mt-3 bg-card rounded-[20px] border border-border-light shadow-card overflow-hidden">
                    <div className="h-[3px] gradient-hero" />
                    <div className="p-4">
                      <img src={smashBurgerImg} alt="Smash Burger" className="w-full h-[200px] object-cover rounded-xl" />
                      <p className="text-[14px] text-foreground mt-4 leading-[1.55] whitespace-pre-line">
                        {"🍔 Our Signature Smash Burger — double smashed patty, aged cheddar, caramelized onions, and our secret sauce on a toasted brioche bun. One bite and you'll understand the hype.\n\nAvailable now for dine-in! Come taste the difference 🔥\n\n#SmashBurger #Riyadh #FoodLovers #BurgerTime #SaudiFoodie #مطاعم_الرياض"}
                      </p>
                      <div className="flex items-center gap-3 mt-4 text-[12px] text-muted-foreground">
                        <div className="flex items-center gap-1"><InstagramLogo size={14} /><span>Instagram</span></div>
                        <span>·</span><span>Feed Post</span><span>·</span><span>Est. reach ~3.2K</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-[11px] font-bold text-green-accent bg-green-soft px-2 py-0.5 rounded-md">Brand Match 96%</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button className="flex-1 h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold shadow-btn btn-press">Approve & Schedule</button>
                        <button className="h-10 px-4 rounded-xl border border-border text-muted-foreground text-[13px] font-medium btn-press">Edit</button>
                      </div>
                      <button className="w-full text-center text-[12px] text-brand-blue font-medium mt-2 btn-press">Want to see different versions?</button>
                    </div>
                  </motion.div>
                )}

                {msg.hasCard && msg.cardType === 'campaign' && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mt-3 bg-card rounded-[20px] border border-border-light shadow-card overflow-hidden">
                    <div className="h-[3px] gradient-hero" />
                    <div className="p-4">
                      <h4 className="text-[16px] font-bold text-foreground">Campaign Ready</h4>
                      <div className="mt-3 space-y-2 text-[13px]">
                        <div className="flex justify-between"><span className="text-muted-foreground">Platforms</span><span className="text-foreground font-medium">Instagram + Facebook</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="text-foreground font-medium">3 days</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span className="text-foreground font-medium">SAR 500</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Est. Reach</span><span className="text-foreground font-medium">~25K</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Est. Orders</span><span className="text-foreground font-medium">~45</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Expected ROAS</span><span className="text-green-accent font-bold">3.2x</span></div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button className="flex-1 h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold shadow-btn btn-press">Launch Campaign</button>
                        <button className="h-10 px-4 rounded-xl border border-border text-muted-foreground text-[13px] font-medium btn-press">Edit</button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {msg.hasCard && msg.cardType === 'ramadan' && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mt-3 bg-card rounded-[20px] border border-border-light shadow-card overflow-hidden">
                    <div className="h-[3px] gradient-hero" />
                    <div className="p-4">
                      <h4 className="text-[16px] font-bold text-foreground">🌙 Ramadan Content Strategy</h4>
                      <p className="text-[13px] text-muted-foreground mt-2">14-day plan · 3 platforms · 21 posts</p>
                      <div className="mt-3 space-y-1.5 text-[13px] text-foreground">
                        <p>📸 Iftar specials & food photography</p>
                        <p>🎬 Suhoor behind-the-scenes reels</p>
                        <p>⭐ Customer testimonials & reviews</p>
                        <p>🎁 Special Ramadan offers & giveaways</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button className="flex-1 h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold shadow-btn btn-press">View Full Plan</button>
                        <button className="h-10 px-4 rounded-xl border border-border text-muted-foreground text-[13px] font-medium btn-press">Edit</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Attachment preview */}
          {attachment && (
            <div className="flex-shrink-0 px-5 pt-2">
              <div className="bg-card rounded-2xl p-3 border border-border-light flex items-center gap-3">
                <div className="w-[60px] h-[60px] rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📷</span>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-foreground">{attachment.name}</p>
                  <p className="text-[11px] text-muted-foreground">2.4 MB</p>
                </div>
                <button onClick={() => setAttachment(null)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {/* Attachment Bottom Sheet */}
          <AnimatePresence>
            {attachMenuOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAttachMenuOpen(false)} className="fixed inset-0 bg-foreground/20 z-40" />
                <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-5 shadow-xl max-w-[430px] mx-auto">
                  <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
                  <div className="space-y-1">
                    {[
                      { icon: Camera, label: '📷 Take Photo', type: 'photo' },
                      { icon: Image, label: '📂 Choose from Library', type: 'photo' },
                      { icon: Film, label: '🎬 Video', type: 'video' },
                      { icon: FileText, label: '📁 Upload File', type: 'doc' },
                    ].map((item, i) => (
                      <button key={i} onClick={() => handleAttach(item.type)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-start">
                        <span className="text-[15px]">{item.label}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setAttachMenuOpen(false)} className="w-full h-11 mt-3 rounded-2xl border border-border text-muted-foreground text-[14px] font-medium">Cancel</button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex-shrink-0 px-5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] text-primary-foreground">✦</span>
                </div>
                <div className="bg-card rounded-2xl px-4 py-3 border border-border-light flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full gradient-hero" animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick prompt chips above input */}
          {showChips && (
            <div className="flex-shrink-0 px-5 pt-2 bg-background z-30">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {quickPrompts.map((p, j) => (
                  <button key={j} onClick={() => handleSend(p)} className="px-3.5 py-1.5 rounded-3xl bg-card text-brand-blue text-[12px] font-semibold border border-brand-blue/20 btn-press hover:bg-muted transition-colors whitespace-nowrap flex-shrink-0">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Message Limit Banner */}
          {subTab === 'chat' && <AIMessageLimitBanner />}

          {/* Limit Reached Card */}
          {limitReached && (
            <AIMessageLimitReached onUpgrade={() => { setLimitReached(false); setShowUpgrade(true); }} />
          )}

          {/* Fixed Input Bar */}
          <div className="flex-shrink-0 px-5 py-3 pb-[76px] bg-background z-30">
            <div className="bg-card rounded-[20px] border border-border-light flex items-center px-3 h-[52px] gap-2">
              <button className="flex-shrink-0 p-1">
                <Mic size={20} className="text-brand-blue" />
              </button>
              <button onClick={() => setAttachMenuOpen(true)} className="flex-shrink-0 p-1">
                <Paperclip size={18} className="text-brand-blue" />
              </button>
              <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask Speeda..."
                className="flex-1 bg-transparent border-none outline-none text-[14px] text-foreground placeholder:text-muted-foreground/50"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSend()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  inputVal || attachment ? 'gradient-hero shadow-sm' : 'bg-muted'
                }`}
              >
                <Send size={16} className={inputVal || attachment ? 'text-primary-foreground' : 'text-muted-foreground'} />
              </motion.button>
            </div>
          </div>
        </>
      ) : (
        /* Engagement Sub-tab with Smart Replies */
        <EngagementSubTab
          engFilter={engFilter}
          setEngFilter={setEngFilter}
          engagementFilters={engagementFilters}
          filteredEngagement={filteredEngagement}
          isFree={isFree}
          onNavigate={onNavigate}
          t={t}
          i18n={i18n}
        />
      )}

      {/* Chat History Panel */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHistoryOpen(false)} className="fixed inset-0 bg-foreground/20 z-40" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 end-0 bottom-0 w-[85%] max-w-[360px] bg-card z-50 shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border-light">
                <h3 className="text-[18px] font-bold text-foreground">{t('chat.history', 'Chat History')}</h3>
                <button onClick={() => setHistoryOpen(false)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
              <div className="p-4">
                <input placeholder={t('chat.searchConversations', 'Search conversations...')} className="w-full h-10 rounded-2xl bg-background border border-border-light px-4 text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none" />
              </div>
              <div className="flex-1 overflow-y-auto px-4 space-y-1">
                {chatHistory.map((conv, i) => (
                  <button key={i} onClick={() => setHistoryOpen(false)} className="w-full text-start p-3 rounded-xl hover:bg-muted transition-colors">
                    <p className="text-[14px] font-semibold text-foreground line-clamp-1">{conv.preview}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{conv.date}</p>
                    <p className="text-[12px] text-muted-foreground/70 mt-0.5 line-clamp-1">{conv.aiPreview}</p>
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-border-light">
                <button className="w-full h-11 rounded-2xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press">{t('chat.newChat', 'New Chat')}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <UpgradePrompt feature="Unlimited AI" benefit="get unlimited AI conversations and responses" open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </motion.div>
  );
};
