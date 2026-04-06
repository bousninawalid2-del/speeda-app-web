import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatOption {
  id: string;
  title: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  options?: ChatOption[];
  timestamp: Date;
}

interface AIChatScreenProps {
  initialTab?: string;
  initialInputValue?: string;
  initialEngagementFilter?: string;
  onNavigate?: (screen: string) => void;
  onSendMessage?: (message: string, history: Array<{ role: 'user' | 'assistant'; content: string }>) => Promise<string | null>;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const AIChatScreen = ({ initialInputValue, onSendMessage }: AIChatScreenProps) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Speeda assistant. How can I help you today?',
      type: 'text',
      timestamp: new Date(),
    },
  ]);
  const [inputVal, setInputVal] = useState(initialInputValue ?? '');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [pendingUpload, setPendingUpload] = useState<{
    mediaId: string;
    mediaUrl: string;
    mediaType: 'image' | 'voice' | 'pdf';
    filename: string;
  } | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // ── Polling for async n8n responses ──────────────────────────────────────
  const startPolling = useCallback((sid: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('speeda_access_token') : null;
        const res = await fetch(`/api/n8n/respond?sessionId=${encodeURIComponent(sid)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(prev => [
            ...prev,
            ...data.messages.map((m: { reply: string; type?: string; mediaUrl?: string; options?: ChatOption[] }) => ({
              role: 'assistant' as const,
              content: m.reply,
              type: m.type ?? 'text',
              mediaUrl: m.mediaUrl,
              options: m.options,
              timestamp: new Date(),
            })),
          ]);
          setIsTyping(false);
          scrollToBottom();
        }
      } catch { /* polling errors are silent */ }
    }, 3000);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // ── File upload handler ──────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('speeda_access_token') : null;
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? 'Upload failed');
        return;
      }

      const data = await res.json();
      setPendingUpload({
        mediaId: data.id,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        filename: data.filename,
      });
    } catch {
      alert('Upload failed. Please try again.');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = async (text?: string, interactive?: { isInteractive: boolean; interactiveTitle: string }) => {
    const msgText = (text || inputVal).trim();
    if (!msgText && !pendingUpload) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: msgText || (pendingUpload ? `📎 ${pendingUpload.filename}` : ''),
      type: pendingUpload?.mediaType === 'image' ? 'image' : 'text',
      mediaUrl: pendingUpload?.mediaType === 'image' ? pendingUpload.mediaUrl : undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);
    scrollToBottom();

    const upload = pendingUpload;
    setPendingUpload(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('speeda_access_token') : null;
      const authRes = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          message: msgText || `[file: ${upload?.filename}]`,
          sessionId,
          ...(interactive ?? {}),
          ...(upload ? { mediaId: upload.mediaId, mediaType: upload.mediaType } : {}),
        }),
      });

      const data = await authRes.json();

      if (!authRes.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error ?? 'Sorry, the chat service is currently unavailable. Please try again later.',
          type: 'text',
          timestamp: new Date(),
        }]);
        setIsTyping(false);
      } else {
        const newSessionId = data.sessionId ?? sessionId;
        if (newSessionId) {
          setSessionId(newSessionId);
          startPolling(newSessionId);
        }

        // If n8n returned a reply synchronously
        if (data.reply) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.reply,
            type: data.type ?? 'text',
            mediaUrl: data.mediaUrl,
            options: data.options,
            timestamp: new Date(),
          }]);
          setIsTyping(false);
        }
        // If no reply, keep typing indicator — polling will pick up the async response
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please check your network and try again.',
        type: 'text',
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    } finally {
      scrollToBottom();
    }
  };

  // ── Handle interactive option click ──────────────────────────────────────
  const handleOptionClick = (option: ChatOption) => {
    handleSend(option.title, { isInteractive: true, interactiveTitle: option.id });
  };

  const handleNewChat = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setMessages([{
      role: 'assistant',
      content: 'Hello! I\'m your Speeda assistant. How can I help you today?',
      type: 'text',
      timestamp: new Date(),
    }]);
    setSessionId(undefined);
    setInputVal('');
    setPendingUpload(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background h-screen flex flex-col"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-3 pb-3 flex items-center justify-between bg-background z-30 border-b border-border-light">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center">
            <span className="text-primary-foreground text-[16px]">✦</span>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-foreground leading-tight">{t('chat.title')}</h2>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-accent animate-pulse-dot" />
              <span className="text-[11px] text-green-accent">{t('chat.online')}</span>
            </div>
          </div>
        </div>
        <button onClick={handleNewChat}
          className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <Plus size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 space-y-4 py-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i === messages.length - 1 ? 0.1 : 0 }}
            className={msg.role === 'user' ? 'flex justify-end' : ''}
          >
            {msg.role === 'assistant' && (
              <span className="text-[11px] font-semibold text-muted-foreground mb-1 block">✦ Speeda</span>
            )}
            <div className={`max-w-[85%] rounded-[20px] p-4 ${
              msg.role === 'user'
                ? 'gradient-hero rounded-br-[6px] shadow-sm'
                : 'bg-card border border-border-light rounded-bl-[6px] shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
            }`}>
              {/* Media content */}
              {msg.mediaUrl && msg.type === 'image' && (
                <img src={msg.mediaUrl} alt="" className="w-full rounded-xl mb-3 max-h-[300px] object-cover" />
              )}
              {msg.mediaUrl && msg.type === 'video' && (
                <video src={msg.mediaUrl} controls className="w-full rounded-xl mb-3 max-h-[300px]" />
              )}
              {msg.mediaUrl && msg.type === 'file' && (
                <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-muted rounded-xl p-3 mb-3 hover:bg-muted/80 transition-colors">
                  <span className="text-lg">📄</span>
                  <span className="text-[13px] font-medium text-brand-blue underline">Download file</span>
                </a>
              )}

              {/* Text content */}
              <p className={`text-[14px] leading-[1.55] whitespace-pre-wrap ${
                msg.role === 'user' ? 'text-primary-foreground' : 'text-foreground'
              }`}>
                {msg.content}
              </p>

              {/* Interactive options (buttons from n8n) */}
              {msg.options && msg.options.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {msg.options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionClick(opt)}
                      className="w-full text-left px-4 py-2.5 rounded-xl border border-border-light
                        bg-background hover:bg-muted transition-colors text-[13px] font-medium text-foreground"
                    >
                      {opt.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <p className={`text-[10px] mt-1 ${
                msg.role === 'user' ? 'text-primary-foreground/50' : 'text-muted-foreground'
              }`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] text-primary-foreground">✦</span>
            </div>
            <div className="bg-card rounded-2xl px-4 py-3 border border-border-light flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full gradient-hero"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pending upload preview */}
      {pendingUpload && (
        <div className="flex-shrink-0 px-5 py-2">
          <div className="flex items-center gap-2 bg-muted rounded-xl p-2.5">
            {pendingUpload.mediaType === 'image' ? (
              <img src={pendingUpload.mediaUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <span className="text-lg">{pendingUpload.mediaType === 'voice' ? '🎤' : '📄'}</span>
            )}
            <span className="text-[13px] text-foreground flex-1 truncate">{pendingUpload.filename}</span>
            <button onClick={() => setPendingUpload(null)} className="p-1 hover:bg-background rounded-lg transition-colors">
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="flex-shrink-0 px-5 py-3 pb-[76px] bg-background z-30">
        <div className="bg-card rounded-[20px] border border-border-light flex items-center px-3 h-[52px] gap-2">
          {/* File upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*,.pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isTyping}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-muted transition-colors"
          >
            <Paperclip size={16} className="text-muted-foreground" />
          </button>

          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask Speeda..."
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-foreground placeholder:text-muted-foreground/50"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSend()}
            disabled={(!inputVal.trim() && !pendingUpload) || isTyping}
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              (inputVal.trim() || pendingUpload) && !isTyping ? 'gradient-hero shadow-sm' : 'bg-muted'
            }`}
          >
            <Send size={16} className={(inputVal.trim() || pendingUpload) && !isTyping ? 'text-primary-foreground' : 'text-muted-foreground'} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
