import '@testing-library/jest-dom/vitest';

// jwt.ts reads these at import time.
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.ADMIN_SECRET = 'test-admin-secret';
process.env.N8N_WEBHOOK_URL = 'https://n8n.test/webhook/root';
