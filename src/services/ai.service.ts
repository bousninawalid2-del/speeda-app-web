import { apiFetch } from '@/lib/api-client';

export interface AIChatMessage {
  role:    'user' | 'assistant';
  content: string;
}

export interface AIChatResponse {
  reply:      string;
  tokensUsed: number;
  history:    AIChatMessage[];
}

export const aiService = {
  chat: (message: string, history: AIChatMessage[] = []) =>
    apiFetch<AIChatResponse>('/ai', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};
