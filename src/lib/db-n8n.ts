import { Pool } from 'pg';

// Singleton pg Pool for the n8n "datatest" database.
// Uses DATABASE_N8N_URL environment variable.
// Example: DATABASE_N8N_URL=postgresql://postgres:PASSWORD@localhost:5432/datatest
const globalForN8n = globalThis as unknown as { n8nPool: Pool };

export const n8nPool: Pool =
  globalForN8n.n8nPool ??
  new Pool({ connectionString: process.env.DATABASE_N8N_URL });

if (process.env.NODE_ENV !== 'production') globalForN8n.n8nPool = n8nPool;
