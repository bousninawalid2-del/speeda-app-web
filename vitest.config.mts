import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Unit tests for the AI chat feature (web chat + WhatsApp → n8n pipeline).
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'src/app/api/chat/route.ts',
        'src/app/api/chat/upload/route.ts',
        'src/app/api/n8n/respond/route.ts',
        'src/app/api/webhooks/whatsapp/route.ts',
        'src/lib/n8n-payload.ts',
        'src/lib/n8n-reply.ts',
        'src/lib/n8n-validate.ts',
        'src/lib/n8n-guard.ts',
        'src/lib/rate-limit.ts',
        'src/lib/trace.ts',
        'src/screens/AIChatScreen.tsx',
      ],
      thresholds: { lines: 70, statements: 70, functions: 70, branches: 70 },
    },
  },
});
