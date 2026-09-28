/**
 * Structured logging tagged with the sessionId shared between the Speeda
 * backend and n8n, so a request can be traced end-to-end across both
 * systems' logs (Speeda API logs + n8n execution log viewer).
 */
export function traceLog(event: string, sessionId: string, meta?: Record<string, unknown>) {
  console.log(`[trace] session=${sessionId} event=${event}`, meta ? JSON.stringify(meta) : '');
}
