import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Crown, Zap, TrendingUp, MessageSquare, Send, ChevronDown } from 'lucide-react';
import { useFreeTier } from './FreeTier';

// ── Sales Agent Context (shared state) ──
const DISMISS_KEY = 'speeda_sales_dismiss';
const LOCKED_TAP_KEY = 'speeda_locked_taps';
const TOKEN_POPUP_KEY = 'speeda_token_popup_shown';

const getSalesDismissed = (): boolean => {
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  return Date.now() - parseInt(ts) < 24 * 60 * 60 * 1000;
};

const getLockedTapCount = (): number => {
  return parseInt(localStorage.getItem(LOCKED_TAP_KEY) || '0');
};

export const incrementLockedTap = () => {
  const count = getLockedTapCount() + 1;
  localStorage.setItem(LOCKED_TAP_KEY, count.toString());
};

// Track which percentage thresholds the popup has been shown at
const getShownThresholds = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_POPUP_KEY) || '[]');
  } catch { return []; }
};

const markThresholdShown = (threshold: number) => {
  const shown = getShownThresholds();
  if (!shown.includes(threshold)) {
    shown.push(threshold);
    localStorage.setItem(TOKEN_POPUP_KEY, JSON.stringify(shown));
  }
};

const shouldShowTokenPopup = (tokensRemaining: number, tokensLimit: number): boolean => {
  if (tokensLimit <= 0) return false;
  const percentRemaining = (tokensRemaining / tokensLimit) * 100;
  if (percentRemaining > 20) return false;
  
  const shown = getShownThresholds();
  // Show at 20%, 10%, 5% thresholds
  if (percentRemaining <= 5 && !shown.includes(5)) return true;
  if (percentRemaining <= 10 && !shown.includes(10)) return true;
  if (percentRemaining <= 20 && !shown.includes(20)) return true;
  return false;
};

const getCurrentThreshold = (tokensRemaining: number, tokensLimit: number): number => {
  const percentRemaining = (tokensRemaining / tokensLimit) * 100;
  if (percentRemaining <= 5) return 5;
  if (percentRemaining <= 10) return 10;
  return 20;
};

// ── Chat Messages ──
interface ChatMessage {
  id: number;
  role: 'agent' | 'user';
  text: string;
}

const agentResponses: Record<string, string[]> = {
  pricing: [
    "Great question! Here's a quick breakdown:\n\n🟢 **Starter** (549﷼/mo) — 200 tokens, 3 platforms, basic analytics\n🔵 **Pro** (1,199﷼/mo) — 800 tokens, 10 platforms, full features\n🟣 **Business** (2,499﷼/mo) — 3,000 tokens, competitor intel, priority support\n\nSave 20% with annual billing!",
    "Which plan sounds like a fit? I can help you decide based on your usage.",
  ],
  tokens: [
    "Tokens power every AI action — content generation, rewrites, translations, and more.\n\nYour current plan includes a monthly allowance. If you need more, you can top up anytime:\n• 200 tokens — 99﷼\n• 500 tokens — 199﷼\n• 1,500 tokens — 499﷼\n• 5,000 tokens — 1,299﷼",
  ],
  competitor: [
    "Competitor Intelligence is available on the **Business plan** (2,499﷼/mo). It includes:\n\n🔍 Track up to 5 competitors\n📊 Engagement & follower comparison\n🎯 AI counter-move suggestions\n📄 Competitive PDF reports\n\nWant me to help you upgrade?",
  ],
  upgrade: [
    "Upgrading is simple! Just go to Settings → Subscription and pick your plan. Annual billing saves you 20%.\n\nBased on your usage, I'd recommend **Pro** — it unlocks everything except Competitor Intelligence.",
  ],
  default: [
    "I'd be happy to help! I can answer questions about:\n\n• 💳 Plans & pricing\n• 🪙 Tokens & usage\n• 🔒 Locked features\n• 🚀 Which plan fits you best\n\nWhat would you like to know?",
  ],
};

const getAgentResponse = (input: string): string => {
  const lower = input.toLowerCase();
  if (lower.includes('price') || lower.includes('plan') || lower.includes('cost') || lower.includes('how much')) {
    return agentResponses.pricing[Math.floor(Math.random() * agentResponses.pricing.length)];
  }
  if (lower.includes('token') || lower.includes('credit')) {
    return agentResponses.tokens[0];
  }
  if (lower.includes('competitor') || lower.includes('watch')) {
    return agentResponses.competitor[0];
  }
  if (lower.includes('upgrade') || lower.includes('switch')) {
    return agentResponses.upgrade[0];
  }
  return agentResponses.default[0];
};

// ── Contextual opening messages ──
const contextualMessages: Record<string, string> = {
  competitorIntelligence: "I see you're interested in **Competitor Intelligence**! This feature lets you track competitors, compare performance, and get AI counter-moves. It's available on the Business plan (2,499﷼/mo). Want to know more?",
  analytics: "Looking at **Advanced Analytics**? The Pro plan (1,199﷼/mo) unlocks the full analytics suite with platform breakdowns, trend charts, and AI insights. Shall I compare plans for you?",
  dmManagement: "**DM Management** with AI auto-responses is available on Pro (1,199﷼/mo). It helps you respond to customers faster with smart templates. Interested?",
  variations: "**Post Variations A/B** lets you generate multiple versions of your content to find what works best. Available on Pro (1,199﷼/mo).",
  translation: "**Post Translation** supports 6+ languages with AI-powered accuracy. Available on Pro. Want to upgrade?",
  default: "Hi! 👋 I'm your Plan Advisor. I can help you find the perfect plan based on your needs. What would you like to know?",
};

// ── Props ──
interface SalesAgentProps {
  onNavigate: (screen: string) => void;
  currentPlan?: string;
  tokensUsed?: number;
  tokensLimit?: number;
  postsThisMonth?: number;
  trialDaysRemaining?: number;
  salesEnabled?: boolean;
}

interface SalesChatProps {
  onNavigate: (screen: string) => void;
  onClose: () => void;
  contextFeature?: string;
}

// ── Mini Sales Chat Widget ──
export const SalesChatWidget = ({ onNavigate, onClose, contextFeature }: SalesChatProps) => {
  const openingMessage = contextFeature && contextualMessages[contextFeature]
    ? contextualMessages[contextFeature]
    : contextualMessages.default;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'agent', text: openingMessage },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const response = getAgentResponse(userMsg.text);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'agent', text: response }]);
      setTyping(false);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-4 end-4 z-[80] w-[380px] max-w-[calc(100vw-32px)] shadow-2xl rounded-2xl overflow-hidden border border-border-light"
    >
      {/* Header */}
      <div className="gradient-hero px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary-foreground" />
          <div>
            <p className="text-[14px] font-bold text-primary-foreground">✦ Speeda</p>
            <p className="text-[10px] text-primary-foreground/70">Plan Advisor</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
          <X size={16} className="text-primary-foreground" />
        </button>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="bg-card h-[320px] max-h-[50vh] overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-brand-blue text-primary-foreground rounded-be-md'
                : 'bg-muted text-foreground rounded-bs-md'
            }`}>
              {msg.text.split('\n').map((line, i) => (
                <span key={i}>
                  {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={j}>{part.slice(2, -2)}</strong>
                      : part
                  )}
                  {i < msg.text.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bs-md px-4 py-3 flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/40"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {messages.length <= 2 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['Compare plans', 'How do tokens work?', 'Which plan for me?'].map(q => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="text-[11px] px-3 py-1.5 rounded-full bg-brand-blue/10 text-brand-blue font-medium hover:bg-brand-blue/20 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border-light p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about plans..."
          className="flex-1 h-10 px-4 rounded-xl bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center btn-press disabled:opacity-40"
        >
          <Send size={16} className="text-primary-foreground" />
        </button>
      </div>
    </motion.div>
  );
};

// ── Main Sales Agent (nudge + chat toggle) ──
export const SalesAgent = ({
  onNavigate,
  currentPlan = 'starter',
  tokensUsed = 420,
  tokensLimit = 500,
  postsThisMonth = 11,
  trialDaysRemaining = 14,
  salesEnabled = true,
}: SalesAgentProps) => {
  const [dismissed, setDismissed] = useState(getSalesDismissed());
  const [minimized, setMinimized] = useState(false);
  const [showChat, setShowChat] = useState(false);

  if (!salesEnabled || dismissed) return null;

  const tokensRemaining = tokensLimit - tokensUsed;
  const tokenPercent = (tokensUsed / tokensLimit) * 100;
  const lockedTaps = getLockedTapCount();
  const showTokenPopup = shouldShowTokenPopup(tokensRemaining, tokensLimit);

  // Determine nudge
  let nudgeTitle = '';
  let nudgeMessage = '';
  let nudgeCta = '';
  let nudgeAction = '';
  let nudgeIcon = Sparkles;
  let showNudge = false;

  if (showTokenPopup) {
    showNudge = true;
    nudgeIcon = Zap;
    nudgeTitle = tokensRemaining <= (tokensLimit * 0.05) ? '⚡ Almost out of tokens!' : 'Running low on tokens';
    nudgeMessage = `${tokensRemaining} tokens remaining. Top up to keep AI running.`;
    nudgeCta = 'Top Up';
    nudgeAction = 'tokens';
  } else if (lockedTaps >= 3) {
    showNudge = true;
    nudgeIcon = Crown;
    nudgeTitle = 'Unlock more features';
    nudgeMessage = "You've been exploring locked features. Want me to explain which plan fits?";
    nudgeCta = 'Chat with Speeda →';
    nudgeAction = 'chat';
  } else if (trialDaysRemaining <= 2 && trialDaysRemaining > 0 && currentPlan === 'free_trial') {
    showNudge = true;
    nudgeIcon = TrendingUp;
    nudgeTitle = `⏳ Trial ends in ${trialDaysRemaining} day${trialDaysRemaining > 1 ? 's' : ''}`;
    nudgeMessage = 'Want help picking the right plan?';
    nudgeCta = 'Compare Plans →';
    nudgeAction = 'planComparison';
  } else if (postsThisMonth >= 15 && currentPlan === 'starter') {
    showNudge = true;
    nudgeIcon = TrendingUp;
    nudgeTitle = "🚀 You're super active!";
    nudgeMessage = `${postsThisMonth} posts this month! Pro might be a better fit with more tokens and features.`;
    nudgeCta = 'Explore Pro →';
    nudgeAction = 'planComparison';
  }

  const handleDismiss24h = () => {
    // Mark current threshold as shown for token popup
    if (showTokenPopup) {
      markThresholdShown(getCurrentThreshold(tokensRemaining, tokensLimit));
    }
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
  };

  const handleCta = () => {
    if (showTokenPopup) {
      markThresholdShown(getCurrentThreshold(tokensRemaining, tokensLimit));
    }
    if (nudgeAction === 'chat') {
      setShowChat(true);
    } else if (nudgeAction === 'tokens') {
      // Navigate to tokens page — it will scroll to packs section
      onNavigate('tokens');
    } else {
      onNavigate(nudgeAction);
    }
  };

  const handleChatButton = () => {
    if (showTokenPopup) {
      markThresholdShown(getCurrentThreshold(tokensRemaining, tokensLimit));
    }
    // Navigate to main AI Chat with pre-filled message
    onNavigate('chat-prefill-tokens');
  };

  // Chat mode
  if (showChat) {
    return (
      <AnimatePresence>
        <SalesChatWidget onNavigate={onNavigate} onClose={() => setShowChat(false)} />
      </AnimatePresence>
    );
  }

  // Minimized FAB
  if (minimized) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        onClick={() => setMinimized(false)}
        className="fixed bottom-24 end-5 z-[60] w-12 h-12 rounded-full gradient-hero shadow-btn flex items-center justify-center btn-press"
      >
        <Sparkles size={20} className="text-primary-foreground" />
      </motion.button>
    );
  }

  if (!showNudge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-24 start-4 end-4 z-[60] max-w-[400px] mx-auto"
    >
      <div className="bg-card rounded-2xl border border-border-light shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-light">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-brand-blue" />
            <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wide">✦ Speeda</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimized(true)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
            <button onClick={handleDismiss24h} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <p className="text-[14px] font-bold text-foreground">{nudgeTitle}</p>
          <p className="text-[12px] text-muted-foreground mt-1">{nudgeMessage}</p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCta} className="flex-1 h-10 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold btn-press flex items-center justify-center gap-1.5">
              {nudgeCta}
            </button>
            <button onClick={handleChatButton} className="h-10 px-4 rounded-xl bg-muted text-muted-foreground text-[12px] font-bold btn-press flex items-center gap-1.5">
              <MessageSquare size={14} /> Chat
            </button>
          </div>
        </div>

        {showTokenPopup && (
          <div className="px-4 pb-3">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${tokenPercent}%` }}
                className={`h-full rounded-full ${tokenPercent >= 95 ? 'bg-destructive' : 'bg-orange'}`} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 text-center">{tokensRemaining} / {tokensLimit} tokens remaining</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};