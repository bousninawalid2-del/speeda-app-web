import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';

export interface ChatMessage {
  role:    'user' | 'assistant';
  content: string;
}

interface SendMessageOptions {
  context?: string;
}

export function useAIChat() {
  const qc = useQueryClient();
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const sendMessage = useCallback(async (
    userMessage: string,
    options: SendMessageOptions = {}
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    const optimistic: ChatMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await apiFetch<{
        reply:      string;
        tokensUsed: number;
        history:    ChatMessage[];
      }>('/ai', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          context: options.context,
        }),
      });

      setMessages(res.history);
      // Invalidate token balance so it reflects deduction
      qc.invalidateQueries({ queryKey: ['tokens'] });
      return res.reply;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      setError(msg);
      // Remove the optimistic message on failure
      setMessages(prev => prev.slice(0, -1));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, qc]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
