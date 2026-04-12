/**
 * MamoPay API client
 * Docs: https://business.mamopay.com/docs
 * Production base: https://business.mamopay.com/manage_api/v1
 * Sandbox base:    https://sandbox.dev.business.mamopay.com/manage_api/v1
 */

const BASE_URL = process.env.MAMOPAY_SANDBOX === 'true'
  ? 'https://sandbox.dev.business.mamopay.com/manage_api/v1'
  : 'https://business.mamopay.com/manage_api/v1';

function headers(): HeadersInit {
  return {
    'Authorization': `Bearer ${process.env.MAMOPAY_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function mamoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers: headers() });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`MamoPay ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

interface MamoLinkRaw {
  id: string;
  payment_url: string;
  title: string;
  amount: number;
  amount_currency: string;
  active: boolean;
}

export interface MamoLink {
  id: string;
  url: string;
  title: string;
  amount: number;
  currency: string;
}

export interface MamoSubscriptionOptions {
  frequency: 'monthly' | 'annually';
  frequency_interval: number; // e.g. 1 = every 1 month/year
  start_date: string;         // ISO date YYYY-MM-DD
  payment_quantity?: number;  // number of payments (omit for unlimited)
}

export interface CreateLinkOptions {
  title: string;
  amount: number;           // SAR (whole units)
  currency?: string;        // default: SAR
  return_url: string;
  failure_return_url?: string;
  description?: string;
  capture_customer_name?: boolean;
  send_customer_receipt?: boolean;
  subscription?: MamoSubscriptionOptions;
  /** Reference you can use to trace the payment in webhooks */
  external_id?: string;
}

/**
 * Create a MamoPay payment link.
 * For subscriptions pass `subscription` object.
 */
export async function createPaymentLink(opts: CreateLinkOptions): Promise<MamoLink> {
  const raw = await mamoFetch<MamoLinkRaw>('/links', {
    method: 'POST',
    body: JSON.stringify({
      title:                  opts.title,
      amount:                 opts.amount,
      currency:               opts.currency ?? 'SAR',
      return_url:             opts.return_url,
      failure_return_url:     opts.failure_return_url ?? opts.return_url,
      description:            opts.description,
      capture_customer_name:  opts.capture_customer_name ?? false,
      send_customer_receipt:  true,
      ...(opts.subscription ? { subscription: opts.subscription } : {}),
      ...(opts.external_id ? { external_id: opts.external_id } : {}),
    }),
  });
  return {
    id:       raw.id,
    url:      raw.payment_url,
    title:    raw.title,
    amount:   raw.amount,
    currency: raw.amount_currency,
  };
}

/**
 * Create a MamoPay subscription checkout link for a plan.
 * Returns the hosted payment URL to redirect the user to.
 */
export async function createSubscriptionLink(opts: {
  planName: string;
  amount: number;
  billingType: 'monthly' | 'yearly';
  userEmail?: string;
  returnUrl: string;
  cancelUrl?: string;
  externalId?: string;
}): Promise<MamoLink> {
  const frequency: 'monthly' | 'annually' = opts.billingType === 'yearly' ? 'annually' : 'monthly';
  const start_date = new Date().toISOString().slice(0, 10);

  return createPaymentLink({
    title:       `Speeda AI — ${opts.planName} Plan`,
    amount:      opts.amount,
    currency:    'SAR',
    return_url:  opts.returnUrl,
    failure_return_url: opts.cancelUrl ?? opts.returnUrl,
    description: `${opts.planName} plan — billed ${frequency}`,
    subscription: { frequency, frequency_interval: 1, start_date },
    external_id:  opts.externalId,
  });
}

/**
 * Create a MamoPay one-time payment link for token purchase.
 */
export async function createTokenPurchaseLink(opts: {
  packName: string;
  amount: number;
  returnUrl: string;
  cancelUrl?: string;
  externalId?: string;
}): Promise<MamoLink> {
  return createPaymentLink({
    title:      `Speeda AI — ${opts.packName}`,
    amount:     opts.amount,
    currency:   'SAR',
    return_url: opts.returnUrl,
    failure_return_url: opts.cancelUrl ?? opts.returnUrl,
    description: opts.packName,
    external_id: opts.externalId,
  });
}

/**
 * Cancel a MamoPay subscription.
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await mamoFetch(`/subscriptions/${subscriptionId}`, { method: 'DELETE' });
}

/**
 * Verify a MamoPay webhook request.
 * MamoPay secures webhooks via a Bearer token in the Authorization header
 * (configured as `auth_header` when setting up the webhook endpoint).
 */
export function verifyWebhookAuth(authHeader: string | null): boolean {
  const secret = process.env.MAMOPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

/**
 * Known MamoPay webhook event types.
 */
export type MamoWebhookEvent =
  | 'charge.succeeded'
  | 'charge.failed'
  | 'subscription.succeeded'
  | 'subscription.failed'
  | 'subscription.cancelled';

export interface MamoWebhookPayload {
  event:      MamoWebhookEvent;
  id:         string;           // charge or subscription ID
  link_id:    string;
  amount:     number;
  currency:   string;
  status:     string;
  external_id?: string;         // your reference from CreateLinkOptions.external_id
  created_at: string;
}
