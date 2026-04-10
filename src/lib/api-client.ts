/**
 * Thin API client that:
 *  - Reads the access token from localStorage (short-lived, 15 min)
 *  - Automatically refreshes it on 401 by calling /api/auth/refresh
 *    (the refresh token is stored in an httpOnly cookie — never exposed to JS)
 *  - Exposes typed helpers for every auth endpoint
 */

const BASE = '/api';

// ─── Storage keys ────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'speeda_access_token',
  USER:         'speeda_user',
} as const;

export interface AuthUser {
  id:    string;
  email: string;
  name:  string | null;
}

// ─── Token helpers ────────────────────────────────────────────────────────────
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Save access token + user profile. Refresh token is stored server-side in httpOnly cookie. */
export function saveSession(data: { accessToken: string; user: AuthUser }) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
}

/** Clear local session data. The httpOnly refresh cookie is cleared by the /api/auth/logout endpoint. */
export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

// ─── Core fetch with auto-refresh ─────────────────────────────────────────────
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    // No body — the browser sends the httpOnly cookie automatically
    const res = await fetch(`${BASE}/auth/refresh`, {
      method:      'POST',
      credentials: 'same-origin',
    });
    if (!res.ok) { clearSession(); return null; }
    const data = await res.json();
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    return data.accessToken as string;
  } catch {
    clearSession();
    return null;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'same-origin' });

  if (res.status === 401 && retry) {
    // Deduplicate concurrent refresh calls
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => { isRefreshing = false; });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      return apiFetch<T>(path, options, false); // retry once with new token
    }
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

// ─── Auth API helpers ─────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    apiFetch<{ message: string; userId: string }>('/auth/register', {
      method: 'POST',
      body:   JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body:   JSON.stringify(data),
    }),

  verify: (data: { userId: string; code: string }) =>
    apiFetch<{ accessToken: string; user: AuthUser }>('/auth/verify', {
      method: 'POST',
      body:   JSON.stringify(data),
    }),

  resendVerify: (userId: string) =>
    apiFetch<{ message: string }>('/auth/verify', {
      method: 'PUT',
      body:   JSON.stringify({ userId }),
    }),

  quickLogin: (email: string) =>
    apiFetch<{ message: string }>('/auth/quick-login', {
      method: 'POST',
      body:   JSON.stringify({ email }),
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body:   JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'PUT',
      body:   JSON.stringify({ token, newPassword }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body:   JSON.stringify({ currentPassword, newPassword }),
    }),

  me: () =>
    apiFetch<{ user: AuthUser & { phone?: string; isVerified: boolean; createdAt: string } }>('/auth/me'),

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),
};

// ─── Setup API ────────────────────────────────────────────────────────────────
export interface SetupPayload {
  // Activity
  business_name:         string;
  industry?:             string;
  country?:              string;
  location?:             string;
  opening_hours?:        string;
  business_size?:        string;
  year_founded?:         string;
  audience_target?:      string;
  unique_selling_point?: string;
  certifications?:       string;
  // Preference
  tone_of_voice?:        string;
  language_preference?:  string;
  business_description?: string;
  social_media_goals?:   string;
  color_primary?:        string;
  color_secondary?:      string;
  preferred_platforms?:  string;
  hashtags?:             string;
  emojis?:               string;
  other?:                string;
}

export interface ImageMeta {
  id:        string;
  filename:  string;
  mimetype:  string;
  size:      number;
  createdAt: string;
}

export const setupApi = {
  save: (data: SetupPayload) =>
    apiFetch<{ activity: unknown; preference: unknown }>('/setup', {
      method: 'POST',
      body:   JSON.stringify(data),
    }),

  get: () =>
    apiFetch<{ activity: unknown; preference: unknown; images: ImageMeta[] }>('/setup'),

  uploadImage: async (file: File): Promise<ImageMeta> => {
    const token = getAccessToken();
    const form  = new FormData();
    form.append('file', file);
    const res = await fetch('/api/setup/upload', {
      method:      'POST',
      credentials: 'same-origin',
      headers:     token ? { Authorization: `Bearer ${token}` } : {},
      body:        form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? 'Upload failed');
    }
    const data = await res.json() as { image: ImageMeta };
    return data.image;
  },

  deleteImage: (id: string) =>
    apiFetch<{ message: string }>(`/setup/upload?id=${id}`, { method: 'DELETE' }),
};

// ─── Profile API ──────────────────────────────────────────────────────────────
export const profileApi = {
  get:    () => apiFetch<{ user: Record<string, unknown> }>('/auth/me'),
  update: (data: { name?: string; phone?: string }) =>
    apiFetch<{ user: Record<string, unknown> }>('/auth/me', {
      method: 'PATCH',
      body:   JSON.stringify(data),
    }),
};

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsApi = {
  get: (period = '7d', platform?: string) => {
    const params = new URLSearchParams({ period });
    if (platform) params.set('platform', platform);
    return apiFetch<Record<string, unknown>>(`/analytics?${params}`);
  },
};

// ─── Tokens API ───────────────────────────────────────────────────────────────
export const tokensApi = {
  get: () =>
    apiFetch<{ balance: number; used: number; total: number; history: unknown[]; byAgent: Record<string, number> }>('/tokens'),
};

// ─── Posts API ────────────────────────────────────────────────────────────────
export const postsApi = {
  list: (params: { platform?: string; status?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.platform) qs.set('platform', params.platform);
    if (params.status)   qs.set('status',   params.status);
    if (params.page)     qs.set('page',     String(params.page));
    if (params.limit)    qs.set('limit',    String(params.limit));
    return apiFetch<{ posts: unknown[]; pagination: unknown }>(`/posts?${qs}`);
  },
  create: (data: { platform: string; caption: string; hashtags?: string; mediaUrls?: string[]; scheduledAt?: string; status?: string }) =>
    apiFetch<{ post: unknown }>('/posts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<{ post: unknown }>(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiFetch<{ message: string }>(`/posts/${id}`, { method: 'DELETE' }),
};

// ─── AI API ───────────────────────────────────────────────────────────────────
export const aiApi = {
  chat: (message: string, history?: Array<{ role: string; content: string }>, context?: string) =>
    apiFetch<{ reply: string; tokensUsed: number; history: Array<{ role: string; content: string }> }>('/ai', {
      method: 'POST',
      body:   JSON.stringify({ message, history, context }),
    }),
};

// ─── Billing API ─────────────────────────────────────────────────────────────
export interface BillingPayment {
  id:          string;
  amount:      number;
  currency:    string;
  status:      string;
  type:        string;
  description: string | null;
  createdAt:   string;
  metadata:    Record<string, unknown> | null;
}

export const billingApi = {
  getHistory: () =>
    apiFetch<{ payments: BillingPayment[] }>('/billing').then(r => r.payments),
  purchaseTokens: (packageId: string) =>
    apiFetch<{ checkoutUrl: string }>('/billing/token-purchase', {
      method: 'POST',
      body:   JSON.stringify({ packageId }),
    }),
};

// ─── ActionTasks API ──────────────────────────────────────────────────────────
export interface ActionTask {
  id:          string;
  userId:      string;
  strategyId:  string | null;
  title:       string;
  description: string | null;
  platform:    string | null;
  dueDate:     string | null;
  status:      string;
  priority:    string;
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateActionTaskInput {
  title:       string;
  description?: string;
  platform?:   string;
  dueDate?:    string;
  priority?:   string;
  strategyId?: string;
}

export interface UpdateActionTaskInput {
  title?:       string;
  description?: string;
  platform?:    string;
  dueDate?:     string;
  status?:      string;
  priority?:    string;
  strategyId?:  string;
}

export const actionTasksApi = {
  list: () =>
    apiFetch<{ tasks: ActionTask[] }>('/action-tasks').then(r => r.tasks),
  create: (data: CreateActionTaskInput) =>
    apiFetch<{ task: ActionTask }>('/action-tasks', {
      method: 'POST',
      body:   JSON.stringify(data),
    }),
  update: (id: string, data: UpdateActionTaskInput) =>
    apiFetch<{ task: ActionTask }>(`/action-tasks/${id}`, {
      method: 'PATCH',
      body:   JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/action-tasks/${id}`, { method: 'DELETE' }),
};

// ─── Competitors API ──────────────────────────────────────────────────────────
export interface Competitor {
  id:            string;
  userId:        string;
  name:          string;
  platform:      string;
  handle:        string;
  followers:     number;
  postsPerWeek:  number;
  avgEngagement: number;
  lastSynced:    string | null;
  createdAt:     string;
  updatedAt:     string;
}

export interface CreateCompetitorInput {
  name:           string;
  platform:       string;
  handle:         string;
  followers?:     number;
  postsPerWeek?:  number;
  avgEngagement?: number;
}

export interface UpdateCompetitorInput {
  name?:          string;
  platform?:      string;
  handle?:        string;
  followers?:     number;
  postsPerWeek?:  number;
  avgEngagement?: number;
  lastSynced?:    string;
}

export const competitorsApi = {
  list: () =>
    apiFetch<{ competitors: Competitor[] }>('/competitors').then(r => r.competitors),
  create: (data: CreateCompetitorInput) =>
    apiFetch<{ competitor: Competitor }>('/competitors', {
      method: 'POST',
      body:   JSON.stringify(data),
    }),
  update: (id: string, data: UpdateCompetitorInput) =>
    apiFetch<{ competitor: Competitor }>(`/competitors/${id}`, {
      method: 'PATCH',
      body:   JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`/competitors/${id}`, { method: 'DELETE' }),
};

// ─── Strategy API ─────────────────────────────────────────────────────────────
export interface Strategy {
  id:              string;
  userId:          string;
  name:            string | null;
  status:          string;
  periodStartDate: string | null;
  periodEndDate:   string | null;
  weekCount:       number;
  goal:            string | null;
  platforms:       string | null;
  n8nSessionId:    string | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface CreateStrategyInput {
  name?:            string;
  goal?:            string;
  platforms?:       string;
  weekCount?:       number;
  periodStartDate?: string;
  periodEndDate?:   string;
}

export interface UpdateStrategyInput {
  name?:            string;
  goal?:            string;
  platforms?:       string;
  weekCount?:       number;
  status?:          string;
  periodStartDate?: string;
  periodEndDate?:   string;
}

export const strategyApi = {
  list: () =>
    apiFetch<{ strategies: Strategy[] }>('/strategies').then(r => r.strategies),
  get: (id: string) =>
    apiFetch<{ strategy: Strategy }>(`/strategies/${id}`),
  create: (data: CreateStrategyInput) =>
    apiFetch<{ strategy: Strategy }>('/strategies', {
      method: 'POST',
      body:   JSON.stringify(data),
    }),
  update: (id: string, data: UpdateStrategyInput) =>
    apiFetch<{ strategy: Strategy }>(`/strategies/${id}`, {
      method: 'PATCH',
      body:   JSON.stringify(data),
    }),
};

// ─── Social API ───────────────────────────────────────────────────────────────
export const socialApi = {
  getAccounts: () =>
    apiFetch<{ accounts: Array<{ platform: string; connected: boolean; followers: number; username?: string }> }>('/social'),
  connect: () =>
    apiFetch<{ url: string }>('/social/connect', { method: 'POST' }),
  disconnect: (platform: string) =>
    apiFetch<{ message: string }>('/social/disconnect', { method: 'POST', body: JSON.stringify({ platform }) }),
};
